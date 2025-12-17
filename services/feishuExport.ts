import { FeishuConfig, Message } from '../types';
import { fetchWithProxy, Logger } from './proxyUtils';

// --- Helpers ---

const getTenantToken = async (appId: string, appSecret: string, log: Logger): Promise<string> => {
    log('info', 'Feishu: Getting Tenant Access Token');
    const authUrl = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
    const res = await fetchWithProxy(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    }, log);

    if (!res.ok) throw new Error(`Auth Failed (${res.status})`);
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Auth Logic Error: ${data.msg}`);
    log('info', 'Feishu: Token acquired');
    return data.tenant_access_token;
};

const getSpaceIdFromToken = async (token: string, wikiToken: string, log: Logger): Promise<string> => {
    log('info', `Feishu: Resolving Space ID for token '${wikiToken}'`);
    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${wikiToken}`;
    const res = await fetchWithProxy(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    }, log);

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Get Node Info Failed (${res.status}): ${txt}`);
    }
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Get Node Info Error (${data.code}): ${data.msg}`);

    // Support both data.node.space_id (standard) and user suggestion data.space.space_id
    const spaceId = data.data?.node?.space_id || data.data?.space?.space_id;
    if (!spaceId) {
        log('error', 'Node Info Data', data);
        throw new Error("Could not extract Space ID from Node Info");
    }
    return spaceId;
};

const createDocument = async (token: string, title: string, log: Logger): Promise<string> => {
    log('info', `Feishu: Creating blank Docx: "${title}"`);
    const url = "https://open.feishu.cn/open-apis/docx/v1/documents";
    const res = await fetchWithProxy(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ title: title })
    }, log);

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create Doc Failed (${res.status}): ${txt}`);
    }
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Create Doc Error (${data.code}): ${data.msg}`);

    const docId = data.data?.document?.document_id;
    if (!docId) throw new Error("Created document but got no document_id");
    log('info', `Feishu: Blank document created (${docId})`);
    return docId;
};

const moveDocToWiki = async (token: string, spaceId: string, parentToken: string, docId: string, title: string, log: Logger): Promise<string> => {
    log('info', `Feishu: Moving document to Wiki under node '${parentToken}'`);
    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes`;
    const res = await fetchWithProxy(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            parent_node_token: parentToken,
            obj_token: docId,
            obj_type: "docx",
            node_type: "origin",
            title: title
        })
    }, log);

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Move to Wiki Failed (${res.status}): ${txt}`);
    }
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Move to Wiki Error (${data.code}): ${data.msg}`);

    const finalId = data.data?.node?.obj_token;
    log('info', `Feishu: Document successfully added to Wiki. ID: ${finalId}`);
    return finalId;
};

const buildContentBlocks = (title: string, systemPrompt: string, history: Message[]) => {
    const children: any[] = [];
    
    // Title
    children.push({
        block_type: 3, 
        heading1: { elements: [{ text_run: { content: title, text_element_style: { bold: true } } }], style: {} }
    });

    // System Prompt
    if (systemPrompt && systemPrompt.trim()) {
        children.push({
            block_type: 5, 
            heading3: { elements: [{ text_run: { content: "⚙️ System Prompt", text_element_style: { bold: true } } }], style: {} }
        });
        children.push({
            block_type: 2, 
            text: { elements: [{ text_run: { content: systemPrompt, text_element_style: {} } }], style: {} }
        });
        children.push({ block_type: 2, text: { elements: [{ text_run: { content: " ", text_element_style: {} } }], style: {} } });
    }

    // Messages
    history.forEach(msg => {
        children.push({
            block_type: 5, 
            heading3: { elements: [{ text_run: { content: msg.role === 'user' ? "👤 User" : "🤖 Assistant", text_element_style: { bold: true } } }], style: {} }
        });

        if (msg.content && msg.content.trim()) {
            children.push({
                block_type: 2,
                text: { elements: [{ text_run: { content: msg.content, text_element_style: {} } }], style: {} }
            });
        }

        if (msg.attachments && msg.attachments.length > 0) {
             children.push({
                block_type: 2,
                text: { elements: [{ text_run: { content: `[Attachments: ${msg.attachments.map(a => a.name).join(', ')}]`, text_element_style: { italic: true } } }], style: {} }
            });
        }
        
        children.push({ block_type: 2, text: { elements: [{ text_run: { content: " ", text_element_style: {} } }], style: {} } });
    });

    return children;
};

// --- Main Function ---

export const exportToFeishu = async (config: FeishuConfig, history: Message[], systemPrompt: string, log: Logger) => {
    // 0. Validation
    const appId = config.appId?.trim();
    const appSecret = config.appSecret?.trim();
    const wikiToken = config.wikiNodeToken?.trim().replace(/^["']|["']$/g, '');

    if (!appId || !appSecret || !wikiToken) {
        throw new Error("Feishu configuration (App ID, Secret, Wiki Token) is incomplete.");
    }

    // 1. Logic Execution
    const token = await getTenantToken(appId, appSecret, log);
    const spaceId = await getSpaceIdFromToken(token, wikiToken, log);

    log('info', `Feishu: Resolved Space ID: ${spaceId}`);

    const dateStr = new Date().toLocaleString();
    const docTitle = `Chat Export - ${dateStr}`;
    
    // Create Doc (independent) -> Move to Wiki (attach)
    const rawDocId = await createDocument(token, docTitle, log);
    const finalDocId = await moveDocToWiki(token, spaceId, wikiToken, rawDocId, docTitle, log);

    // 2. Content Writing
    const blocks = buildContentBlocks(docTitle, systemPrompt, history);
    
    const BATCH_SIZE = 50;
    const batchUrl = `https://open.feishu.cn/open-apis/docx/v1/documents/${finalDocId}/blocks/${finalDocId}/children`;

    for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
        const batch = blocks.slice(i, i + BATCH_SIZE);
        log('request', `Feishu: Writing content batch ${Math.floor(i/BATCH_SIZE) + 1}`);
        
        const res = await fetchWithProxy(batchUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8' 
            },
            body: JSON.stringify({ children: batch })
        }, log);

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Write Content Failed (${res.status}): ${txt}`);
        }
        const data = await res.json();
        if (data.code !== 0) throw new Error(`Write Content Error (${data.code}): ${data.msg}`);
    }

    log('info', 'Feishu Wiki Export Complete');
};