import React, { useState, useMemo, useCallback } from 'react';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import ChatWindow from './components/ChatWindow';
import LogPanel from './components/LogPanel';
import { AppConfig, ExportConfig, ExportTarget, GlobalConfig, Attachment } from './types';
import { INITIAL_GLOBAL_CONFIG } from './constants';
import { Menu } from 'lucide-react';
import { useLogs } from './hooks/useLogs';
import { useChat } from './hooks/useChat';

const App: React.FC = () => {
  // Layout State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [logPanelOpen, setLogPanelOpen] = useState(false);

  // Configuration State
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(INITIAL_GLOBAL_CONFIG);
  
  // Lifted Input State for synchronization
  const [inputText, setInputText] = useState('');

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    target: ExportTarget.Notion,
    notion: {
      token: '',
      databaseId: ''
    },
    feishu: {
      appId: '',
      appSecret: '',
      wikiNodeToken: ''
    }
  });

  // Business Logic Hooks
  const { logs, addLog, clearLogs } = useLogs();
  
  // Resolve System Prompt with Arguments
  const resolvedSystemPrompt = useMemo(() => {
    let prompt = globalConfig.systemPrompt.template;
    const seenKeys = new Set<string>();
    globalConfig.systemPrompt.arguments.forEach(arg => {
      const key = arg.key.trim();
      if (!key || seenKeys.has(key)) return;
      seenKeys.add(key);
      const regex = new RegExp(`\\{${key}\\b\\}`, 'g');
      prompt = prompt.replace(regex, arg.value);
    });
    return prompt;
  }, [globalConfig.systemPrompt.template, globalConfig.systemPrompt.arguments]);

  // Derive active config
  const activeConfig: AppConfig = useMemo(() => ({
    provider: globalConfig.currentProvider,
    systemPrompt: {
      template: resolvedSystemPrompt
    },
    userPrompt: {
      template: globalConfig.userPrompt.template
    },
    ...globalConfig.providers[globalConfig.currentProvider]
  }), [globalConfig, resolvedSystemPrompt]);

  const { messages, isLoading, handleSendMessage, clearChat } = useChat({
    config: activeConfig,
    onLog: addLog
  });

  // Determine if configuration should be locked (locked if there are messages)
  const isConfigLocked = messages.length > 0;

  // Resolve User Prompt Preview (Dynamic based on current input)
  const resolvedUserPrompt = useMemo(() => {
    if (!inputText.trim()) return "";
    return globalConfig.userPrompt.template.replace('{message}', inputText);
  }, [globalConfig.userPrompt.template, inputText]);

  // Wrapped Send Handler
  const onSend = useCallback((text: string, attachments: Attachment[]) => {
    const finalContent = globalConfig.userPrompt.template.replace('{message}', text);
    handleSendMessage(finalContent, attachments);
    setInputText('');
  }, [handleSendMessage, globalConfig.userPrompt.template]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 w-full relative">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
          <button onClick={() => setLeftOpen(!leftOpen)} className="p-2 bg-white rounded shadow text-slate-600">
             <Menu className="w-5 h-5" />
          </button>
      </div>

      {/* Left Sidebar */}
      <div className={`${leftOpen ? 'block' : 'hidden'} md:block fixed inset-0 z-40 md:static md:z-auto w-full md:w-auto bg-black/50 md:bg-transparent`}>
          <div className="h-full w-80 md:w-auto flex flex-col bg-white">
             <div className="md:hidden p-2 flex justify-end">
                <button onClick={() => setLeftOpen(false)} className="text-slate-500">Close</button>
             </div>
             <SidebarLeft 
                globalConfig={globalConfig} 
                setGlobalConfig={setGlobalConfig} 
                exportConfig={exportConfig}
                setExportConfig={setExportConfig}
                resolvedSystemPrompt={resolvedSystemPrompt}
                resolvedUserPrompt={resolvedUserPrompt}
                isLocked={isConfigLocked}
                onLog={addLog}
             />
          </div>
      </div>

      {/* Center Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <div className={`flex-1 flex flex-col overflow-hidden ${logPanelOpen ? 'mb-64 md:mb-80' : ''} transition-all duration-300`}>
             <ChatWindow 
                 messages={messages} 
                 onSendMessage={onSend} 
                 isLoading={isLoading}
                 onClear={clearChat}
                 inputText={inputText}
                 setInputText={setInputText}
                 onLog={addLog}
             />
        </div>
        
        {/* Logs Panel */}
        <LogPanel 
            logs={logs} 
            isOpen={logPanelOpen} 
            onToggle={() => setLogPanelOpen(!logPanelOpen)} 
            onClear={clearLogs} 
        />
      </div>

      {/* Right Sidebar Toggle (Mobile) */}
      <div className="md:hidden fixed top-4 right-4 z-50">
          <button onClick={() => setRightOpen(!rightOpen)} className="p-2 bg-white rounded shadow text-slate-600">
             <Menu className="w-5 h-5" />
          </button>
      </div>

      {/* Right Sidebar */}
      <div className={`${rightOpen ? 'block' : 'hidden'} md:block fixed inset-0 z-40 md:static md:z-auto w-full md:w-auto bg-black/50 md:bg-transparent`}>
         <div className="h-full w-80 md:w-auto flex flex-col bg-white ml-auto">
             <div className="md:hidden p-2 flex justify-end">
                <button onClick={() => setRightOpen(false)} className="text-slate-500">Close</button>
             </div>
             <SidebarRight 
                config={exportConfig} 
                setConfig={setExportConfig} 
                chatHistory={messages} 
                onLog={addLog}
                appConfig={activeConfig}
             />
         </div>
      </div>
    </div>
  );
};

export default App;