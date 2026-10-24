# GUIA DE DEPLOY NO COOLIFY (SEM DOMÍNIO PAGO)

Este guia prático explica exatamente como implantar o **SaaS Validation Lab** na sua VPS utilizando o **Coolify**, sem precisar registrar ou pagar por nenhum domínio customizado.

---

## 1. Visão Geral: Como Funciona Sem Domínio Pago?

O Coolify oferece duas maneiras nativas e 100% gratuitas de acessar sua aplicação sem registrar um domínio:

| Método | Como Funciona | HTTPS / SSL Gratuito | URL de Exemplo |
| :--- | :--- | :---: | :--- |
| **Opção A: Magic Domain (sslip.io)** *(Recomendado)* | O Coolify gera um subdomínio wildcard dinâmico apontado para o IP da sua VPS. O Traefik emite certificado SSL Let's Encrypt automático. | **Sim (HTTPS Automático)** | `https://saas.<IP_DA_VPS>.sslip.io` |
| **Opção B: IP Direto + Porta** | A aplicação escuta diretamente na porta 3000 da sua VPS. | Não (HTTP) | `http://<IP_DA_VPS>:3000` |

---

## 2. Pré-Requisitos

1. Uma VPS com **Coolify v4** instalado e rodando.
2. O código do projeto hospedado em um repositório Git (GitHub, GitLab, Gitea ou Git privado) ou acesso SSH para colar o `docker-compose.yml`.
3. Firewall da VPS (UFW ou Security Group na nuvem):
   - Se usar **Opção A (Magic Domain)**: Portas `80` e `443` abertas (padrão do Coolify / Traefik).
   - Se usar **Opção B (IP Direto)**: Porta `3000` liberada no firewall (`sudo ufw allow 3000/tcp`).

---

## 3. Passo a Passo de Implantação no Coolify

### Passo 1: Criar uma Nova Aplicação no Coolify
1. Acesse o painel web do seu Coolify (ex: `http://<IP_DA_VPS>:8000`).
2. Vá em **Projects** e selecione (ou crie) um projeto.
3. Clique em **+ New Resource** e selecione **Public Repository** (ou **Private Repository** se tiver configurado chave SSH no GitHub).
4. Insira a URL do seu repositório Git (ex: `https://github.com/seu-usuario/saas-validation-lab`).
5. Defina a branch como `main` (ou a branch onde está o código).

---

### Passo 2: Escolher o Método de Build
O Coolify detectará automaticamente os arquivos do projeto. Você tem duas opções equivalentes:

