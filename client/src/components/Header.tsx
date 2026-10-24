import React from 'react';
import { Play, Pause, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isPaused,
  onTogglePause,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Status Live */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Radio className={`w-3.5 h-3.5 ${isPaused ? 'text-amber-400' : 'text-emerald-400 animate-pulse'}`} />
          <span className="font-medium text-slate-300">
            {isPaused ? 'Automação Global Pausada' : 'Orquestrador Autônomo Ativo'}
          </span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-50"
          title="Recarregar dados do servidor"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`} />
          <span>Atualizar</span>
        </button>

        <button
          onClick={onTogglePause}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
            isPaused
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Retomar Automação</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pausar Automação</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
