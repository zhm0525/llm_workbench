import { GoogleGenAI } from "@google/genai";
import { AppConfig, Message, StreamCallbacks } from '../../types';

export const generateGeminiResponse = async (
  config: AppConfig,
  history: Message[],
  callbacks: StreamCallbacks
) => {
  if (!config.apiKey) throw new Error("API Key is required for Gemini");

  const log = (category: 'info' | 'request' | 'response' | 'error', summary: string, details?: any) => {
      if (callbacks.onLog) callbacks.onLog({ category, summary, details });
  };

  log('info', 'Initializing Gemini Client', { model: config.modelName });

  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const systemInstruction = config.systemPrompt;
  
  // Convert history excluding the last message (which is the new prompt)
  const chatHistory = history.slice(0, -1).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [
      ... (msg.attachments?.map(att => ({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
      })) || []),
      { text: msg.content }
    ]
  }));

  const chat = ai.chats.create({
    model: config.modelName || 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
    history: chatHistory
  });

  const lastMsg = history[history.length - 1];
  const parts = [
    ... (lastMsg.attachments?.map(att => ({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
    })) || []),
    { text: lastMsg.content }
  ];

  log('request', 'Sending Message to Gemini', {
      model: config.modelName,
      historyLength: chatHistory.length,
      currentMessageParts: parts.length,
      systemPrompt: systemInstruction
  });

  try {
      const result = await chat.sendMessageStream({
        message: parts
      });

      log('info', 'Stream started');

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          callbacks.onChunk(text);
        }
      }
      log('response', 'Stream finished');
      callbacks.onFinish();
  } catch (error: any) {
      log('error', 'Gemini Request Failed', { message: error.message, stack: error.stack });
      throw error;
  }
};
