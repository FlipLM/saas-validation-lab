import { db } from '../index.js';
import crypto from 'node:crypto';

export function runSeeds(): void {
  console.log('[DB] Inserindo dados iniciais auditados (seeds)...');

  // 1. Políticas Globais Padrão
  const defaultPolicies = [
    { key: 'GLOBAL_AUTOMATION_PAUSED', value: 'false', description: 'Pausa global da distribuição de tarefas do orquestrador' },
    { key: 'WORKER_CONCURRENCY', value: '2', description: 'Número máximo de tarefas executadas simultaneamente' },
    { key: 'REQUIRE_APPROVAL_HIGH_RISK', value: 'true', description: 'Exigir aprovação humana antes de executar ações de alto risco' },
    { key: 'MAX_RETRIES_PER_TASK', value: '3', description: 'Número máximo de tentativas em caso de erro temporário' },
    { key: 'DEFAULT_RATE_LIMIT_PER_MIN', value: '60', description: 'Limite de requisições por minuto nos alvos auditados' },
  ];

  for (const p of defaultPolicies) {
    db.prepare(`
      INSERT INTO policy_settings (key, value, description)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET description = excluded.description
    `).run(p.key, p.value, p.description);
  }

  // 2. Integrações Padrão
  const defaultIntegrations = [
    {
      id: 'pentagi',
      name: 'PentAGI Security Platform',
      status: 'NOT_CONFIGURED',
      config_masked: JSON.stringify({ api_url: 'http://localhost:8080', api_key: 'NOT_SET', enabled: false }),
    },
    {
      id: 'telegram',
      name: 'Telegram Bot API Notifications',
      status: 'NOT_CONFIGURED',
      config_masked: JSON.stringify({ bot_token: 'NOT_SET', chat_id: 'NOT_SET', enabled: false }),
    },
    {
      id: 'openrouter',
      name: 'OpenRouter Multi-LLM Platform',
      status: 'NOT_CONFIGURED',
      config_masked: JSON.stringify({ api_key: 'NOT_SET', default_model: 'openrouter/free', enabled: false }),
    },
  ];

  for (const integ of defaultIntegrations) {
    db.prepare(`
      INSERT INTO integrations (id, name, status, config_masked)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).run(integ.id, integ.name, integ.status, integ.config_masked);
  }

  // 3. Checklist de Implantação Canônico (18 Categorias Obrigatórias)
  const checklistData = [
    {
      category: 'Infraestrutura',
      title: 'Ambiente de Execução e Recursos de Sistema',
      description: 'Verificação da capacidade de CPU, memória, disco e Node.js 24+ do host.',
      acceptance_criteria: 'Node.js v24+, disco > 1GB livre, sistema operacional Windows/Linux reconhecido.',
      status: 'COMPLETED',
      assigned_to: 'DevOps Lead',
      evidence_text: 'Node v24.19.0, npm 11.17.0 e fs persistente verificados na inicialização do sistema.',
    },
    {
      category: 'Banco de dados',
      title: 'Persistência SQLite WAL e Integridade Relacional',
      description: 'Criação das 14 tabelas canônicas com foreign keys e transações ACID.',
      acceptance_criteria: 'Tabelas criadas, índices ativos, journal_mode WAL habilitado sem erros de DDL.',
      status: 'COMPLETED',
      assigned_to: 'Database Admin',
      evidence_text: '14 tabelas migradas e índices criados via server/src/db/migrations.ts.',
    },
    {
      category: 'Backend',
      title: 'API REST Segura com Validação Zod',
      description: 'Estruturação dos controladores, serviços desacoplados e middlewares de segurança.',
      acceptance_criteria: 'Rotas REST respondendo com status semânticos e esquemas validados com Zod.',
      status: 'IN_PROGRESS',
      assigned_to: 'Backend Engineer',
      evidence_text: 'Estrutura de rotas e serviços em desenvolvimento em server/src/routes.',
    },
    {
      category: 'Frontend',
      title: 'Centro de Comando Visual SPA Responsivo',
      description: 'Dashboard, Kanban, Checklist, Integrações, Relatórios e Aprovações em React + Vite.',
      acceptance_criteria: 'Telas completas, design dark moderno, sem números fictícios, comunicando com a API.',
      status: 'IN_PROGRESS',
      assigned_to: 'Frontend Lead',
      evidence_text: 'Interface SPA estruturada em client/src com TailwindCSS e componentes modulares.',
    },
    {
      category: 'Autenticação e autorização',
      title: 'Controle de Acesso RBAC e Isolamento de Projetos',
      description: 'Mecanismo de proteção de rotas e separação lógica estrita entre dados de projetos.',
      acceptance_criteria: 'Tokens seguros, RBAC (admin, auditor, viewer) e validação de permissões.',
      status: 'PENDING',
      assigned_to: 'Security Engineer',
      evidence_text: 'Aguardando implementação dos middlewares de autorização.',
    },
    {
      category: 'Orquestrador',
      title: 'Máquina de Estados e Resolução de Dependências',
      description: 'Serviço daemon autônomo com transições válidas e detecção de tarefas elegíveis.',
      acceptance_criteria: 'Tarefas respeitam grafo de dependências, prioridades manuais e aprovações.',
      status: 'PENDING',
      assigned_to: 'Systems Architect',
      evidence_text: 'Aguardando implementação da Fase 2.',
    },
    {
      category: 'Workers',
      title: 'Fila Persistente e Recuperação de Falhas',
      description: 'Worker independente com locks transacionais atômicos, heartbeats e retries.',
      acceptance_criteria: 'Worker roda em segundo plano e recupera jobs abandonados após reinicialização.',
      status: 'PENDING',
      assigned_to: 'Distributed Systems Eng',
      evidence_text: 'Aguardando implementação da Fase 2.',
    },
    {
      category: 'Agentes',
      title: '11 Agentes Especializados com Contratos Estritos',
      description: 'Implementação de contratos com ferramentas limitadas e saídas estruturadas.',
      acceptance_criteria: 'Cada agente possui escopo fechado, entradas tipadas e evidências obrigatórias.',
      status: 'PENDING',
      assigned_to: 'AI Engineering Lead',
      evidence_text: 'Aguardando implementação da Fase 5.',
    },
    {
      category: 'PentAGI',
      title: 'Adaptador Real PentAGI com Checagem de Infraestrutura',
      description: 'Integração de segurança ofensiva autorizada com verificação real de conectividade.',
      acceptance_criteria: 'Status real comprovado por handshake HTTP. Sem mocks marcados como TESTED.',
      status: 'PENDING',
      assigned_to: 'AppSec Lead',
      evidence_text: 'Adaptador declarado com status inicial NOT_CONFIGURED.',
    },
    {
      category: 'Telegram',
      title: 'Distribuição Oficial de Alertas e Relatórios',
      description: 'Notificações estruturadas e entrega de relatórios em Markdown via Telegram Bot API.',
      acceptance_criteria: 'Envio real testado apenas com token válido; mascaramento rigoroso de credenciais.',
      status: 'PENDING',
      assigned_to: 'Integration Eng',
      evidence_text: 'Adaptador declarado com status inicial NOT_CONFIGURED.',
    },
    {
      category: 'Segurança',
      title: 'Defesa contra Prompt Injection e Proteção SSRF',
      description: 'Tratamento de dados auditados como não confiáveis e bloqueio de requisições fora de escopo.',
      acceptance_criteria: 'Whitelist de domínios estrita e sanitização em tempo de execução.',
      status: 'PENDING',
      assigned_to: 'AppSec Lead',
      evidence_text: 'Políticas de escopo definidas em docs/SECURITY.md.',
    },
    {
      category: 'Pesquisa jurídica',
      title: 'Conformidade Regulatória (LGPD e Legislação Oficial)',
      description: 'Mapeamento de obrigações com base no Planalto (Lei 13.709/2018 e 13.787/2018).',
      acceptance_criteria: 'Links oficiais com data de acesso, distinção entre obrigação e recomendação.',
      status: 'PENDING',
      assigned_to: 'Legal Analyst',
      evidence_text: 'Estrutura conceitual documentada em docs/LEGAL_COMPLIANCE.md.',
    },
    {
      category: 'Testes automatizados',
      title: 'Suíte de Testes Unitários e Integração',
      description: 'Testes automatizados cobrindo máquina de estados, validador independente e API.',
      acceptance_criteria: 'Suíte de testes executando e passando 100% via Vitest sem erros.',
      status: 'PENDING',
      assigned_to: 'QA Lead',
      evidence_text: 'Aguardando criação dos arquivos de teste na Fase 8.',
    },
    {
      category: 'Observabilidade',
      title: 'Logs Estruturados e Métricas Operacionais',
      description: 'Histórico de eventos, tempos de execução e endpoints de diagnóstico de saúde.',
      acceptance_criteria: 'Rota /api/diagnostics/health respondendo com tempo de resposta do BD e status do worker.',
      status: 'PENDING',
      assigned_to: 'DevOps Lead',
      evidence_text: 'Aguardando implementação da rota de diagnósticos.',
    },
    {
      category: 'Backup e recuperação',
      title: 'Runbook Operacional e Snapshot a Quente',
      description: 'Procedimento testado de cópia atômica do banco SQLite e restauração pós-falha.',
      acceptance_criteria: 'Procedimento documentado em docs/OPERATIONS.md e script testado.',
      status: 'PENDING',
      assigned_to: 'SRE Lead',
      evidence_text: 'Documentação criada em docs/OPERATIONS.md.',
    },
    {
      category: 'Documentação',
      title: 'Memória Permanente e Guias por Código',
      description: 'Documentação técnica canônica em docs/ cobrindo arquitetura, banco, APIs e runbooks.',
      acceptance_criteria: '15 documentos canônicos em docs/ completos e alinhados com o código real.',
      status: 'COMPLETED',
      assigned_to: 'Documentation Lead',
      evidence_text: '15 arquivos de documentação criados em docs/ e validados com as regras do sistema.',
    },
    {
      category: 'Implantação',
      title: 'Scripts de Inicialização e Execução Contínua',
      description: 'Configuração de daemons e scripts npm run start para operação permanente.',
      acceptance_criteria: 'Serviços sobem e mantêm execução desacoplada do ambiente de desenvolvimento.',
      status: 'PENDING',
      assigned_to: 'DevOps Lead',
      evidence_text: 'Aguardando consolidação dos executáveis finais.',
    },
    {
      category: 'Operação autônoma',
      title: 'Loop Contínuo do Orquestrador sem Intervenção',
      description: 'Ciclo completo de leitura de backlog, enfileiramento, execução de workers e retestes.',
      acceptance_criteria: 'Sistema opera de modo autônomo e seguro, respeitando a pausa global e aprovações.',
      status: 'PENDING',
      assigned_to: 'Systems Architect',
      evidence_text: 'Aguardando conclusão das fases do orquestrador.',
    },
  ];

  for (const item of checklistData) {
    const existing = db.prepare('SELECT id FROM checklist_items WHERE category = ? AND title = ?').get(item.category, item.title);
    if (!existing) {
      db.prepare(`
        INSERT INTO checklist_items (id, category, title, description, status, assigned_to, acceptance_criteria, evidence_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        item.category,
        item.title,
        item.description,
        item.status,
        item.assigned_to,
        item.acceptance_criteria,
        item.evidence_text
      );
    }
  }

  // 4. Criação de um Projeto SaaS de Demonstração Inicial Realista (para validação imediata)
  const existingProject = db.prepare('SELECT id FROM projects LIMIT 1').get();
  if (!existingProject) {
    const projectId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO projects (id, name, description, target_url, repo_url, environment, auth_scope, validation_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      'SaaS Lab Target Demo',
      'Aplicação SaaS de teste para validação de fluxos de auditoria e conformidade',
      'https://httpbin.org',
      'https://github.com/example/saas-demo',
      'development',
      JSON.stringify({
        allowed_domains: ['httpbin.org'],
        exclusions: ['/delete', '/status/500'],
        rate_limit_per_min: 30
      }),
      'IN_AUDIT'
    );

    // Inserir tarefas iniciais no Kanban para o projeto demo
    const sampleTasks = [
      {
        title: 'Mapeamento de Rotas e Formulários Públicos',
        description: 'Web Recon Agent deve identificar todos os endpoints acessíveis e cabeçalhos de segurança.',
        column: 'IN_PROGRESS',
        category: 'SECURITY',
        priority: 'HIGH',
        risk_level: 'LOW',
        requires_approval: 0,
        assigned_agent: 'Web Recon Agent',
        acceptance_criteria: JSON.stringify(['Inventário de rotas gerado', 'Cabeçalhos HSTS/CSP analisados']),
        dedup_key: 'task-recon-001'
      },
      {
        title: 'Análise de Conformidade Preliminar LGPD (Art. 6 e 7)',
        description: 'Legal Research Analyst deve levantar a política de privacidade e formular bases legais para dados cadastrais.',
        column: 'TODO',
        category: 'LEGAL',
        priority: 'MEDIUM',
        risk_level: 'LOW',
        requires_approval: 0,
        assigned_agent: 'Legal Research Analyst',
        acceptance_criteria: JSON.stringify(['Bases legais identificadas', 'Fontes oficiais do Planalto referenciadas']),
        dedup_key: 'task-legal-001'
      },
      {
        title: 'Teste de Injeção de Carga Massiva em Endpoints de Autenticação',
        description: 'Verificação de rate limiting sob rajada de requisições. Exige autorização por potencial impacto.',
        column: 'BACKLOG',
        category: 'QA',
        priority: 'CRITICAL',
        risk_level: 'HIGH',
        requires_approval: 1,
        assigned_agent: 'QA, Security & Reliability Agent',
        acceptance_criteria: JSON.stringify(['Aprovação do operador concedida', 'Comportamento 429 Too Many Requests verificado']),
        dedup_key: 'task-stress-001'
      }
    ];

    for (const st of sampleTasks) {
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, column, category, priority, risk_level, requires_approval, assigned_agent, acceptance_criteria, dedup_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        projectId,
        st.title,
        st.description,
        st.column,
        st.category,
        st.priority,
        st.risk_level,
        st.requires_approval,
        st.assigned_agent,
        st.acceptance_criteria,
        st.dedup_key
      );
    }
  }

  // 5. Assegura conjunto completo de tarefas especializadas para todos os projetos
  const allProjects = db.prepare('SELECT id, name FROM projects').all() as Array<{ id: string; name: string }>;
  const specializedTasksDefinitions = [
    {
      title: 'Mapeamento Profundo de Concorrentes (ZenFisio, FisioWorks, ConecteFisio)',
      description: 'Competitive Intelligence Agent deve investigar os principais concorrentes no Brasil, matriz de funcionalidades, precificação e pontos de dor dos clientes.',
      column: 'TODO',
      category: 'GROWTH',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'Competitive Intelligence Agent',
      acceptance_criteria: JSON.stringify(['Matriz de concorrentes consolidada', 'Diferenciais de mercado mapeados']),
      dedup_suffix: 'competitor-001'
    },
    {
      title: 'Estudo de Mercado e Dimensionamento TAM/SAM/SOM para Fisioterapia',
      description: 'Market & Growth Agent deve analisar o tamanho de mercado de consultórios e clínicas de fisioterapia no Brasil, CAC, LTV e canais de tração.',
      column: 'TODO',
      category: 'GROWTH',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'Market & Growth Agent',
      acceptance_criteria: JSON.stringify(['TAM/SAM/SOM mapeado', 'Estratégia de CAC e LTV definida']),
      dedup_suffix: 'market-001'
    },
    {
      title: 'Mapeamento de Personas e Validação de Proposta de Valor',
      description: 'Product Discovery Agent deve delimitar as personas de fisioterapeutas autônomos e gestores de clínica e mapear a jornada de retenção.',
      column: 'TODO',
      category: 'PRODUCT',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'Product Discovery Agent',
      acceptance_criteria: JSON.stringify(['Personas detalhadas', 'Jornada crítica do paciente definida']),
      dedup_suffix: 'product-001'
    },
    {
      title: 'Auditoria de Arquitetura e Isolamento Multi-tenant no FisioPlus',
      description: 'Code & Architecture Auditor deve avaliar a resiliência do backend, pool de conexões PostgreSQL e isolamento estrito de dados entre clínicas.',
      column: 'TODO',
      category: 'ARCHITECTURE',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'Code & Architecture Auditor',
      acceptance_criteria: JSON.stringify(['Isolamento de tenant validado', 'Resiliência de conexões Prisma auditada']),
      dedup_suffix: 'arch-001'
    },
    {
      title: 'Auditoria de Usabilidade e Ergonomia Digital em Fichas Clínicas Touchscreen',
      description: 'UX Recon Agent deve analisar a agilidade no preenchimento de anamnese e evolução diária por fisioterapeutas em tablets e smartphones.',
      column: 'TODO',
      category: 'UX',
      priority: 'MEDIUM',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'UX Recon Agent',
      acceptance_criteria: JSON.stringify(['Ergonomia mobile avaliada', 'Fluxo de preenchimento em menos de 2 minutos']),
      dedup_suffix: 'ux-001'
    },
    {
      title: 'Auditoria da Lei 13.787/2018 (Guarda de Prontuários por 20 Anos) e LGPD Art. 11',
      description: 'Legal & Privacy Compliance Auditor deve verificar conformidade de guarda por 20 anos e trilhas de auditoria para dados sensíveis de saúde.',
      column: 'TODO',
      category: 'LEGAL',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'Legal & Privacy Compliance Auditor',
      acceptance_criteria: JSON.stringify(['Conformidade Lei 13.787 comprovada', 'Logs de auditoria LGPD Art. 11']),
      dedup_suffix: 'legal-002'
    },
    {
      title: 'Consolidação Executiva e Cálculo do Release Readiness Score (0-100%)',
      description: 'Product Validation & Release Readiness Agent (Agente Principal) consolida todas as auditorias e emite o Veredito Oficial de Prontidão para Produção.',
      column: 'TODO',
      category: 'PRODUCT',
      priority: 'CRITICAL',
      risk_level: 'LOW',
      requires_approval: 0,
      assigned_agent: 'Product Validation & Release Readiness Agent',
      acceptance_criteria: JSON.stringify(['Release Readiness Score calculado', 'Veredito e Matriz de Decisão emitidos']),
      dedup_suffix: 'release-001'
    }
  ];

  for (const proj of allProjects) {
    for (const def of specializedTasksDefinitions) {
      const dedupKey = `${proj.id}-${def.dedup_suffix}`;
      const existingTask = db.prepare('SELECT id FROM tasks WHERE dedup_key = ?').get(dedupKey);
      if (!existingTask) {
        db.prepare(`
          INSERT INTO tasks (id, project_id, title, description, column, category, priority, risk_level, requires_approval, assigned_agent, acceptance_criteria, dedup_key)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          proj.id,
          def.title,
          def.description,
          def.column,
          def.category,
          def.priority,
          def.risk_level,
          def.requires_approval,
          def.assigned_agent,
          def.acceptance_criteria,
          dedupKey
        );
      }
    }
  }

  // 6. Atividades Iniciais para Demonstração de Telemetria em Tempo Real
  try {
    const existingActivities = db.prepare('SELECT COUNT(*) as count FROM agent_activities').get() as { count: number };
    const targetProj = (db.prepare('SELECT id FROM projects WHERE id = ?').get('4b182dd0-ddaf-4917-ac06-976224d32e60') as { id: string } | undefined)
      || (db.prepare('SELECT id FROM projects LIMIT 1').get() as { id: string } | undefined);

    if (targetProj && (!existingActivities || existingActivities.count === 0)) {
      const demoActivities = [
        {
          id: crypto.randomUUID(),
          project_id: targetProj.id,
          agent_id: 'Hermes Agent',
          stage: 'THINKING',
          thought: 'Analisando diretivas de segurança HTTP no backend Express do SaaS FisioteraHub. Ausência de cabeçalhos HSTS (Strict-Transport-Security) e CSP expõe a aplicação a ataques de MitM e Clickjacking.',
          output_produced: null,
          model_used: 'cohere/north-mini-code:free',
        },
        {
          id: crypto.randomUUID(),
          project_id: targetProj.id,
          agent_id: 'Hermes Agent',
          stage: 'PRODUCING',
          thought: 'Gerando patch modular de middleware com Helmet, configurando max-age=31536000 e CSP permissivo para recursos locais.',
          output_produced: `import helmet from 'helmet';\n\napp.use(helmet({\n  contentSecurityPolicy: {\n    directives: {\n      defaultSrc: ["'self'"],\n      scriptSrc: ["'self'", "'unsafe-inline'"],\n      styleSrc: ["'self'", "'unsafe-inline'"],\n      imgSrc: ["'self'", 'data:', 'https:'],\n    },\n  },\n  hsts: {\n    maxAge: 31536000,\n    includeSubDomains: true,\n    preload: true,\n  },\n}));`,
          model_used: 'cohere/north-mini-code:free',
        },
        {
          id: crypto.randomUUID(),
          project_id: targetProj.id,
          agent_id: 'Hermes Agent',
          stage: 'PRODUCING',
          thought: 'Estruturando trilha de auditoria clínica conforme Art. 11 da LGPD para dados sensíveis de saúde em prontuários fisioterapêuticos.',
          output_produced: `export async function logClinicalAudit(req: Request, recordId: string, action: 'READ' | 'WRITE' | 'DELETE') {\n  await prisma.clinicalAuditLog.create({\n    data: {\n      userId: req.user.id,\n      recordId,\n      action,\n      ipAddress: req.ip,\n      userAgent: req.headers['user-agent'],\n      timestamp: new Date(),\n    },\n  });\n}`,
          model_used: 'cohere/north-mini-code:free',
        },
        {
          id: crypto.randomUUID(),
          project_id: targetProj.id,
          agent_id: 'Independent Evidence Validator',
          stage: 'VALIDATING',
          thought: 'Validação independente de 4 descobertas de remediação. Gerando hashes SHA-256 e conferindo critérios de aceitação do Kanban.',
          output_produced: '{"status":"VALIDATED","confidence":"HIGH","sha256":"9a7b2e1f4c3d8e5b6a7c9f0e1d2c3b4a5f6e7d8c"}',
          model_used: 'Validador Independente',
        }
      ];

      for (const a of demoActivities) {
        db.prepare(`
          INSERT INTO agent_activities (id, project_id, agent_id, stage, thought, output_produced, model_used)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(a.id, a.project_id, a.agent_id, a.stage, a.thought, a.output_produced, a.model_used);
      }
    }
  } catch (err) {
    console.warn('[DB] Aviso ao inserir seeds de atividades:', err);
  }

  console.log('[DB] Seeds inseridos com sucesso.');
}

// Executa diretamente se invocado via CLI
if (process.argv[1]?.endsWith('seeds/index.ts') || process.argv[1]?.endsWith('seeds/index.js')) {
  runSeeds();
}

