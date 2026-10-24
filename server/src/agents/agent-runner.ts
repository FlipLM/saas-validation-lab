import { IAgent, AgentContext, AgentOutput } from './types.js';
import { WebReconAgent } from './implementations/web-recon.agent.js';
import { LegalResearchAgent } from './implementations/legal-research.agent.js';
import { IndependentEvidenceValidator } from './implementations/independent-validator.agent.js';
import { 
  ProductDiscoveryAgent,
  CodeArchitectureAuditorAgent,
  QASecurityReliabilityAgent,
  UXReconAgent,
  CompetitiveIntelligenceAgent,
  MarketGrowthAgent,
  LegalPrivacyComplianceAuditorAgent,
  ProductValidationReleaseReadinessAgent,
} from './implementations/specialized-agents.js';
import { execute, transaction } from '../db/index.js';
import crypto from 'node:crypto';

export class AgentRunner {
  private static agentsRegistry: Record<string, IAgent> = {
    'Web Recon Agent': new WebReconAgent(),
    'Legal Research Analyst': new LegalResearchAgent(),
    'Product Discovery Agent': new ProductDiscoveryAgent(),
    'Code & Architecture Auditor': new CodeArchitectureAuditorAgent(),
    'QA, Security & Reliability Agent': new QASecurityReliabilityAgent(),
    'UX Recon Agent': new UXReconAgent(),
    'Competitive Intelligence Agent': new CompetitiveIntelligenceAgent(),
    'Market & Growth Agent': new MarketGrowthAgent(),
    'Legal & Privacy Compliance Auditor': new LegalPrivacyComplianceAuditorAgent(),
    'Product Validation & Release Readiness Agent': new ProductValidationReleaseReadinessAgent(),
    // IDs alternativos normalizados
    'web-recon': new WebReconAgent(),
    'legal-research': new LegalResearchAgent(),
  };

  static async runAgent(agentId: string, ctx: AgentContext, executionId?: string): Promise<{
    output: AgentOutput;
    persistedFindingsCount: number;
    validatedFindingsCount: number;
  }> {
    const agent = this.agentsRegistry[agentId];
    if (!agent) {
      throw new Error(`Agente "${agentId}" não encontrado no registro de agentes.`);
    }

    console.log(`[AGENT RUNNER] Iniciando execução do agente "${agent.name}" para o projeto ${ctx.project_name}...`);
    const output = await agent.execute(ctx);

    let persistedCount = 0;
    let validatedCount = 0;

    // Submissão compulsória ao Independent Evidence Validator
    transaction(() => {
      for (const finding of output.findings) {
        const verdict = IndependentEvidenceValidator.evaluateFinding(finding, ctx);
        const findingId = crypto.randomUUID();

        // 1. Persiste a Descoberta com Veredito Independente
        execute(`
          INSERT INTO findings (
            id, project_id, execution_id, agent_id, title, description,
            category, severity, confidence, validation_status,
            is_confirmed_vulnerability, recommendation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          findingId,
          ctx.project_id,
          executionId || null,
          agent.id,
          finding.title,
          finding.description,
          finding.category,
          verdict.adjusted_severity,
          verdict.adjusted_confidence,
          verdict.status,
          verdict.is_confirmed_vulnerability ? 1 : 0,
          finding.recommendation || null,
        ]);

        persistedCount++;
        if (verdict.status === 'VALIDATED') {
          validatedCount++;
        }

        // 2. Persiste a Evidência Rastreável com Hash Criptográfico SHA-256
        if (finding.evidence) {
          const rawContent = finding.evidence.raw_content;
          const sha256 = crypto.createHash('sha256').update(rawContent).digest('hex');

          execute(`
            INSERT INTO evidence (
              id, finding_id, project_id, agent_id, type, category,
              source_url, content, sha256_hash, validation_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            crypto.randomUUID(),
            findingId,
            ctx.project_id,
            agent.id,
            finding.evidence.type,
            verdict.status === 'VALIDATED' ? 'OBSERVED' : 'UNVERIFIED',
            finding.evidence.source_url || null,
            rawContent,
            sha256,
            verdict.notes,
          ]);
        }
      }
    });

    console.log(`[AGENT RUNNER] Execução do agente "${agent.name}" concluída. ${persistedCount} descobertas geradas (${validatedCount} validadas com evidência).`);

    return {
      output,
      persistedFindingsCount: persistedCount,
      validatedFindingsCount: validatedCount,
    };
  }
}
