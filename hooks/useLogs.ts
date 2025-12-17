import { useState, useCallback } from 'react';
import { LogEntry } from '../types';

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [
      ...prev,
      {
        ...entry,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs
  };
};