# SECURITY — MODELO DE AMEAÇAS E DIRETRIZES DE SEGURANÇA

A segurança do próprio **SaaS Validation Lab** é o alicerce indispensável para que ele possa auditar outros sistemas de modo ético, autorizado e resiliente.

---

## 1. Princípios de Segurança Ativa

1. **Defesa Contra Prompt Injection**:
   - Dados provenientes de websites externos, formulários, repositórios auditados, tickets ou termos de uso são tratados como **dados não confiáveis (untrusted input)**.
   - Nenhuma instrução em linguagem natural contida no conteúdo auditado pode redefinir o escopo do projeto, elevar privilégios, burlar aprovações ou extrair credenciais.
   - A autorização é estritamente validada pelo código do backend em TypeScript e pelo banco de dados, e nunca delegada a prompts de IA.

2. **Isolamento de Escopo (Scope Boundaries)**:
   - Todo teste web, scan ou requisição verifica previamente se a URL de destino coincide estritamente com os domínios declarados no `target_url` do projeto.
   - Requisições fora de escopo são bloqueadas antes de serem disparadas pelo socket de rede (`SSRF Protection`).

3. **Proteção Contra SSRF (Server-Side Request Forgery)**:
   - Requisições realizadas pelos agentes não podem atingir redes internas locais da máquina servidora (`127.0.0.1`, `localhost`, `169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`), a menos que o projeto seja expressamente configurado no ambiente `development` com IP explicitamente liberado na lista branca do projeto.

4. **Mascaramento e Blindagem de Segredos**:
   - Chaves privadas, tokens de API e senhas nunca trafegam em texto puro para o cliente web.
   - O banco de dados utiliza colunas específicas para armazenamento de segredos ou variáveis de ambiente seguras.
   - Respostas da API (`GET /api/integrations`) utilizam regex de ofuscação (`val.replace(/.(?=.{4})/g, '*')`).

5. **Aprovações Obrigatórias para Ações de Alto Risco**:
   - Testes com injeção de payload invasivo, varreduras com mais de 50 req/s ou modificações em código exigem geração de registro na tabela `approvals` e bloqueio da tarefa até o clique de aprovação humana no painel.
