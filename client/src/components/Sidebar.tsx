import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Kanban, 
  CheckSquare, 
  Cpu, 
  FileText, 
  PlayCircle, 
  ShieldCheck, 
  Activity,
  Brain,
  ShieldAlert,
  Terminal
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'projects'
  | 'kanban'
  | 'live-agents'
  | 'checklist'
  | 'integrations'
  | 'reports'
  | 'executions'
  | 'approvals'
  | 'diagnostics';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
  activeExecutionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  activeExecutionsCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'projects', label: 'Projetos SaaS', icon: Layers },
    { id: 'kanban', label: 'Kanban Inteligente', icon: Kanban },
    { 
      id: 'live-agents', 
      label: 'Raciocínio & Produção ao Vivo', 
      icon: Brain,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold animate-pulse'
    },
    { id: 'checklist', label: 'Checklist de Implantação', icon: CheckSquare },
    { id: 'integrations', label: 'Central de Integrações', icon: Cpu },
    { id: 'reports', label: 'Central de Relatórios', icon: FileText },
    { 
      id: 'executions', 
      label: 'Fila & Execuções', 
      icon: PlayCircle, 
      badge: activeExecutionsCount > 0 ? activeExecutionsCount : undefined,
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold'
    },
    { 
      id: 'approvals', 
      label: 'Aprovações Operacionais', 
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-rose-500 text-white font-bold animate-pulse'
    },
    { id: 'diagnostics', label: 'Diagnóstico & Saúde', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-surface-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <ShieldAlert className="w-5 h-5 text-surface-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base tracking-tight leading-tight flex items-center gap-1.5">
            SaaS Lab
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Validação Autônoma</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Centro de Operações
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-500/10 text-emerald-400 border border-brand-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-surface-950/40 text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-3.5 h-3.5 text-brand-500" />
          <span className="font-mono text-[11px] text-slate-300">Engine: SQLite WAL</span>
        </div>
        <p className="text-[11px] text-slate-400">Autonomia Persistente Ativa</p>
      </div>
    </aside>
  );
};
