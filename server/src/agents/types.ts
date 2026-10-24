import { Finding, Evidence } from '../types/index.js';

export interface AgentContext {
  project_id: string;
  project_name: string;
  target_url: string;
  repo_url?: string;
  environment: string;
  allowed_domains: string[];
  exclusions: string[];
  rate_limit_per_min: number;
  task_id?: string;
  task_title?: string;
  payload?: Record<string, any>;
}

export interface AgentOutput {
  summary: string;
  findings: Array<{
    title: string;
    description: string;
    category: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    confidence: 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'SUSPECTED' | 'UNVERIFIED';
    recommendation?: string;
    evidence: {
      type: 'HTTP_REQUEST_RESPONSE' | 'CODE_SNIPPET' | 'LOG_OUTPUT' | 'LEGAL_ARTICLE' | 'DOM_SNAPSHOT';
      source_url?: string;
      raw_content: string;
    };
  }>;
  next_actions?: string[];
  metrics?: Record<string, any>;
}

export interface IAgent {
  id: string;
  name: string;
  version: string;
  description: string;
  execute(ctx: AgentContext): Promise<AgentOutput>;
}
