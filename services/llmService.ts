import { AppConfig, Message, ModelProvider, StreamCallbacks } from '../types';
import { generateGeminiResponse } from './providers/geminiProvider';
import { generateOpenAICompatibleResponse } from './providers/openaiProvider';

export const generateResponse = async (
  config: AppConfig,
  history: Message[],
  callbacks: StreamCallbacks
) => {
  try {
    switch (config.provider) {
      case ModelProvider.Gemini:
        await generateGeminiResponse(config, history, callbacks);
        break;
      case ModelProvider.OpenAI:
      case ModelProvider.Volcengine:
      case ModelProvider.Aliyun:
        await generateOpenAICompatibleResponse(config, history, callbacks);
        break;
      default:
        throw new Error(`Provider ${config.provider} not supported`);
    }
  } catch (err: any) {
    callbacks.onError(err);
  }
};
