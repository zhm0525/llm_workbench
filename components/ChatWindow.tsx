import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Paperclip, X, Image as ImageIcon, Bot, User, Trash2, Cpu, ArrowUp } from 'lucide-react';
import { Message, Attachment } from '../types';

// --- Sub-Component: Message Item ---

const MessageItem: React.FC<{ msg: Message }> = ({ msg }) => {
    return (
        <div className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-black/5
              ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-600" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-7 overflow-hidden transition-all
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm hover:shadow-md'}`}>
                
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 space-y-2">
                        {msg.attachments.map((att, idx) => (
                            att.type === 'image' ? (
                                <img 
                                key={idx} 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt={att.name} 
                                className="max-w-full rounded-lg border border-white/20 shadow-sm"
                                style={{ maxHeight: '300px' }}
                                />
                            ) : (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-black/5 rounded-lg border border-black/5">
                                    <div className="p-2 bg-white rounded shadow-sm">
                                        <Paperclip className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <span className="text-xs font-medium truncate max-w-[150px]">{att.name}</span>
                                </div>
                            )
                        ))}
                    </div>
                )}
                
                <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                </div>
                
                <div className={`flex items-center gap-2 mt-1.5 px-1 opacity-60 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && msg.model && (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                    <Cpu className="w-3 h-3" />
                    {msg.model}
                    </span>
                )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onClear: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, onClear }) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(inputText, attachments);
    setInputText('');
    setAttachments([]);
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposing || e.nativeEvent.isComposing) return;
      
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        
        await new Promise<void>((resolve) => {
            reader.onload = (e) => {
                const result = e.target?.result as string;
                // remove data url prefix
                const base64 = result.split(',')[1];
                newAttachments.push({
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    name: file.name,
                    data: base64,
                    mimeType: file.type
                });
                resolve();
            };
            reader.readAsDataURL(file);
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Bot className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg text-slate-800">Test Playground</h1>
        </div>
        <button 
          onClick={onClear}
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-lg group flex items-center gap-2 text-sm font-medium"
          title="Clear Chat"
        >
          <span className="hidden sm:inline group-hover:text-red-500 transition-colors">Clear History</span>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <Bot className="w-10 h-10 text-indigo-200" />
            </div>
            <div className="text-center space-y-1">
                <h3 className="font-semibold text-slate-600">Welcome to LLM Workbench</h3>
                <p className="text-sm text-slate-400">Select a model from the left and start testing.</p>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} />
        ))}

        {isLoading && (
           <div className="flex gap-4 flex-row">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex space-x-1.5 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative z-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
             <div className="flex gap-3 overflow-x-auto py-2 px-1">
                 {attachments.map((att, i) => (
                     <div key={i} className="relative group shrink-0 animate-in fade-in zoom-in duration-200">
                         {att.type === 'image' ? (
                             <div className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200 w-16 h-16">
                                <img src={`data:${att.mimeType};base64,${att.data}`} className="h-full w-full object-cover" alt="preview" />
                             </div>
                         ) : (
                             <div className="h-16 w-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                 <Paperclip className="w-6 h-6 text-slate-400" />
                             </div>
                         )}
                         <button 
                            onClick={() => removeAttachment(i)}
                            className="absolute -top-2 -right-2 bg-white text-slate-500 hover:text-red-500 border border-slate-200 rounded-full p-1 shadow-sm transition-colors z-10"
                         >
                             <X className="w-3 h-3" />
                         </button>
                     </div>
                 ))}
             </div>
          )}

          <div className="relative flex items-end gap-2 bg-slate-100/50 border border-slate-200 p-2 rounded-[26px] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all shadow-sm">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all shrink-0"
              title="Attach File"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              multiple 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*, .txt, .pdf, .md"
            />
            
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Message..."
              className="flex-1 max-h-[200px] bg-transparent border-none outline-none resize-none py-3 px-2 text-slate-800 placeholder:text-slate-400 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            
            <button
              onClick={handleSend}
              disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
              className={`p-3 rounded-full transition-all flex items-center justify-center shadow-md mb-0.5
                ${(isLoading || (!inputText.trim() && attachments.length === 0))
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95'}`}
            >
               {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
               )}
            </button>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium">
                Press <kbd className="font-sans px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">Enter</kbd> to send, <kbd className="font-sans px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">Shift + Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;