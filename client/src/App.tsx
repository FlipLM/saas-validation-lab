import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Dashboard } from './pages/Dashboard.js';
import { Projects } from './pages/Projects.js';
import { Kanban } from './pages/Kanban.js';
import { Checklist } from './pages/Checklist.js';
import { Integrations } from './pages/Integrations.js';
import { Reports } from './pages/Reports.js';
import { Executions } from './pages/Executions.js';
import { Approvals } from './pages/Approvals.js';
import { Diagnostics } from './pages/Diagnostics.js';
import { LiveAgentStream } from './pages/LiveAgentStream.js';
import { api } from './services/api.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isPaused, setIsPaused] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [activeExecutions, setActiveExecutions] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadGlobalState();
    const interval = setInterval(loadGlobalState, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGlobalState = async () => {
    try {
      const [autoStatus, approvals, executions] = await Promise.all([
        api.getAutomationStatus(),
        api.listApprovals('PENDING'),
        api.listExecutions({ status: 'RUNNING' }),
      ]);
      setIsPaused(autoStatus.global_automation_paused);
      setPendingApprovals(approvals.length);
      setActiveExecutions(executions.length);
    } catch (err) {
      console.error('Falha ao sincronizar estado global:', err);
    }
  };

  const handleTogglePause = async () => {
    try {
      const nextState = !isPaused;
      await api.toggleGlobalPause(nextState);
      setIsPaused(nextState);
    } catch (err: any) {
      alert(`Erro ao alterar pausa global: ${err.message}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGlobalState();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex min-h-screen bg-surface-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovals}
        activeExecutionsCount={activeExecutions}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'projects' && <Projects />}
          {activeTab === 'kanban' && <Kanban />}
          {activeTab === 'live-agents' && <LiveAgentStream />}
          {activeTab === 'checklist' && <Checklist />}
          {activeTab === 'integrations' && <Integrations />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'executions' && <Executions />}
          {activeTab === 'approvals' && <Approvals />}
          {activeTab === 'diagnostics' && <Diagnostics />}
        </main>
      </div>
    </div>
  );
};
export default App;
