// ==============================================================================
// SAAS VALIDATION LAB - TIPOS CANÔNICOS DE DOMÍNIO
// ==============================================================================

export type ProjectEnvironment = 'development' | 'staging' | 'production';
export type ValidationStatus = 'PENDING' | 'IN_AUDIT' | 'VALIDATED' | 'BLOCKED' | 'PAUSED';

export interface Project {
  id: string;
  name: string;
  description: string;
  target_url: string;
  repo_url?: string;
  environment: ProjectEnvironment;
  auth_scope: string; // JSON com allowed_domains, exclusions, rate_limit
  validation_status: ValidationStatus;
  created_at: string;
  updated_at: string;
}

export type TaskColumn = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';
export type TaskCategory = 'SECURITY' | 'ARCHITECTURE' | 'QA' | 'UX' | 'LEGAL' | 'GROWTH' | 'PRODUCT';
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type ConfidenceLevel = 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'SUSPECTED' | 'UNVERIFIED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  column: TaskColumn;
  category: TaskCategory;
  priority: PriorityLevel;
  severity?: SeverityLevel;
  confidence?: ConfidenceLevel;
  risk_level: RiskLevel;
  requires_approval: number; // 0 ou 1
  assigned_agent?: string;
  acceptance_criteria?: string; // JSON array
  dedup_key?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  // Campos computados em joins:
  project_name?: string;
  dependencies_pending?: number;
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

export type JobStatus = 
  | 'CREATED'
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'WAITING_DEPENDENCY'
  | 'RETRY_PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'BLOCKED';

export interface ExecutionJob {
  id: string;
  task_id?: string;
  project_id: string;
  agent_id: string;
  status: JobStatus;
  payload: string; // JSON
  result?: string; // JSON
  error_message?: string;
  attempts: number;
  max_retries: number;
  heartbeat_at?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export type FindingValidationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'REPRODUCED';

export interface Finding {
  id: string;
  project_id: string;
  execution_id?: string;
  agent_id: string;
  title: string;
  description: string;
  category: string;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  validation_status: FindingValidationStatus;
  is_confirmed_vulnerability: number; // 0 ou 1
  recommendation?: string;
  created_at: string;
}

export type EvidenceCategory = 'OBSERVED' | 'REPRODUCED' | 'CORROBORATED' | 'INFERRED' | 'UNVERIFIED' | 'REJECTED';
export type EvidenceType = 'HTTP_REQUEST_RESPONSE' | 'CODE_SNIPPET' | 'LOG_OUTPUT' | 'LEGAL_ARTICLE' | 'DOM_SNAPSHOT';

export interface Evidence {
  id: string;
  finding_id?: string;
  project_id: string;
  agent_id: string;
  type: EvidenceType;
  category: EvidenceCategory;
  source_url?: string;
  content: string;
  sha256_hash: string;
  validation_notes?: string;
  created_at: string;
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
  config_masked: string; // JSON com valores mascarados
  last_test_at?: string;
  last_error?: string;
  updated_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  scope?: string;
  methodology?: string;
  findings_count: string; // JSON { critical: 0, high: 1, ... }
  raw_content_md: string;
  created_at: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTPONED';

export interface Approval {
  id: string;
  task_id?: string;
  execution_id?: string;
  operation_type: string;
  scope_requested: string;
  risk_assessment: string;
  status: ApprovalStatus;
  decided_by?: string;
  decision_notes?: string;
  decided_at?: string;
  created_at: string;
}

export interface PolicySettings {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}
