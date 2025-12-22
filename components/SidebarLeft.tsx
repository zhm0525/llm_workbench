import React, { useRef, useMemo, useState } from 'react';
import { 
  Settings, Key, Terminal, Box, Download, Upload, 
  Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, 
  Variable, AlertCircle, ChevronDown, ChevronRight, Eye, 
  AlignLeft, UserCircle, Layers, Lock
} from 'lucide-react';
import { GlobalConfig, ExportConfig, ModelProvider, PromptArgument, LogEntry } from '../types';
import { PROVIDER_DEFAULTS } from '../constants';

interface SidebarLeftProps {
  globalConfig: GlobalConfig;
  setGlobalConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  exportConfig: ExportConfig;
  setExportConfig: React.Dispatch<React.SetStateAction<ExportConfig>>;
  resolvedSystemPrompt: string;
  resolvedUserPrompt: string;
  isLocked?: boolean;
  onLog?: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ 
  globalConfig, 
  setGlobalConfig, 
  exportConfig, 
  setExportConfig, 
  resolvedSystemPrompt,
  resolvedUserPrompt,
  isLocked = false,
  onLog
}) => {
  const [isArgsExpanded, setIsArgsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProvider = globalConfig.currentProvider;
  const currentSettings = globalConfig.providers[currentProvider];
  const currentDefaults = PROVIDER_DEFAULTS[currentProvider];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelProvider;
    setGlobalConfig(prev => ({ ...prev, currentProvider: newProvider }));
    if (onLog) {
        onLog({ category: 'info', summary: `Model Provider switched to ${newProvider}` });
    }
  };

  const updateCurrentSetting = (key: keyof typeof currentSettings, value: string) => {
    setGlobalConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [currentProvider]: { ...prev.providers[currentProvider], [key]: value }
      }
    }));
  };

  const addArgument = () => {
    if (isLocked) return;
    const args = globalConfig.systemPrompt.arguments || [];
    if (args.length > 0) {
      const lastArg = args[args.length - 1];
      if (!lastArg.key.trim() && !lastArg.value.trim()) {
        return;
      }
    }
    setGlobalConfig(prev => ({
      ...prev,
      systemPrompt: {
        ...prev.systemPrompt,
        arguments: [...args, { key: '', value: '' }]
      }
    }));
    setIsArgsExpanded(true);
  };

  const removeArgument = (index: number) => {
    if (isLocked) return;
    setGlobalConfig(prev => ({
      ...prev,
      systemPrompt: {
        ...prev.systemPrompt,
        arguments: prev.systemPrompt.arguments.filter((_, i) => i !== index)
      }
    }));
  };

  const updateArgument = (index: number, field: keyof PromptArgument, value: string) => {
    if (isLocked) return;
    setGlobalConfig(prev => {
      const newArgs = [...prev.systemPrompt.arguments];
      newArgs[index] = { ...newArgs[index], [field]: value };
      return { 
        ...prev, 
        systemPrompt: {
          ...prev.systemPrompt,
          arguments: newArgs
        }
      };
    });
  };

  const handleExportConfig = () => {
    const dataToSave = {
      globalConfig,
      exportConfig,
      version: 1,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-workbench-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onLog) {
        onLog({ category: 'info', summary: 'System configuration exported to file' });
    }
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        if (data.globalConfig) setGlobalConfig(data.globalConfig);
        if (data.exportConfig) setExportConfig(data.exportConfig);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (onLog) {
            onLog({ category: 'info', summary: `System configuration imported from ${file.name}` });
        }
        alert('Configuration imported successfully!');
      } catch (err) {
        if (onLog) {
            onLog({ category: 'error', summary: 'Failed to import configuration', details: err });
        }
        alert('Failed to import configuration. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const argumentStatus = useMemo(() => {
    const seen = new Set<string>();
    return globalConfig.systemPrompt.arguments.map(arg => {
      const k = arg.key.trim();
      if (!k) return { isDuplicate: false };
      const isDuplicate = seen.has(k);
      seen.add(k);
      return { isDuplicate };
    });
  }, [globalConfig.systemPrompt.arguments]);

  const placeholdersInPrompt = useMemo(() => {
    const matches = globalConfig.systemPrompt.template.match(/\{(\w+)\}/g) || [];
    return new Set(matches.map(m => m.slice(1, -1)));
  }, [globalConfig.systemPrompt.template]);

  const isUserPromptValid = globalConfig.userPrompt.template.includes('{message}');

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Model Configuration</h2>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            <Lock className="w-2.5 h-2.5" />
            LOCKED
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isLocked ? 'opacity-75' : ''}`}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">Provider</label>
          <select 
            value={currentProvider}
            onChange={handleProviderChange}
            disabled={isLocked}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {Object.values(ModelProvider).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">Model Name</label>
            <div className="relative">
              <input
                type="text"
                value={currentSettings.modelName}
                onChange={(e) => updateCurrentSetting('modelName', e.target.value)}
                placeholder={currentDefaults.placeholder}
                disabled={isLocked}
                className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <Box className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">API Key</label>
            <div className="relative">
              <input
                type="password"
                value={currentSettings.apiKey}
                onChange={(e) => updateCurrentSetting('apiKey', e.target.value)}
                placeholder="Enter API key..."
                disabled={isLocked}
                className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {currentProvider !== ModelProvider.Gemini && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Base URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={currentSettings.baseUrl}
                  onChange={(e) => updateCurrentSetting('baseUrl', e.target.value)}
                  placeholder={currentDefaults.baseUrl || "https://api.example.com/v1"}
                  disabled={isLocked}
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <Terminal className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        <div className="flex items-center gap-2 pt-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">System Prompt</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              Final Resolved Result
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {resolvedSystemPrompt || <span className="italic text-slate-400">Preview...</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-slate-400" />
                System Prompt Template
              </div>
            </label>
            <textarea
              value={globalConfig.systemPrompt.template}
              onChange={(e) => setGlobalConfig(prev => ({ 
                ...prev, 
                systemPrompt: { ...prev.systemPrompt, template: e.target.value }
              }))}
              disabled={isLocked}
              className="w-full h-32 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed font-mono disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Use {variable} for arguments..."
            />
          </div>

          <div className="space-y-3">
            <div 
              className={`flex items-center justify-between p-1 -mx-1 rounded transition-colors ${isLocked ? '' : 'cursor-pointer group hover:bg-slate-50'}`}
              onClick={() => !isLocked && setIsArgsExpanded(!isArgsExpanded)}
            >
              <div className="flex items-center gap-2">
                {isArgsExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Variable className="w-4 h-4 text-slate-500" />
                  Arguments
                </label>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); addArgument(); }}
                disabled={isLocked}
                className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add Argument"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isArgsExpanded && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 pb-4">
                {globalConfig.systemPrompt.arguments.map((arg, idx) => {
                  const isUsed = placeholdersInPrompt.has(arg.key);
                  const isDuplicate = argumentStatus[idx].isDuplicate;

                  return (
                    <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border transition-all shadow-sm
                      ${isDuplicate ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={arg.key}
                            onChange={(e) => updateArgument(idx, 'key', e.target.value)}
                            placeholder="Key"
                            disabled={isLocked}
                            className={`w-full p-2 bg-transparent border-b text-xs font-bold outline-none transition-colors disabled:cursor-not-allowed
                              ${isDuplicate ? 'border-red-400 text-red-700' : 'border-slate-200 focus:border-indigo-500'}`}
                          />
                          {isDuplicate && (
                            <span className="absolute -top-4 left-0 text-[10px] text-red-500 font-bold uppercase">Duplicate Key!</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {arg.key && !isDuplicate && (
                            isUsed ? (
                              <span title="Used">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              </span>
                            ) : (
                              <span title="Unused">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              </span>
                            )
                          )}
                          <button 
                            onClick={() => removeArgument(idx)}
                            disabled={isLocked}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={arg.value}
                        onChange={(e) => updateArgument(idx, 'value', e.target.value)}
                        placeholder="Value"
                        rows={5}
                        disabled={isLocked}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-400 outline-none resize-none disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="flex items-center gap-2 pt-2">
          <UserCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">User Prompt</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              Final Resolved Result
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {resolvedUserPrompt || <span className="italic text-slate-400">Preview...</span>}
            </div>
          </div>

          <div className="space-y-2 pb-4">
            <label className="text-sm font-medium text-slate-700 block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-slate-400" />
                  User Prompt Template
                </div>
                {isUserPromptValid ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </label>
            <textarea
              value={globalConfig.userPrompt.template}
              onChange={(e) => setGlobalConfig(prev => ({ 
                ...prev, 
                userPrompt: { ...prev.userPrompt, template: e.target.value }
              }))}
              disabled={isLocked}
              className={`w-full h-24 p-3 bg-slate-50 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed font-mono transition-colors disabled:cursor-not-allowed
                ${isUserPromptValid ? 'border-slate-300' : 'border-red-300 bg-red-50'}
                ${isLocked ? 'disabled:bg-slate-100' : ''}`}
              placeholder="Must include {message}..."
            />
            {!isUserPromptValid && (
              <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Template must contain {"{message}"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-2 shrink-0">
        <button 
          onClick={handleExportConfig}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Export
        </button>
        <button 
          onClick={() => !isLocked && fileInputRef.current?.click()}
          disabled={isLocked}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          title={isLocked ? "Cannot import during active session" : "Import configuration"}
        >
          <Download className="w-4 h-4" />
          Import
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleImportConfig} 
        />
      </div>
    </div>
  );
};

export default SidebarLeft;