export enum ModelProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  Volcengine = 'Volcengine',
  Aliyun = 'Aliyun'
}

export enum ExportTarget {
  Notion = 'Notion',
  Feishu = 'Feishu'
}

export interface Attachment {
  type: 'image' | 'file';
  name: string;
  data: string; // Base64
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  model?: string;
}

export interface PromptArgument {
  key: string;
  value: string;
}

export interface ProviderSettings {
  modelName: string;
  apiKey: string;
  baseUrl: string;
}

export interface GlobalConfig {
  currentProvider: ModelProvider;
  systemPrompt: {
    template: string;
    arguments: PromptArgument[];
  };
  userPrompt: {
    template: string;
  };
  providers: Record<ModelProvider, ProviderSettings>;
}

export interface AppConfig {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  systemPrompt: {
    template: string; // This will hold the resolved string in AppConfig
  };
  userPrompt: {
    template: string;
  };
  baseUrl?: string;
}

export interface NotionConfig {
  token: string;
  databaseId: string;
}

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  wikiNodeToken: string;
}

export interface ExportConfig {
  target: ExportTarget;
  notion: NotionConfig;
  feishu: FeishuConfig;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'info' | 'request' | 'response' | 'error';
  summary: string;
  details?: any;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onFinish: () => void;
  onError: (error: Error) => void;
  onLog?: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}