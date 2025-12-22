import { GoogleGenAI } from "@google/genai";
import { AppConfig, Message, StreamCallbacks } from '../../types';

// Gemini provider implementation for generating streamed content responses
export const generateGeminiResponse = async (
  config: AppConfig,
  history: Message[],
  callbacks: StreamCallbacks
) => {
  // Always use process.env.API_KEY for authorization
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not defined.");
  }

  const log = (category: 'info' | 'request' | 'response' | 'error', summary: string, details?: any) => {
      if (callbacks.onLog) callbacks.onLog({ category, summary, details });
  };

  // Default to gemini-3-flash-preview for general text tasks
  const modelName = config.modelName || 'gemini-3-flash-preview';

  log('info', 'Initializing Gemini Client', { model: modelName });

  // Instantiate GenAI client right before use
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = config.systemPrompt.template;
  
  // Transform application history into Gemini format
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

  // Create a chat session with system instructions and current context
  const chat = ai.chats.create({
    model: modelName,
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
      model: modelName,
      historyLength: chatHistory.length,
      currentMessageParts: parts.length,
      systemPrompt: systemInstruction
  });

  try {
      // Initiate streaming response
      const result = await chat.sendMessageStream({
        message: parts
      });

      log('info', 'Stream started');

      for await (const chunk of result) {
        // Access .text property directly (not as a function call)
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