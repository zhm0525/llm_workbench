import { ModelProvider, GlobalConfig } from './types';

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant. Use {tone} tone and answer in {language}.";

export const PROVIDER_DEFAULTS: Record<ModelProvider, { baseUrl: string; defaultModel: string; placeholder: string }> = {
  [ModelProvider.Gemini]: {
    baseUrl: '',
    defaultModel: 'gemini-3-flash-preview',
    placeholder: 'gemini-3-flash-preview'
  },
  [ModelProvider.OpenAI]: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    placeholder: 'gpt-4o'
  },
  [ModelProvider.Volcengine]: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'ep-2024...',
    placeholder: 'Endpoint ID (ep-xxxx)'
  },
  [ModelProvider.Aliyun]: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    placeholder: 'qwen-plus'
  }
};

export const INITIAL_GLOBAL_CONFIG: GlobalConfig = {
  currentProvider: ModelProvider.Gemini,
  systemPrompt: {
    template: DEFAULT_SYSTEM_PROMPT,
    arguments: [
      { key: 'tone', value: 'professional' },
      { key: 'language', value: 'Chinese' }
    ],
  },
  userPrompt: {
    template: "{message}",
  },
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