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
  model?: string; // The model name that generated this message
}

// Configuration for a specific provider
export interface ProviderSettings {
  modelName: string;
  apiKey: string;
  baseUrl: string;
}

// Global state holding configurations
export interface GlobalConfig {
  currentProvider: ModelProvider;
  systemPrompt: string; // Unified System Prompt
  providers: Record<ModelProvider, ProviderSettings>;
}

// Active configuration used by the service layer
export interface AppConfig {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  systemPrompt: string;
  baseUrl?: string; // For custom endpoints (Volcengine/Aliyun)
}

// --- Export Configuration ---

export interface NotionConfig {
  token: string;
  databaseId: string;
}

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  wikiNodeToken: string; // The parent node token in the Wiki
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