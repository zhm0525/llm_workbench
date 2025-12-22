import { NotionConfig, Message } from '../types';
import { fetchWithProxy, Logger } from './proxyUtils';

const BATCH_SIZE = 100;
const MAX_BLOCK_LENGTH = 2000;

// --- Helpers ---

const createTextChunks = (text: string) => {
    const textChunks = [];
    for (let i = 0; i < text.length; i += MAX_BLOCK_LENGTH) {
      textChunks.push(text.substring(i, i + MAX_BLOCK_LENGTH));
    }
    return textChunks;
};

const buildNotionBlocks = (resolvedSystemPrompt: string, history: Message[]) => {
    const blocks: any[] = [];

    // System Prompt
    if (resolvedSystemPrompt && resolvedSystemPrompt.trim()) {
        const chunks = createTextChunks(resolvedSystemPrompt);
        blocks.push({
            object: 'block',
            type: 'callout',
            callout: {
                icon: { emoji: '⚙️' },
                color: 'gray_background',
                rich_text: [
                    { type: 'text', text: { content: 'System Prompt:\n' }, annotations: { bold: true } },
                    { type: 'text', text: { content: chunks[0] || " " } }
                ]
            }
        });
        
        for (let i = 1; i < chunks.length; i++) {
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: chunks[i] } }] }
            });
        }
    }

    // Chat History
    history.forEach(message => {
        const chunks = createTextChunks(message.content);
        
        blocks.push({
            object: 'block',
            type: 'callout',
            callout: {
                icon: { emoji: message.role === 'user' ? '👤' : '🤖' },
                color: message.role === 'user' ? 'blue_background' : 'gray_background',
                rich_text: [{ type: 'text', text: { content: chunks[0] || " " } }]
            }
        });

        for (let i = 1; i < chunks.length; i++) {
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: chunks[i] } }] }
            });
        }
        
        if (message.attachments && message.attachments.length > 0) {
            const attachmentNames = message.attachments.map(att => att.name).join(', ');
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: `[Attachments: ${attachmentNames}]` }, annotations: { italic: true } }]
                }
            });
        }
    });

    return blocks;
};

// --- Main Function ---

export const exportToNotion = async (config: NotionConfig, history: Message[], resolvedSystemPrompt: string, log: Logger) => {
  if (!config.databaseId) {
      throw new Error("Notion Database ID is missing");
  }

  const dateStr = new Date().toLocaleString();
  const createPageUrl = "https://api.notion.com/v1/pages";
  
  log('info', 'Notion: Creating new page in database...');
  
  const createPageBody = {
      parent: { database_id: config.databaseId },
      properties: {
          "Name": { title: [{ text: { content: `Chat Export - ${dateStr}` } }] }
      }
  };

  const createRes = await fetchWithProxy(createPageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(createPageBody)
  }, log);

  if (!createRes.ok) {
      const errText = await createRes.text();
      if (errText.includes("body.properties.Name")) {
         throw new Error(`Notion Error: Could not find title property 'Name'. Please ensure your database title column is named 'Name'.`);
      }
      throw new Error(`Failed to create Notion page (${createRes.status}): ${errText}`);
  }

  const pageData = await createRes.json();
  const newPageId = pageData.id;
  log('info', `Notion: Page created successfully (${newPageId})`);

  const blocks = buildNotionBlocks(resolvedSystemPrompt, history);

  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const currentBatch = blocks.slice(i, i + BATCH_SIZE);
    const targetUrl = `https://api.notion.com/v1/blocks/${newPageId}/children`;

    log('request', `Notion API: Appending Batch ${Math.floor(i/BATCH_SIZE) + 1}`, { batchSize: currentBatch.length });

    const response = await fetchWithProxy(targetUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({ children: currentBatch })
    }, log);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notion API Append Error (${response.status}): ${errorText}`);
    }
  }
};