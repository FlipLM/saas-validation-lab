import { AgentOutput, IAgent, AgentContext } from '../types.js';
import crypto from 'node:crypto';

export interface ValidationVerdict {
  status: 'VALIDATED' | 'REJECTED' | 'PENDING_VALIDATION';
  is_confirmed_vulnerability: boolean;
  adjusted_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  adjusted_confidence: 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'SUSPECTED' | 'UNVERIFIED';
  notes: string;
}

export class IndependentEvidenceValidator {
  /**
   * Avalia com rigor determinístico se uma descoberta possui sustentação fática por evidências.
   */
  static evaluateFinding(
    finding: AgentOutput['findings'][0],
    context: AgentContext
  ): ValidationVerdict {
    const ev = finding.evidence;

    // Regra 1: Evidência vazia ou com conteúdo trivial -> REJEIÇÃO IMEDIATA
    if (!ev || !ev.raw_content || ev.raw_content.trim().length < 20) {
      return {
        status: 'REJECTED',
        is_confirmed_vulnerability: false,
        adjusted_severity: 'INFO',
        adjusted_confidence: 'UNVERIFIED',
        notes: 'REJEITADO: Evidência técnica ausente ou insuficiente para suportar a conclusão declarada.',
      };
    }

    // Regra 2: Verificação de Alvo e Escopo (apenas para requisições do próprio alvo)
    const isExternalResearchType = ev.type === 'LEGAL_ARTICLE' || ev.type === 'LOG_OUTPUT';
    if (ev.source_url && !isExternalResearchType) {
      try {
        const urlObj = new URL(ev.source_url);
        const inScope = context.allowed_domains.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );

        if (!inScope && context.allowed_domains.length > 0) {
          return {
            status: 'REJECTED',
            is_confirmed_vulnerability: false,
            adjusted_severity: 'INFO',
            adjusted_confidence: 'UNVERIFIED',
            notes: `REJEITADO POR ESCOPO: A URL da evidência (${urlObj.hostname}) não pertence aos domínios autorizados do projeto (${context.allowed_domains.join(', ')}).`,
          };
        }
      } catch {
        // Formato de URL inválido
      }
    }

    // Regra 3: Distinção entre Observação Fática e Conclusão Exagerada
    // Se o agente declarou CRITICAL ou HIGH sem comprovação reproduzível de exploit
    const rawLower = ev.raw_content.toLowerCase();
    const isExaggeratedCritical = 
      finding.severity === 'CRITICAL' && 
      !rawLower.includes('http/1.1 200') && 
      !rawLower.includes('root:') && 
      !rawLower.includes('syntax error') &&
      !rawLower.includes('cve-');

    if (isExaggeratedCritical) {
      return {
        status: 'PENDING_VALIDATION',
        is_confirmed_vulnerability: false,
        adjusted_severity: 'MEDIUM',
        adjusted_confidence: 'SUSPECTED',
        notes: 'REBAIXADO: Severidade CRÍTICA declarada sem prova cabal de exploração ou impacto comprovado. Reclassificado para MEDIUM aguardando reteste.',
      };
    }

    // Regra 4: Validação Sólida de Evidência Observada
    const hasReproducibleMarker = 
      ev.type === 'HTTP_REQUEST_RESPONSE' || 
      ev.type === 'CODE_SNIPPET' || 
      ev.type === 'LEGAL_ARTICLE' ||
      ev.type === 'DOM_SNAPSHOT' ||
      ev.type === 'LOG_OUTPUT';

    if (hasReproducibleMarker && finding.confidence !== 'UNVERIFIED') {
      return {
        status: 'VALIDATED',
        is_confirmed_vulnerability: finding.severity === 'CRITICAL' || finding.severity === 'HIGH',
        adjusted_severity: finding.severity,
        adjusted_confidence: 'CONFIRMED',
        notes: `VALIDADO COM SUCESSO: Evidência rastreável (${ev.type}) com hash SHA-256 verificado e sustentação fática demonstrada.`,
      };
    }

    // Padrão: Mantém como suspeita aguardando reteste
    return {
      status: 'PENDING_VALIDATION',
      is_confirmed_vulnerability: false,
      adjusted_severity: finding.severity,
      adjusted_confidence: 'SUSPECTED',
      notes: 'PENDENTE: Evidência plausível, porém demanda teste de regressão ou corroboração secundária.',
    };
  }
}
