import { IAgent, AgentContext, AgentOutput } from '../types.js';
import { LLMService } from '../../services/llm.service.js';

export class HermesAgent implements IAgent {
  id = 'hermes-agent';
  name = 'Agente Hermes (Orquestrador & Reparador Autônomo)';
  version = '3.0.0';
  description = 'Agente autônomo de remediação, geração cirúrgica de código e orquestração ágil com escalação para o Antigravity.';

  async execute(ctx: AgentContext): Promise<AgentOutput> {
    const taskTitle = ctx.task_title || 'Remediação e Correção de Arquitetura';
    console.log(`[HERMES AGENT] Iniciando orquestração autônoma da tarefa "${taskTitle}" para ${ctx.project_name}...`);

    const systemPrompt = `Você é o Agente Hermes, o principal orquestrador e reparador técnico do SaaS Validation Lab.
Sua missão é diagnosticar vulnerabilidades, falhas de arquitetura ou pendências regulatórias no projeto "${ctx.project_name}" (${ctx.target_url}) e gerar a solução técnica precisa com código em TypeScript/Node.js/Prisma/SQL.
Você DEVE retornar estritamente um JSON estruturado com os seguintes campos:
{
  "diagnosis": "Diagnóstico claro e objetivo do problema",
  "codePatch": "Bloco de código ou configuração pronta para resolver o apontamento",
  "complexity": "LOW" | "MEDIUM" | "HIGH",
  "recommendation": "Diretriz operacional para o time de engenharia"
}
Não inclua blocos markdown extras fora do JSON.`;

    const userPrompt = `Projeto: ${ctx.project_name}
Repositório: ${ctx.repo_url || 'FlipLM/FisioPlus'}
URL de Produção: ${ctx.target_url}
Tarefa: ${taskTitle}
Escopo Autorizado: ${ctx.allowed_domains.join(', ') || ctx.target_url}

Gere o diagnóstico, o patch de código cirúrgico e a complexidade técnica.`;

    let diagnosis = 'Análise técnica executada pelo Agente Hermes.';
    let codePatch = '// Nenhuma alteração de código necessária.';
    let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    let recommendation = 'Aplicar revisão por pares antes do deploy.';
    let modelUsed = 'cohere/north-mini-code:free';

    try {
      const llmResult = await LLMService.generate(userPrompt, {
        specialty: 'coding',
        systemPrompt,
        maxTokens: 1200,
        temperature: 0.1,
        taskId: ctx.task_id,
        projectId: ctx.project_id,
        taskTitle: ctx.task_title,
      });

      if (llmResult.modelUsed) {
        modelUsed = llmResult.modelUsed;
      }

      if (llmResult.escalatedToAntigravity) {
        return {
          summary: `A tarefa "${taskTitle}" foi escalada para o Antigravity no seu IDE devido à alta complexidade ou esgotamento de cota gratuita do OpenRouter.`,
          findings: [
            {
              title: `[ESCALADA ANTIGRAVITY] ${taskTitle}`,
              description: `O Agente Hermes identificou necessidade de intervenção local no repositório. Motivo: ${llmResult.escalationReason}`,
              category: 'ARCHITECTURE',
              severity: 'HIGH',
              confidence: 'CONFIRMED',
              recommendation: 'Abra o IDE Antigravity no computador e execute a tarefa pendente.',
              evidence: {
                type: 'LOG_OUTPUT',
                source_url: ctx.target_url,
                raw_content: `Escalação para o Antigravity:\nTarefa: ${taskTitle}\nMotivo: ${llmResult.escalationReason}`,
              },
            },
          ],
          next_actions: ['Aguardando execução no Antigravity IDE'],
        };
      }

      if (llmResult.content) {
        try {
          const cleaned = llmResult.content.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.diagnosis) diagnosis = parsed.diagnosis;
          if (parsed.codePatch) codePatch = parsed.codePatch;
          if (parsed.complexity) complexity = parsed.complexity.toUpperCase();
          if (parsed.recommendation) recommendation = parsed.recommendation;
        } catch {
          diagnosis = llmResult.content;
          codePatch = `// Parecer do Agente Hermes:\n${llmResult.content}`;
        }
      }
    } catch (err: any) {
      console.warn('[HERMES AGENT] Falha na consulta de IA, aplicando fallback determinístico:', err.message);
    }

    // Se o Hermes julgar que a complexidade é ALTA, ele também repassa formalmente para o Antigravity
    if (complexity === 'HIGH' && ctx.task_id) {
      await LLMService.escalateTaskToAntigravity(
        ctx.task_id,
        ctx.project_id,
        ctx.task_title,
        'O Agente Hermes classificou esta tarefa como de ALTA COMPLEXIDADE ARQUITETURAL (múltiplos arquivos ou migração relacional crítica).'
      );
    }

    return {
      summary: `Orquestração da tarefa "${taskTitle}" concluída pelo Agente Hermes usando o modelo ${modelUsed}. Complexidade: ${complexity}.`,
      findings: [
        {
          title: `[Hermes Solução] ${taskTitle}`,
          description: diagnosis,
          category: 'ARCHITECTURE',
          severity: complexity === 'HIGH' ? 'HIGH' : complexity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
          confidence: 'CONFIRMED',
          recommendation,
          evidence: {
            type: 'CODE_SNIPPET',
            source_url: ctx.repo_url || ctx.target_url,
            raw_content: `// Código gerado pelo Agente Hermes (Modelo: ${modelUsed}):\n${codePatch}`,
          },
        },
      ],
      next_actions: [
        complexity === 'HIGH' 
          ? 'Execução atribuída ao Antigravity no IDE local' 
          : 'Revisar patch de código na Central de Relatórios'
      ],
    };
  }
}
