import React, { useRef } from 'react';
import { Settings, Key, Terminal, Box, Download, Upload, FileJson } from 'lucide-react';
import { GlobalConfig, ExportConfig, ModelProvider } from '../types';
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

        if (data.globalConfig) {
           setGlobalConfig(data.globalConfig);
        }

        if (data.exportConfig) {
          setExportConfig(data.exportConfig);
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('Configuration imported successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to import configuration. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
            >
              {Object.values(ModelProvider).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <Box className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Provider Specific Settings */}
        <div className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                 <Settings className="w-3 h-3" />
                 {currentProvider} Settings
             </div>

            {/* Base URL (Conditional) */}
            {currentProvider !== ModelProvider.Gemini && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Base URL</label>
                <input
                  type="text"
                  value={currentSettings.baseUrl}
                  onChange={(e) => updateCurrentSetting('baseUrl', e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Model Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Model Name</label>
              <input
                type="text"
                value={currentSettings.modelName}
                onChange={(e) => updateCurrentSetting('modelName', e.target.value)}
                placeholder={currentDefaults.placeholder}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={currentSettings.apiKey}
                  onChange={(e) => updateCurrentSetting('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-xs text-slate-500">Key is stored in memory only.</p>
            </div>
        </div>

        <hr className="border-slate-100" />

        {/* Unified System Prompt (Moved to bottom) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            System Prompt (Global)
          </label>
          <textarea
            value={globalConfig.systemPrompt}
            onChange={handleSystemPromptChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="You are a helpful assistant..."
          />
        </div>
      </div>

      {/* Config File Management */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <FileJson className="w-3 h-3" />
          Config File
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleExportConfig}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
            title="Save configuration to JSON"
          >
            <Upload className="w-4 h-4" />
            Export
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
            title="Load configuration from JSON"
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
    </div>
  );
};

export default SidebarLeft;