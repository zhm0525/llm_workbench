import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, ChevronDown, ChevronUp, Trash2, Activity } from 'lucide-react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, isOpen, onToggle, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'request': return 'text-blue-400';
      case 'response': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-300';
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="absolute bottom-0 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-t-lg shadow-lg flex items-center gap-2 text-xs z-30 hover:bg-slate-800 transition-colors border border-slate-700 border-b-0 opacity-90 hover:opacity-100"
      >
        <Terminal className="w-3 h-3" />
        <span>Logs ({logs.length})</span>
        <ChevronUp className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col h-64 md:h-80 bg-slate-900 text-slate-200 border-t border-slate-700 shadow-2xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm">System Logs</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{logs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400" title="Clear Logs">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className="p-1 hover:bg-slate-700 rounded text-slate-400" title="Close Panel">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Log List */}
        <div className={`flex-1 overflow-y-auto p-2 font-mono text-xs border-r border-slate-700 ${selectedLog ? 'hidden md:block md:w-1/2' : 'w-full'}`} ref={scrollRef}>
           {logs.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-slate-600">
               <Activity className="w-8 h-8 mb-2 opacity-50" />
               <p>No activity recorded yet.</p>
             </div>
           )}
           <table className="w-full text-left border-collapse">
             <tbody>
               {logs.map((log) => (
                 <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800/50 ${selectedLog?.id === log.id ? 'bg-slate-800' : ''}`}
                 >
                   <td className="py-1 px-2 text-slate-500 w-24 align-top whitespace-nowrap">{log.timestamp.split(' ')[1]}</td>
                   <td className={`py-1 px-2 w-20 align-top uppercase font-bold text-[10px] ${getCategoryColor(log.category)}`}>{log.category}</td>
                   <td className="py-1 px-2 text-slate-300 align-top truncate max-w-xs">{log.summary}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* Details Panel */}
        {selectedLog && (
          <div className="flex-1 md:w-1/2 bg-slate-950 overflow-y-auto p-4 border-l border-slate-700 font-mono text-xs relative">
            <button 
              onClick={() => setSelectedLog(null)} 
              className="absolute top-2 right-2 p-1 hover:bg-slate-800 rounded text-slate-500 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4">
              <h3 className="text-slate-400 font-bold mb-1">SUMMARY</h3>
              <p className="text-slate-200">{selectedLog.summary}</p>
            </div>
            {selectedLog.details ? (
              <div>
                <h3 className="text-slate-400 font-bold mb-1">DETAILS</h3>
                <pre className="text-green-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            ) : (
                <div className="text-slate-600 italic">No details available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPanel;
