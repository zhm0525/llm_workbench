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

  const handleSendMessage = useCallback(async (text: string, attachments: Attachment[]) => {
    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      attachments: attachments,
      timestamp: Date.now()
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // 2. Prepare Assistant Message Placeholder
    const assistantId = (Date.now() + 1).toString();
    const currentModelName = config.modelName; 
    
    // Capture the history snapshot to send to the API
    const historySnapshot = [...messages, userMessage];

    try {
      let fullResponse = "";
      
      await generateResponse(config, historySnapshot, {
        onChunk: (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            // If the last message is the one we are currently streaming into
            if (lastMessage.id === assistantId) {
                return [...prev.slice(0, -1), { ...lastMessage, content: fullResponse }];
            } else {
                // First chunk arrived, create the assistant message
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