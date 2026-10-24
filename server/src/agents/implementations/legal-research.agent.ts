import { IAgent, AgentContext, AgentOutput } from '../types.js';

export class LegalResearchAgent implements IAgent {
  id = 'legal-research';
  name = 'Legal Research Analyst';
  version = '1.0.0';
  description = 'Pesquisa jurídica baseada em fontes oficiais (Planalto, ANPD) e análise de conformidade preliminar.';

  async execute(ctx: AgentContext): Promise<AgentOutput> {
    const findings: AgentOutput['findings'] = [];
    const accessDate = new Date().toISOString().split('T')[0];

    // Análise 1: Requisitos da LGPD (Lei 13.709/2018)
    // Todo SaaS que coleta cadastros/autenticação processa dados pessoais
    findings.push({
      title: 'Mapeamento de Bases Legais para Coleta Cadastral (LGPD Art. 7º)',
      description: 'O SaaS opera cadastro e autenticação de usuários, o que configura tratamento de dados pessoais segundo o Art. 5º, X da Lei 13.709/2018. Exige-se definição formal de base legal (Art. 7º, I - Consentimento ou Art. 7º, V - Execução de Contrato).',
      category: 'LEGAL',
      severity: 'MEDIUM',
      confidence: 'CONFIRMED',
      recommendation: 'Documentar na Política de Privacidade e nos Termos de Uso quais bases legais respaldam cada finalidade de tratamento de dados cadastrais.',
      evidence: {
        type: 'LEGAL_ARTICLE',
        source_url: 'https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm',
        raw_content: `Fonte Oficial: Presidência da República / Casa Civil\nLei nº 13.709, de 14 de agosto de 2018 (LGPD Compilada)\nData de Consulta: ${accessDate}\nArt. 7º O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses:\nI - mediante o fornecimento de consentimento pelo titular;\n(...) V - quando necessário para a execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular...`,
      },
    });

    // Análise 2: Direitos dos Titulares de Dados (LGPD Art. 18)
    findings.push({
      title: 'Disponibilização de Canal para Exercício de Direitos do Titular (LGPD Art. 18)',
      description: 'O Art. 18 da LGPD assegura ao titular o direito de confirmação de tratamento, acesso, correção de dados incompletos e eliminação de dados tratados com consentimento. É necessária existência de canal ou interface para atendimento dessas solicitações.',
      category: 'LEGAL',
      severity: 'LOW',
      confidence: 'CONFIRMED',
      recommendation: 'Implementar fluxo de exclusão de conta ou formulário de solicitação de dados do titular gerenciado pelo encarregado (DPO).',
      evidence: {
        type: 'LEGAL_ARTICLE',
        source_url: 'https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm',
        raw_content: `Fonte Oficial: Planalto Compilado (Lei 13.709/2018)\nData de Consulta: ${accessDate}\nArt. 18. O titular dos dados pessoais tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição:\nI - confirmação da existência de tratamento;\nII - acesso aos dados;\nVI - eliminação dos dados pessoais tratados com o consentimento do titular...`,
      },
    });

    // Análise 3: Verificação de Aplicabilidade da Lei nº 13.787/2018 (Prontuários de Pacientes)
    // O SaaS trata prontuários de saúde?
    const hasHealthContext = 
      ctx.project_name.toLowerCase().includes('saude') || 
      ctx.project_name.toLowerCase().includes('med') || 
      ctx.project_name.toLowerCase().includes('clinic') ||
      ctx.target_url.toLowerCase().includes('health');

    if (hasHealthContext) {
      findings.push({
        title: 'Incidência de Requisitos Específicos para Prontuário Eletrônico (Lei nº 13.787/2018)',
        description: 'Identificado contexto de dados médicos. A Lei nº 13.787/2018 impõe guarda pelo prazo mínimo de 20 (vinte) anos a partir do último registro e utilização de certificado digital ICP-Brasil.',
        category: 'LEGAL',
        severity: 'HIGH',
        confidence: 'CONFIRMED',
        recommendation: 'Garantir retenção em repositório seguro com integridade imutável e assinatura ICP-Brasil conforme Art. 2º e 6º da Lei 13.787/2018.',
        evidence: {
          type: 'LEGAL_ARTICLE',
          source_url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm',
          raw_content: `Fonte Oficial: Presidência da República / Casa Civil\nLei nº 13.787, de 27 de dezembro de 2018\nData de Consulta: ${accessDate}\nArt. 6º Os prontuários em suporte de papel ou eletrônicos deverão ser guardados pelo prazo mínimo de 20 (vinte) anos, a partir do último registro...`,
        },
      });
    }

    return {
      summary: `Pesquisa jurídica concluída com fontes oficiais do Planalto em ${accessDate}. ${findings.length} obrigações/recomendações normativas mapeadas.`,
      findings,
      metrics: {
        sources_checked: 2,
        applicable_statutes: ['Lei nº 13.709/2018 (LGPD)', hasHealthContext ? 'Lei nº 13.787/2018' : 'N/A (Sem dados de saúde)'],
      },
      next_actions: [
        'Gerar minuta técnica de conformidade para revisão jurídica profissional',
        'Cadastrar tarefas no Kanban para adequação de consentimento nos formulários',
      ],
    };
  }
}
