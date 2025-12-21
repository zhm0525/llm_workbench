import { ModelProvider, GlobalConfig } from './types';

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful, professional AI assistant. Answer concisely and accurately using {tone} tone and {language}.";

export const PROVIDER_DEFAULTS: Record<ModelProvider, { baseUrl: string; defaultModel: string; placeholder: string }> = {
  [ModelProvider.Gemini]: {
    baseUrl: '', // Not used for Gemini SDK
    defaultModel: 'gemini-3-flash-preview',
    placeholder: 'gemini-3-flash-preview'
  },
  [ModelProvider.OpenAI]: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    placeholder: 'gpt-4o, gpt-3.5-turbo'
  },
  [ModelProvider.Volcengine]: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'ep-2024...',
    placeholder: 'Enter your Endpoint ID (ep-xxxx)'
  },
  [ModelProvider.Aliyun]: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    placeholder: 'qwen-plus, qwen-turbo'
  }
};

export const INITIAL_GLOBAL_CONFIG: GlobalConfig = {
  currentProvider: ModelProvider.Gemini,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  promptArguments: [
    { key: 'tone', value: 'friendly' },
    { key: 'language', value: 'English' }
  ],
  providers: {
    [ModelProvider.Gemini]: {
      modelName: PROVIDER_DEFAULTS[ModelProvider.Gemini].defaultModel,
      apiKey: '',
      baseUrl: PROVIDER_DEFAULTS[ModelProvider.Gemini].baseUrl
    },
    [ModelProvider.OpenAI]: {
      modelName: PROVIDER_DEFAULTS[ModelProvider.OpenAI].defaultModel,
      apiKey: '',
      baseUrl: PROVIDER_DEFAULTS[ModelProvider.OpenAI].baseUrl
    },
    [ModelProvider.Volcengine]: {
      modelName: PROVIDER_DEFAULTS[ModelProvider.Volcengine].defaultModel,
      apiKey: '',
      baseUrl: PROVIDER_DEFAULTS[ModelProvider.Volcengine].baseUrl
    },
    [ModelProvider.Aliyun]: {
      modelName: PROVIDER_DEFAULTS[ModelProvider.Aliyun].defaultModel,
      apiKey: '',
      baseUrl: PROVIDER_DEFAULTS[ModelProvider.Aliyun].baseUrl
    }
  }
};