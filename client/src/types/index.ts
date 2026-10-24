export type ProjectEnvironment = 'development' | 'staging' | 'production';
export type ValidationStatus = 'PENDING' | 'IN_AUDIT' | 'VALIDATED' | 'BLOCKED' | 'PAUSED';

export interface Project {
  id: string;
  name: string;
  description: string;
  target_url: string;
  repo_url?: string;
  environment: ProjectEnvironment;
  auth_scope: string;
  validation_status: ValidationStatus;
  created_at: string;
  updated_at: string;
  tasks_count?: number;
  findings_count?: number;
}

export type TaskColumn = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';
export type TaskCategory = 'SECURITY' | 'ARCHITECTURE' | 'QA' | 'UX' | 'LEGAL' | 'GROWTH' | 'PRODUCT';
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description: string;
  column: TaskColumn;
  category: TaskCategory;
  priority: PriorityLevel;
  severity?: SeverityLevel;
  confidence?: string;
  risk_level: RiskLevel;
  requires_approval: number;
  assigned_agent?: string;
  acceptance_criteria?: string;
  dedup_key?: string;
  attempts: number;
  dependencies_pending?: number;
  created_at: string;
  updated_at: string;
}

export type ChecklistStatus = 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'FAILED' | 'COMPLETED';

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: ChecklistStatus;
  assigned_to?: string;
  acceptance_criteria: string;
  evidence_text?: string;
  updated_at: string;
}

export type IntegrationStatus = 
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'TESTING'
  | 'TESTED'
  | 'FAILED'
  | 'BLOCKED'
  | 'DISABLED';

export interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  config: Record<string, any>;
  last_test_at?: string;
  last_error?: string;
  updated_at: string;
  metadata?: {
    purpose: string;
    documentation_url: string;
    requirements: string;
    external_cost: string;
  };
}

export interface Report {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  summary: string;
  scope?: string;
  methodology?: string;
  findings_count: string;
  raw_content_md: string;
  created_at: string;
}

export interface Approval {
  id: string;
  task_id?: string;
  task_title?: string;
  project_name?: string;
  risk_level?: string;
  execution_id?: string;
  operation_type: string;
  scope_requested: string;
  risk_assessment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTPONED';
  decided_by?: string;
  decision_notes?: string;
  decided_at?: string;
  created_at: string;
}

export interface ExecutionJob {
  id: string;
  task_id?: string;
  task_title?: string;
  project_id: string;
  project_name?: string;
  agent_id: string;
  status: string;
  payload: string;
  result?: string;
  error_message?: string;
  attempts: number;
  max_retries?: number;
  heartbeat_at?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface DashboardStats {
  projects: {
    total: number;
    in_audit: number;
    blocked: number;
  };
  tasks: Record<string, number>;
  findings: {
    total: number;
    confirmed_vulnerabilities: number;
    by_severity: Record<string, number>;
  };
  executions: {
    active: number;
    queued: number;
    failed: number;
  };
  checklist: {
    total: number;
    completed: number;
    progress_percent: number;
  };
  integrations: Array<{ id: string; name: string; status: string }>;
  pending_approvals: number;
  recent_tasks: any[];
}
