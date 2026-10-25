import React from 'react';
import { History, X, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  history,
  onClose,
  onClear,
  onSelect,
}) => {
  return (
    <div
      className={`absolute inset-0 bg-[#06080c] z-20 transition-transform duration-300 ease-out flex flex-col p-5 rounded-[32px] sm:rounded-[40px] ${
        isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/[0.06]">
        <h3 className="text-white font-medium text-sm tracking-wide flex items-center gap-1.5 font-sans">
          <History className="w-3.5 h-3.5 text-[#ff9f0a]" />
          History Log
        </h3>
        <div className="flex items-center gap-2.5">
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-red-400 hover:text-red-300 transition-all py-1 px-2.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-400 font-medium font-sans flex items-center gap-1 cursor-pointer"
              title="Clear all calculations"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer"
            title="Close History"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* History scrollable container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Clock className="w-6 h-6 text-gray-600 mb-2.5" />
            <p className="text-gray-500 text-xs font-sans">No calculation history yet</p>
            <p className="text-[10px] text-gray-600 font-sans mt-0.5">
              Results will be saved in local cache
            </p>
          </div>
        ) : (
          history.map((item, idx) => {
            const timeStr = item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={item.id || `history-item-${idx}-${item.timestamp || Date.now()}`}
                onClick={() => onSelect(item)}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-150 cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] text-gray-600 font-mono tracking-wider">
                    {timeStr}
                  </span>
                  <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-sans flex items-center gap-0.5 text-right">
                    Paste Result <ChevronRight className="w-2.5 h-2.5 inline-block" />
                  </span>
                </div>
                <div className="text-right mt-1 font-mono text-xs text-gray-400 break-all select-none">
                  {item.expression}
                </div>
                <div className="text-right font-mono text-sm text-white font-medium mt-0.5 break-all select-none">
                  = {item.result}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
