import { AppConfig, Message, StreamCallbacks } from '../../types';

// --- Helpers ---

const parseStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, onChunk: (text: string) => void) => {
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr.trim() === '[DONE]') continue;
                try {
                    const json = JSON.parse(dataStr);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                        onChunk(content);
                    }
                } catch (e) {
                    console.warn("Error parsing chunk", e);
                }
            }
        }
    }
};

const buildMessages = (resolvedSystemPrompt: string, history: Message[]) => {
    return [
        { role: 'system', content: resolvedSystemPrompt },
        ...history.map(msg => {
            if (msg.attachments && msg.attachments.length > 0) {
                return {
                    role: msg.role,
                    content: [
                        { type: "text", text: msg.content },
                        ...msg.attachments.map(att => ({
                            type: "image_url",
                            image_url: { url: `data:${att.mimeType};base64,${att.data}` }
                        }))
                    ]
                };
            }
            return { role: msg.role, content: msg.content };
        })
    ];
};

// --- Main Function ---

export const generateOpenAICompatibleResponse = async (
  config: AppConfig,
  history: Message[],
  callbacks: StreamCallbacks
) => {
  if (!config.apiKey) throw new Error("API Key is required");
  if (!config.baseUrl) throw new Error("Base URL is required");

  const log = (category: 'info' | 'request' | 'response' | 'error', summary: string, details?: any) => {
      if (callbacks.onLog) callbacks.onLog({ category, summary, details });
  };

  const messages = buildMessages(config.systemPrompt.template, history);

  const requestBody = {
    model: config.modelName,
    messages: messages,
    stream: true
  };

  const url = `${config.baseUrl}/chat/completions`;
  
  log('request', `POST ${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey.substring(0, 3)}...`
      },
      body: requestBody
  });

  try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = `API Error: ${response.status} ${errData.error?.message || response.statusText}`;
        log('error', `HTTP ${response.status}`, errData);
        throw new Error(errMsg);
      }

      log('response', `HTTP ${response.status} OK - Stream starting`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      await parseStream(reader, callbacks.onChunk);
      
      log('info', 'Stream finished successfully');
      callbacks.onFinish();
  } catch (error: any) {
      log('error', 'Request Failed', { message: error.message });
      throw error;
  }
};