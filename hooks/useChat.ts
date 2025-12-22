import { useState, useCallback } from 'react';
import { Message, Attachment, AppConfig, LogEntry } from '../types';
import { generateResponse } from '../services/llmService';

interface UseChatProps {
  config: AppConfig;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export const useChat = ({ config, onLog }: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * handleSendMessage now expects the ALREADY RESOLVED user prompt
   * as calculated by the template logic in App.tsx.
   */
  const handleSendMessage = useCallback(async (resolvedText: string, attachments: Attachment[]) => {
    const assistantId = (Date.now() + 1).toString();
    const currentModelName = config.modelName; 

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: resolvedText, // Show the final templated version in UI
      attachments: attachments,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const historySnapshot = [...messages, userMessage];

    try {
      let fullResponse = "";
      
      await generateResponse(config, historySnapshot, {
        onChunk: (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.id === assistantId) {
                return [...prev.slice(0, -1), { ...lastMessage, content: fullResponse }];
            } else {
                return [...prev, {
                    id: assistantId,
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: Date.now(),
                    model: currentModelName
                }];
            }
          });
        },
        onFinish: () => {
          setIsLoading(false);
        },
        onError: (err) => {
            console.error(err);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: `Error: ${err.message}`,
                timestamp: Date.now()
            }]);
            onLog({ category: 'error', summary: 'Generation Failed', details: err.message });
        },
        onLog: onLog
      });
      
    } catch (error: any) {
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      }]);
      onLog({ category: 'error', summary: 'Unexpected Error', details: error.message });
    }
  }, [config, messages, onLog]);

  const clearChat = useCallback(() => {
      setMessages([]);
      onLog({ category: 'info', summary: 'Chat history cleared' });
  }, [onLog]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    clearChat
  };
};