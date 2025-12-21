import React, { useRef, useMemo } from 'react';
import { Settings, Key, Terminal, Box, Download, Upload, FileJson, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, Variable, AlertCircle } from 'lucide-react';
import { GlobalConfig, ExportConfig, ModelProvider, PromptArgument } from '../types';
import { PROVIDER_DEFAULTS } from '../constants';

interface SidebarLeftProps {
  globalConfig: GlobalConfig;
  setGlobalConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  exportConfig: ExportConfig;
  setExportConfig: React.Dispatch<React.SetStateAction<ExportConfig>>;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ globalConfig, setGlobalConfig, exportConfig, setExportConfig }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProvider = globalConfig.currentProvider;
  const currentSettings = globalConfig.providers[currentProvider];
  const currentDefaults = PROVIDER_DEFAULTS[currentProvider];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelProvider;
    setGlobalConfig(prev => ({
      ...prev,
      currentProvider: newProvider
    }));
  };

  const updateCurrentSetting = (key: keyof typeof currentSettings, value: string) => {
    setGlobalConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [currentProvider]: {
          ...prev.providers[currentProvider],
          [key]: value
        }
      }
    }));
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGlobalConfig(prev => ({
      ...prev,
      systemPrompt: e.target.value
    }));
  };

  const addArgument = () => {
    setGlobalConfig(prev => ({
      ...prev,
      promptArguments: [...(prev.promptArguments || []), { key: '', value: '' }]
    }));
  };

  const removeArgument = (index: number) => {
    setGlobalConfig(prev => ({
      ...prev,
      promptArguments: prev.promptArguments.filter((_, i) => i !== index)
    }));
  };

  const updateArgument = (index: number, field: keyof PromptArgument, value: string) => {
    setGlobalConfig(prev => {
      const newArgs = [...prev.promptArguments];
      newArgs[index] = { ...newArgs[index], [field]: value };
      return { ...prev, promptArguments: newArgs };
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
    a.download = `llm-config-v1-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        alert('Configuration imported successfully!');
      } catch (err) {
        alert('Failed to import configuration. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Variable validation logic
  const placeholdersInPrompt = useMemo(() => {
    const matches = globalConfig.systemPrompt.match(/\{(\w+)\}/g) || [];
    return new Set(matches.map(m => m.slice(1, -1)));
  }, [globalConfig.systemPrompt]);

  const argumentKeysStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    globalConfig.promptArguments.forEach(arg => {
      const k = arg.key.trim();
      if (k) counts[k] = (counts[k] || 0) + 1;
    });

    const seen: Record<string, number> = {};
    return globalConfig.promptArguments.map(arg => {
      const k = arg.key.trim();
      if (!k) return { isDuplicate: false };
      seen[k] = (seen[k] || 0) + 1;
      // Mark as duplicate if it appears more than once and this is not the first occurrence
      // OR mark all occurrences if we want to show error for all. 
      // User requested "提示后面出现的那个相同的key是错误的" (提示 the later ones are errors)
      return { isDuplicate: seen[k] > 1 };
    });
  }, [globalConfig.promptArguments]);

  const argumentKeys = useMemo(() => {
    return new Set(globalConfig.promptArguments.map(a => a.key.trim()).filter(Boolean));
  }, [globalConfig.promptArguments]);

  const missingArguments = useMemo(() => {
    return Array.from(placeholdersInPrompt).filter(p => !argumentKeys.has(p));
  }, [placeholdersInPrompt, argumentKeys]);

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2 sticky top-0 bg-white z-10 shadow-sm">
        <Settings className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-800">Model Configuration</h2>
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">Provider</label>
          <div className="relative">
            <select
              value={currentProvider}
              onChange={handleProviderChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              {Object.values(ModelProvider).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Box className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Provider Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {currentProvider} API
          </div>
          {currentProvider !== ModelProvider.Gemini && (
            <input
              type="text"
              value={currentSettings.baseUrl}
              onChange={(e) => updateCurrentSetting('baseUrl', e.target.value)}
              placeholder="Base URL"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
          )}
          <input
            type="text"
            value={currentSettings.modelName}
            onChange={(e) => updateCurrentSetting('modelName', e.target.value)}
            placeholder={currentDefaults.placeholder}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
          <div className="relative">
            <input
              type="password"
              value={currentSettings.apiKey}
              onChange={(e) => updateCurrentSetting('apiKey', e.target.value)}
              placeholder="API Key"
              className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
            <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* System Prompt Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                System Prompt
              </div>
            </label>
            <div className="relative">
              <textarea
                value={globalConfig.systemPrompt}
                onChange={handleSystemPromptChange}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none font-mono leading-relaxed"
                placeholder="Use {variable} syntax..."
              />
              {missingArguments.length > 0 && (
                <div className="absolute -bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded shadow-sm">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] text-red-600 font-bold uppercase tracking-tight">Undefined: {missingArguments.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Arguments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Variable className="w-3.5 h-3.5" />
                Arguments
              </label>
              <button 
                onClick={addArgument}
                className="p-1 hover:bg-indigo-50 rounded text-indigo-600 transition-colors"
                title="Add Argument"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {globalConfig.promptArguments.map((arg, idx) => {
                const isUsed = placeholdersInPrompt.has(arg.key);
                const isKeyEmpty = !arg.key.trim();
                const isDuplicate = argumentKeysStatus[idx]?.isDuplicate;
                
                return (
                  <div key={idx} className={`group flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border transition-all shadow-sm
                    ${isDuplicate ? 'border-red-300 bg-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <input
                          type="text"
                          value={arg.key}
                          onChange={(e) => updateArgument(idx, 'key', e.target.value)}
                          placeholder="Key"
                          className={`flex-1 min-w-0 bg-transparent text-xs font-bold outline-none border-b border-transparent focus:border-indigo-400 pb-0.5
                            ${isDuplicate ? 'text-red-700' : 'text-slate-700'}`}
                        />
                        {!isKeyEmpty && (
                          isDuplicate ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" title="Duplicate Key" />
                          ) : isUsed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" title="Used in prompt" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Not used in prompt" />
                          )
                        )}
                      </div>
                      <button 
                        onClick={() => removeArgument(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-all rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      value={arg.value}
                      onChange={(e) => updateArgument(idx, 'value', e.target.value)}
                      placeholder="Value"
                      rows={5}
                      className="w-full bg-white/50 border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-indigo-400 resize-none transition-all"
                    />
                    
                    {isDuplicate && (
                      <span className="text-[10px] text-red-500 font-semibold px-1">Duplicate key name</span>
                    )}
                  </div>
                );
              })}
              {globalConfig.promptArguments.length === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center py-2">No arguments defined.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Config File Management */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-2">
        <button 
          onClick={handleExportConfig}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Export
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Import
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportConfig} />
      </div>
    </div>
  );
};

export default SidebarLeft;