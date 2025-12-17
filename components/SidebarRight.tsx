import React, { useState } from 'react';
import { Share2, FileText, Key, FolderInput, CheckCircle, AlertCircle, Hash, Lock, Database, Library } from 'lucide-react';
import { ExportConfig, ExportTarget, Message, LogEntry, AppConfig } from '../types';
import { exportChatHistory } from '../services/exportService';

interface SidebarRightProps {
  config: ExportConfig;
  setConfig: React.Dispatch<React.SetStateAction<ExportConfig>>;
  chatHistory: Message[];
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  appConfig: AppConfig;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ config, setConfig, chatHistory, onLog, appConfig }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExport = async () => {
    if (chatHistory.length === 0) {
      setErrorMsg("No chat history to export.");
      setStatus('error');
      onLog({ category: 'error', summary: 'Export failed: No history' });
      return;
    }

    // Basic Validation
    if (config.target === ExportTarget.Notion) {
        if (!config.notion.token) {
            setErrorMsg("Notion Token is required");
            setStatus('error');
            return;
        }
        if (!config.notion.databaseId) {
            setErrorMsg("Notion Database ID is required");
            setStatus('error');
            return;
        }
    }
    if (config.target === ExportTarget.Feishu) {
        if (!config.feishu.appId || !config.feishu.appSecret) {
            setErrorMsg("App ID and App Secret are required");
            setStatus('error');
            return;
        }
        if (!config.feishu.wikiNodeToken) {
            setErrorMsg("Parent Wiki Node Token is required");
            setStatus('error');
            return;
        }
    }
    
    setIsExporting(true);
    setStatus('idle');
    try {
      await exportChatHistory(config, chatHistory, appConfig.systemPrompt, onLog);
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const updateNotion = (key: keyof typeof config.notion, value: string) => {
    setConfig(prev => ({
      ...prev,
      notion: {
        ...prev.notion,
        [key]: value
      }
    }));
  };

  const updateFeishu = (key: keyof typeof config.feishu, value: string) => {
    setConfig(prev => ({
      ...prev,
      feishu: {
        ...prev.feishu,
        [key]: value
      }
    }));
  };

  return (
    <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-800">Export Settings</h2>
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* Target Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">Destination</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfig(prev => ({ ...prev, target: ExportTarget.Notion }))}
              className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                ${config.target === ExportTarget.Notion 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Notion
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, target: ExportTarget.Feishu }))}
              className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                ${config.target === ExportTarget.Feishu 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Feishu
            </button>
          </div>
        </div>

        {/* Inputs for Notion */}
        {config.target === ExportTarget.Notion && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Integration Token</label>
              <div className="relative">
                <input
                  type="password"
                  value={config.notion.token}
                  onChange={(e) => updateNotion('token', e.target.value)}
                  placeholder="secret_..."
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Database ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={config.notion.databaseId}
                  onChange={(e) => updateNotion('databaseId', e.target.value)}
                  placeholder="xxxxxxxx..."
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Database className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-xs text-slate-500 mt-1">A new page will be created in this DB.</p>
            </div>
          </>
        )}

        {/* Inputs for Feishu */}
        {config.target === ExportTarget.Feishu && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">App ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={config.feishu.appId}
                  onChange={(e) => updateFeishu('appId', e.target.value)}
                  placeholder="cli_..."
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">App Secret</label>
              <div className="relative">
                <input
                  type="password"
                  value={config.feishu.appSecret}
                  onChange={(e) => updateFeishu('appSecret', e.target.value)}
                  placeholder="Secret key..."
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Parent Wiki Node Token</label>
              <div className="relative">
                <input
                  type="text"
                  value={config.feishu.wikiNodeToken}
                  onChange={(e) => updateFeishu('wikiNodeToken', e.target.value)}
                  placeholder="wik... (Token from URL)"
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Library className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Found in the browser URL of the target Wiki folder/page.</p>
            </div>
          </>
        )}

      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        {status === 'success' && (
          <div className="mb-3 p-2 bg-green-100 text-green-700 text-xs rounded flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Export successful!
          </div>
        )}
        {status === 'error' && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`w-full py-2.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all flex items-center justify-center gap-2
            ${isExporting 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-95'}`}
        >
          {isExporting ? (
            <>Processing...</>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Export to {config.target}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SidebarRight;