#### Alternativa 1: Via Dockerfile (Mais Simples)
- **Build Pack**: Selecione `Dockerfile`.
- O Coolify usará o [Dockerfile](file:///g:/SaaS%20Validator/Dockerfile) multi-stage na raiz do projeto.
- **Port**: Defina como `3000`.

#### Alternativa 2: Via Docker Compose
- **Build Pack**: Selecione `Docker Compose`.
- O Coolify lerá o [docker-compose.yml](file:///g:/SaaS%20Validator/docker-compose.yml) da raiz com o volume e portas pré-configurados.

---

### Passo 3: Configurar o Domínio Gratuito (Magic Domain)

No menu da sua aplicação dentro do Coolify:

1. Na seção **Domains**:
   - Clique no botão **Generate Domain** (ou digite manualmente: `https://saas.<SEU_IP_VPS>.sslip.io`).
   - *Exemplo*: Se o IP da sua VPS for `195.201.123.45`, preencha:
     ```text
     https://saas.195.201.123.45.sslip.io
     ```
   - O `sslip.io` é um DNS público gratuito que resolve instantaneamente qualquer nome contendo um IP de volta para aquele IP.
   - O Traefik do Coolify emitirá automaticamente um certificado SSL Let's Encrypt válido para essa URL!

> **Se preferir usar apenas IP e Porta direta (sem Traefik/Magic Domain):**
> Deixe o campo *Domains* vazio e no campo **Ports Exposes**, digite `3000:3000`.

---

### Passo 4: Garantir a Persistência do Banco SQLite (Crítico!)

Para que os relatórios, evidências, auditorias e tarefas nunca sejam perdidos quando o contêiner for atualizado ou reiniciado:

1. No menu lateral do aplicativo no Coolify, clique na aba **Storages** (Armazenamento).
2. Adicione um novo volume persistente:
   - **Volume Name**: `saas_validator_data` (ou deixe o nome sugerido)
   - **Destination Path**: `/app/data`
3. Clique em **Save**.
4. *(Se usou Docker Compose no Passo 2, o volume `saas_data:/app/data` já é criado e montado automaticamente)*.

---

### Passo 5: Configurar as Variáveis de Ambiente

Na aba **Environment Variables** do Coolify, adicione as variáveis mínimas recomendadas:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=/app/data/saas_validator.db
JWT_SECRET=gere_uma_chave_secreta_com_mais_de_32_caracteres_aleatorios
WORKER_CONCURRENCY=2
WORKER_POLL_INTERVAL_MS=3000
ORCHESTRATOR_ENABLED=true
ORCHESTRATOR_INTERVAL_MS=10000
GLOBAL_AUTOMATION_PAUSED=false
```

*(Opcional: Se desejar alertas no Telegram, adicione `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` e `TELEGRAM_NOTIFICATIONS_ENABLED=true`).*

---

### Passo 6: Executar o Deploy

1. Clique no botão **Deploy** no canto superior direito do Coolify.
2. Acompanhe os logs de construção em tempo real:
   - Compilação dos assets do frontend React Vite (`client/dist`).
   - Compilação dos tipos TypeScript do backend (`server/dist`).
   - Criação da imagem Alpine enxuta com Healthcheck.
   - Execução automática de migrações e seeds do SQLite.
3. Ao finalizar, o status mudará para **Running (Healthy)**.
4. Clique no link gerado (`https://saas.<IP_VPS>.sslip.io`) ou acesse `http://<IP_VPS>:3000`.

---

## 4. O Que Fazer Após Subir?

1. **Acessar o Painel**: O frontend SPA React abrirá imediatamente com os projetos e tarefas carregadas.
2. **Criar um Projeto Real**: Cadastre o domínio do seu SaaS ou aplicação de teste para iniciar o checklist de 18 categorias e 92 verificações.
3. **Aprovar Execuções**: Se uma tarefa exigir aprovação manual (como testes de injeção ou verificações ativas), aprove pela tela de *Aprovações*.
4. **Automação Contínua**: O orquestrador e os workers continuam rodando 24/7 na sua VPS, mesmo que você feche seu navegador ou computador local.

---

## 5. Manutenção e Backups na VPS

### Localização dos Dados na VPS
O banco de dados SQLite WAL e os relatórios ficam salvos no volume Docker da VPS, tipicamente em:
```bash
/var/lib/docker/volumes/<id-do-volume-no-coolify>/_data/saas_validator.db
```

### Criar um Backup Quente Manual via Terminal na VPS:
Você pode executar um snapshot ACID consistente sem parar a aplicação executando:
```bash
docker exec -it saas-validation-lab npm run db:backup
```
Os backups gerados ficam salvos na pasta `/app/data/backups/`.

---

## 6. Dúvidas Frequentes (FAQ)

### 1. Posso usar um domínio registrado próprio no futuro?
Sim! Se futuramente você comprar um domínio (ex: `auditoria.suaempresa.com`), basta ir na aba **Domains** no Coolify, substituir o `sslip.io` pelo seu domínio e apontar o DNS tipo `A` para o IP da sua VPS. O Coolify reconfigurará o SSL automaticamente sem downtime.

### 2. O contêiner consome muita memória?
Não. A imagem final roda em Node.js 22 Alpine, consumindo em média apenas **120 MB a 250 MB de RAM**, sendo perfeitamente adequada para as VPS mais básicas (1 vCPU, 1 GB ou 2 GB de RAM).
