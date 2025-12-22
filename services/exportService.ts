import { ExportConfig, ExportTarget, LogEntry, Message } from '../types';
import { exportToNotion } from './notionExport';
import { exportToFeishu } from './feishuExport';

type LogCallback = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;

export const exportChatHistory = async (config: ExportConfig, history: Message[], resolvedSystemPrompt: string, onLog?: LogCallback): Promise<void> => {
  const log = (category: 'info' | 'request' | 'response' | 'error', summary: string, details?: any) => {
      if (onLog) onLog({ category, summary, details });
  };

  log('info', `Starting export to ${config.target}`);

  try {
    if (config.target === ExportTarget.Notion) {
      if (!config.notion.databaseId) throw new Error("Notion Database ID is missing");
      await exportToNotion(config.notion, history, resolvedSystemPrompt, log);
    } else if (config.target === ExportTarget.Feishu) {
      if (!config.feishu.appId) throw new Error("Feishu App ID is missing");
      await exportToFeishu(config.feishu, history, resolvedSystemPrompt, log);
    } else {
      throw new Error(`Unsupported export target: ${config.target}`);
    }
  } catch (error: any) {
    log('error', 'Export Failed', { message: error.message });
    throw error;
  }
};