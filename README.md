# SaaS Validation Lab
> Plataforma autônoma de auditoria, validação, segurança e evolução de SaaS.

---

## 1. Visão Geral do Sistema
O **SaaS Validation Lab** é uma solução completa, persistente, visual e extensível concebida para auditar produtos SaaS em múltiplas dimensões:
- **Descoberta de Produto & Mercado**: Hipóteses de negócio, personas, concorrentes e diferenciais.
- **Engenharia e Arquitetura**: Análise estática, qualidade de código, segurança de dependências e resiliência.
- **Qualidade, QA e Reconhecimento**: Testes funcionais, segurança de rotas, endpoints autorizados e usabilidade UX.
- **Pesquisa Jurídica & Privacidade**: Mapeamento de conformidade com fontes oficiais (LGPD - Lei 13.709/2018, Marco Civil da Internet, Lei 13.787/2018 para saúde).
- **Segurança Ofensiva Autorizada (PentAGI)**: Integração com adaptador nativo e checagem de infraestrutura.
- **Validação Independente de Evidências**: Camada crítica para evitar alucinações de LLM e falsos positivos; nenhuma descoberta vira vulnerabilidade confirmada sem evidência reproduzível e auditada.
- **Orquestração Autônoma & Workers**: Fila persistente no banco de dados, recuperação de travamentos, retries exponenciais e operação independente da sessão do Antigravity.
- **Centro de Comando Visual**: Dashboard executivo, Kanban interativo persistido, checklist de implantação auditável, central de integrações, relatórios e aprovações de risco.

---

## 2. Estrutura do Repositório
```text
/
├── docs/                        # Memória permanente técnica e jurídica
│   ├── README.md                # Índice da documentação
│   ├── 00_ARQUITETURA_GERAL.md  # Arquitetura física e lógica
│   ├── 01_MAPA_DO_REPOSITORIO.md# Localização de cada arquivo e módulo
│   ├── 02_STACK_TECNOLOGICA.md  # Justificativa técnica das escolhas
│   ├── ROADMAP.md               # Fases e critérios de aceite
│   ├── IMPLEMENTATION_STATUS.md # Matriz de status comprovado
│   ├── SECURITY.md              # Modelo de ameaças e proteções
│   ├── INTEGRATIONS.md          # Adaptadores Telegram, PentAGI e limites
│   ├── AGENTS.md                # Contratos dos 11 agentes especializados
│   ├── ORCHESTRATOR.md          # Fila, máquina de estados e resiliência
│   ├── DATABASE.md              # Modelo de dados e integridade
│   ├── API.md                   # Especificação dos endpoints REST
│   ├── DEPLOYMENT.md            # Guia de implantação e operação contínua
│   ├── OPERATIONS.md            # Rotinas de backup, restauração e runbook
│   ├── TESTING.md               # Estratégia de testes e cobertura
│   └── LEGAL_COMPLIANCE.md      # Fontes oficiais e conformidade
├── server/                      # Backend API & Serviços de Domínio
│   ├── src/
│   │   ├── db/                  # Conexão SQLite WAL, migrações e repositórios
│   │   ├── routes/              # Rotas da API REST protegidas
│   │   ├── services/            # Serviços de regras de negócio
│   │   ├── orchestrator/        # Motor do orquestrador e agendador
│   │   ├── worker/              # Worker autônomo de execução em background
│   │   ├── agents/              # 11 Agentes Especializados + Validador
│   │   ├── integrations/        # Adaptadores PentAGI e Telegram
│   │   ├── security/            # Políticas, RBAC, auditoria e sanitização
│   │   └── types/               # Contratos e tipos TypeScript universais
│   ├── tests/                   # Testes automatizados (Unitários e Integração)
│   ├── package.json
│   └── tsconfig.json
├── client/                      # Frontend SPA (React + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/          # Componentes visuais (Dashboard, Kanban, Modais)
│   │   ├── pages/               # Telas do sistema
│   │   ├── services/            # Clientes de API integrados com o backend
│   │   ├── types/               # Tipos TypeScript da interface
│   │   └── index.css            # Design tokens e variáveis de estilo
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/                        # Diretório persistente local (BD SQLite WAL, evidências)
├── .env.example                 # Modelo seguro de variáveis de ambiente
└── package.json                 # Orquestração do monorepo (scripts de dev/build/test/worker)
```

---

## 3. Como Executar o Sistema

### Implantação Rápida na VPS (Coolify sem domínio pago)
- Consulte o guia passo a passo dedicado: **[docs/COOLIFY.md](file:///g:/SaaS%20Validator/docs/COOLIFY.md)**.
- Permite subir o sistema em minutos usando subdomínio dinâmico gratuito (`sslip.io`) com HTTPS automático ou IP direto.

### Execução com Docker Compose
```bash
docker compose up -d --build
```
Acesse em `http://localhost:3000`.

### Execução Local (Ambiente de Desenvolvimento)
```bash
npm install
npm run dev:server   # API Backend na porta 3000/3001
npm run dev:client   # Frontend Vite na porta 5173
```

Para mais detalhes, consulte o [DEPLOYMENT.md](file:///g:/SaaS%20Validator/docs/DEPLOYMENT.md) e [OPERATIONS.md](file:///g:/SaaS%20Validator/docs/OPERATIONS.md).
