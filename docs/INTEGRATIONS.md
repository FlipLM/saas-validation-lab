# INTEGRATIONS — ADAPTADORES PENTAGI E TELEGRAM

O SaaS Validation Lab integra-se a serviços externos através de adaptadores isolados, com validação de saúde, estados padronizados e política rígida de **NÃO-SIMULAÇÃO** (uma integração só é `TESTED` se conectou e respondeu com sucesso).

---

## 1. Estados Canônicos de Integração

1. `NOT_CONFIGURED`: Credenciais ou URL não informadas.
2. `CONFIGURED`: Parâmetros preenchidos, porém teste de conexão ainda não efetuado.
3. `TESTING`: Teste de comunicação em andamento.
4. `TESTED`: Conexão real efetuada com sucesso e comprovada por handshake/ping.
5. `FAILED`: Conexão falhou (timeout, 401 Unauthorized, 404, etc.).
6. `BLOCKED`: Dependência de infraestrutura ausente (ex: daemon Docker inativo para PentAGI).
7. `DISABLED`: Integração desativada manualmente pelo operador.

---

## 2. Adaptador PentAGI (vxcontrol/pentagi)

### 2.1 Visão e Requisitos
- **Repositório de Referência**: `https://github.com/vxcontrol/pentagi`
- **Finalidade**: Execução de avaliações técnicas autorizadas de segurança ofensiva (reconhecimento de portas, varredura de vulnerabilidades conhecidas, geração de vetores de ataque em ambiente de teste).
- **Requisitos de Infraestrutura**:
  - Requer Docker / contêineres e recursos dedicados de memória/CPU.
  - Como o Docker daemon pode não estar em execução na máquina do operador, o adaptador inspeciona o endpoint local `http://localhost:8080` (ou URL configurada).
  - Se a URL não responder ou a porta estiver fechada, o sistema classifica a integração como `BLOCKED` ou `FAILED`, registrando a evidência técnica do erro.
  - **PROIBIÇÃO**: O sistema NUNCA simula um resultado do PentAGI dizendo que está ativo se o serviço não estiver respondendo.

### 2.2 Endpoints Inspecionados
- `GET /health` ou `GET /api/v1/status`: Verificação de prontidão.
- `POST /api/v1/scans`: Criação de varredura autorizada com escopo explícito.
- `GET /api/v1/scans/:id`: Consulta de progresso e coleta de descobertas.

---

## 3. Adaptador Telegram Bot API

### 3.1 Visão e Requisitos
- **Documentação Oficial**: `https://core.telegram.org/bots/api`
- **Variáveis de Ambiente**:
  - `TELEGRAM_BOT_TOKEN`: Token emitido pelo @BotFather.
  - `TELEGRAM_CHAT_ID`: ID numérico do chat/canal receptor.
  - `TELEGRAM_NOTIFICATIONS_ENABLED`: Chave mestre de ativação (`true` / `false`).

### 3.2 Segurança e Mascaramento
- O token NUNCA é retornado de forma aberta na API (`GET /api/integrations`). Ele é mascarado como `123456:********_xyz`.
- Logs estruturados sanitizam qualquer menção a tokens antes de gravar em disco ou exibir no console.

### 3.3 Capacidades
- **Notificações de Alerta**: Envio imediato para descobertas `CRITICAL` ou tarefas que entram em `WAITING_APPROVAL`.
- **Envio de Relatórios**: Envio de relatório executivo em Markdown (`report.md`) via chamada `POST /sendMessage` e documento anexo via `POST /sendDocument`.
