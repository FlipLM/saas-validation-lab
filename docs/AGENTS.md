# AGENTS — CATÁLOGO E CONTRATOS DOS AGENTES ESPECIALIZADOS

Todos os agentes no **SaaS Validation Lab** operam sob contratos padronizados:
- **Entrada (Input)**: Contexto do projeto, escopo autorizado, metadados e restrições.
- **Ferramentas Autorizadas (Allowed Tools)**: Acesso estritamente limitado ao necessário. Nenhum agente possui permissão irrestrita.
- **Saídas Estruturadas (Output)**: Descobertas com categorização, confiança, severidade e evidências rastreáveis com hash SHA-256.
- **Validação Compulsória**: Toda descoberta passa obrigatoriamente pela avaliação do `Independent Evidence Validator`.

---

## Os 11 Agentes do Sistema

### 1. `Product Discovery Agent`
- **Objetivo**: Compreender a proposta de valor, público-alvo, personas, funcionalidades centrais e levantar hipóteses não validadas.
- **Entradas**: Dados cadastrais do projeto, documentação pública, landing page autorizada.
- **Ferramentas**: Leitura de páginas públicas no escopo, analisador de fluxo de valor.
- **Saídas**: Relatório de personas, funcionalidades mapeadas, hipóteses de negócio e lacunas de informação.

### 2. `Competitive Intelligence Agent`
- **Objetivo**: Mapear alternativas de mercado, precificação pública, diferenciais e avaliações de usuários.
- **Entradas**: Segmento de mercado, concorrentes declarados ou identificados.
- **Ferramentas**: Leitura de websites públicos de concorrentes (sem scraping invasivo).
- **Saídas**: Matriz comparativa de funcionalidades, faixas de preço documentadas com data/URL e oportunidades de diferenciação.
- **Regra**: Nunca inventar preços ou métricas sem citação de fonte.

### 3. `Web Recon Agent`
- **Objetivo**: Mapear rotas, formulários, componentes expostos e tecnologias observáveis da aplicação sob teste.
- **Entradas**: URL alvo, lista de subdomínios autorizados, rate limit.
- **Ferramentas**: Cliente HTTP com cabeçalhos padronizados, analisador de headers, analisador de cookies.
- **Saídas**: Inventário de rotas públicas, tecnologias detectadas (Wappalyzer signatures), formulários e cabeçalhos de segurança ausentes (HSTS, CSP, X-Frame-Options).

### 4. `Market & Growth Agent`
- **Objetivo**: Analisar estratégias de aquisição, SEO on-page básico, conversão de funil e retenção.
- **Entradas**: Páginas públicas, metatags, estrutura semântica HTML.
- **Ferramentas**: Analisador de metadados OpenGraph/Twitter, auditor de semântica e hierarquia H1/H2.
- **Saídas**: Oportunidades de crescimento e métricas a serem instrumentadas.

### 5. `Code & Architecture Auditor`
- **Objetivo**: Analisar organização, acoplamento, tratamento de erros, segurança de dependências e dívida técnica.
- **Entradas**: Caminho do repositório autorizado ou arquivos de código fornecidos.
- **Ferramentas**: Analisador estático, parser de dependências (package.json/npm audit/requirements.txt).
- **Saídas**: Relatório de dívida técnica, vulnerabilidades de dependências (CVEs conhecidas) e recomendações de refatoração com arquivos e linhas apontados.

### 6. `QA, Security & Reliability Agent`
- **Objetivo**: Testar validações de entrada, tratamento de exceções, rotas protegidas e vazamento de informações.
- **Entradas**: Rotas do Web Recon, endpoints declarados.
- **Ferramentas**: Testador de requisições malformadas, verificador de respostas HTTP 4xx/5xx, detector de stack traces expostos.
- **Saídas**: Descobertas de segurança classificadas (separando falhas reproduzidas de hipóteses teóricas).

### 7. `UX Recon Agent`
- **Objetivo**: Avaliar consistência visual, hierarquia de navegação, responsividade, formulários e acessibilidade WCAG.
- **Entradas**: URLs do sistema alvo.
- **Ferramentas**: Analisador semântico de formulários, auditor de contraste e tags ARIA básicas.
- **Saídas**: Barreiras de usabilidade, feedbacks ausentes em formulários e inconsistências de layout.

### 8. `Product Validation & Release Readiness Agent`
- **Objetivo**: Determinar se o produto ou versão está pronto para avanço/release.
- **Entradas**: Consolidação de todos os testes, tarefas concluídas, descobertas abertas e checklist de implantação.
- **Ferramentas**: Consolidor de métricas e matriz de bloqueios.
- **Saídas**: Veredito fundamentado (`APPROVED`, `APPROVED_WITH_RESERVATIONS`, `BLOCKED`) com limitações explícitas de escopo.

### 9. `Legal Research Analyst`
- **Objetivo**: Identificar legislação aplicável com base em fontes oficiais (Planalto, ANPD).
- **Entradas**: Tipo de dados tratados pelo SaaS (dados cadastrais, cookies, dados financeiros, dados de saúde).
- **Fontes Oficiais**: LGPD (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014), Lei 13.787/2018 (apenas se houver prontuários eletrônicos de pacientes).
- **Saídas**: Lista rastreável de obrigações normativas, links com data de acesso e indicação de pontos que demandam parecer advocatício.

### 10. `Legal & Privacy Compliance Auditor`
- **Objetivo**: Avaliar tecnicamente se os controles de privacidade estão implementados.
- **Entradas**: Políticas de privacidade públicas, formulários de coleta, cookies de rastreamento e termos de uso.
- **Ferramentas**: Analisador de termos e inventário de dados coletados no formulário.
- **Saídas**: Matriz de conformidade técnica preliminar e lacunas identificadas.

### 11. `Independent Evidence Validator` (Mandatório)
- **Papel Crítico**: Atua como barreira independente. Não produz descobertas primárias, apenas audita as evidências submetidas pelos demais 10 agentes.
- **Regras de Validação**:
  1. A evidência possui origem rastreável (URL, linha de código, payload HTTP)?
  2. O resultado é reproduzível de forma determinística?
  3. Há contradição entre a observação crua e a conclusão do agente?
  4. A severidade atribuída condiz com o impacto real?
- **Decisão**:
  - `VALIDATED`: Evidência sólida e suficiente.
  - `REJECTED`: Hipótese sem sustentação, inferência exagerada ou falso positivo.
  - `NEEDS_ADDITIONAL_VERIFICATION`: Evidência incompleta, devolve para reteste.
