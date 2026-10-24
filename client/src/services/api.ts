import {
  DashboardStats,
  Project,
  Task,
  ChecklistItem,
  Integration,
  Report,
  Approval,
  ExecutionJob,
  TaskColumn,
} from '../types/index.js';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Erro na requisição HTTP ${res.status}`);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Projetos
  listProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<any>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),

  // Tarefas / Kanban
  listTasks: (filters?: { projectId?: string; column?: string; category?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.column) params.append('column', filters.column);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    return request<Task[]>(`/tasks?${params.toString()}`);
  },
  getTask: (id: string) => request<any>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  moveTask: (id: string, column: TaskColumn, justification?: string) =>
    request<Task>(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ column, justification }) }),
  updateTask: (id: string, data: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  // Checklist
  getChecklist: () => request<{
    overall_progress: number;
    total_items: number;
    completed_items: number;
    categories: Record<string, ChecklistItem[]>;
    raw_items: ChecklistItem[];
  }>('/checklist'),
  updateChecklistItem: (id: string, data: { status?: string; evidence_text?: string; assigned_to?: string }) =>
    request<ChecklistItem>(`/checklist/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Integrações
  listIntegrations: () => request<Integration[]>('/integrations'),
  testIntegration: (id: string) => request<Integration>(`/integrations/${id}/test`, { method: 'POST' }),
  updateIntegrationConfig: (id: string, config: Record<string, any>) =>
    request<Integration>(`/integrations/${id}`, { method: 'PUT', body: JSON.stringify(config) }),
  disableIntegration: (id: string) => request<Integration>(`/integrations/${id}/disable`, { method: 'POST' }),

  // Relatórios
  listReports: (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return request<Report[]>(`/reports${params}`);
  },
  getReport: (id: string) => request<any>(`/reports/${id}`),
  generateReport: (projectId: string, title?: string) =>
    request<Report>('/reports/generate', { method: 'POST', body: JSON.stringify({ projectId, title }) }),

  // Execuções e Orquestrador
  listExecutions: (filters?: { status?: string; projectId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    return request<ExecutionJob[]>(`/executions?${params.toString()}`);
  },
  triggerExecution: (data: { project_id: string; agent_id: string; task_id?: string; payload?: any }) =>
    request<ExecutionJob>('/executions/trigger', { method: 'POST', body: JSON.stringify(data) }),
  cancelJob: (id: string, reason?: string) =>
    request<ExecutionJob>(`/executions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getAutomationStatus: () => request<{ global_automation_paused: boolean }>('/executions/automation-status'),
  toggleGlobalPause: (pause: boolean) =>
    request<{ global_automation_paused: boolean }>('/executions/toggle-pause', { method: 'POST', body: JSON.stringify({ pause }) }),

  // Aprovações
  listApprovals: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Approval[]>(`/approvals${params}`);
  },
  decideApproval: (id: string, decision: 'APPROVED' | 'REJECTED' | 'POSTPONED', notes?: string) =>
    request<Approval>(`/approvals/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, notes }) }),

  // Diagnósticos
  getDiagnostics: () => request<any>('/diagnostics/health'),
};
