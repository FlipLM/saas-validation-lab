import { IAgent, AgentContext, AgentOutput } from '../types.js';

export class WebReconAgent implements IAgent {
  id = 'web-recon';
  name = 'Web Recon Agent';
  version = '1.0.0';
  description = 'Reconhecimento técnico e funcional de aplicações autorizadas no escopo.';

  async execute(ctx: AgentContext): Promise<AgentOutput> {
    const findings: AgentOutput['findings'] = [];
    const url = ctx.target_url;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'SaaS-Validation-Lab-Security-Scanner/1.0 (+authorized-audit)',
          'Accept': 'text/html,application/xhtml+xml,application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      const status = response.status;
      const headers = Object.fromEntries(response.headers.entries());
      const bodySample = (await response.text()).substring(0, 1500);

      // Verificação 1: Ausência de HSTS (Strict-Transport-Security)
      if (!headers['strict-transport-security'] && url.startsWith('https://')) {
        findings.push({
          title: 'Ausência do Cabeçalho Strict-Transport-Security (HSTS)',
          description: `O alvo respondeu com status HTTP ${status}, porém não inclui o cabeçalho HSTS, permitindo potenciais ataques de downgrade SSL/TLS ou Man-in-the-Middle.`,
          category: 'SECURITY',
          severity: 'MEDIUM',
          confidence: 'CONFIRMED',
          recommendation: 'Configure o cabeçalho: Strict-Transport-Security: max-age=31536000; includeSubDomains',
          evidence: {
            type: 'HTTP_REQUEST_RESPONSE',
            source_url: url,
            raw_content: `HTTP GET ${url}\nHTTP/${response.status}\nHeaders Observados:\n${JSON.stringify(headers, null, 2)}`,
          },
        });
      }

      // Verificação 2: Ausência de Content-Security-Policy (CSP)
      if (!headers['content-security-policy']) {
        findings.push({
          title: 'Ausência de Política de Segurança de Conteúdo (CSP)',
          description: 'Não foi identificado o cabeçalho Content-Security-Policy, aumentando o risco de exploração de Cross-Site Scripting (XSS) e injeção de scripts terceiros.',
          category: 'SECURITY',
          severity: 'LOW',
          confidence: 'CONFIRMED',
          recommendation: 'Implementar Content-Security-Policy restringindo fontes de script para "self" e domínios homologados.',
          evidence: {
            type: 'HTTP_REQUEST_RESPONSE',
            source_url: url,
            raw_content: `HTTP GET ${url}\nHTTP/${response.status}\nHeaders Observados:\n${JSON.stringify(headers, null, 2)}`,
          },
        });
      }

      // Verificação 3: Identificação de Tecnologias / Headers de Servidor
      const serverHeader = headers['server'] || headers['x-powered-by'];
      if (serverHeader) {
        findings.push({
          title: `Divulgação de Tecnologia no Cabeçalho HTTP (${serverHeader})`,
          description: `O servidor expõe sua tecnologia na resposta HTTP (${serverHeader}), facilitando o mapeamento de versões e potenciais exploits por atacantes.`,
          category: 'SECURITY',
          severity: 'INFO',
          confidence: 'CONFIRMED',
          recommendation: 'Remova ou ofusque os cabeçalhos "Server" e "X-Powered-By" no proxy reverso ou na configuração do servidor.',
          evidence: {
            type: 'HTTP_REQUEST_RESPONSE',
            source_url: url,
            raw_content: `Server: ${serverHeader}\nX-Powered-By: ${headers['x-powered-by'] || 'N/A'}`,
          },
        });
      }

      return {
        summary: `Reconhecimento web efetuado em ${url}. Status HTTP ${status}. ${findings.length} descobertas mapeadas com evidências rastreáveis.`,
        findings,
        metrics: {
          http_status: status,
          headers_count: Object.keys(headers).length,
          response_size_bytes: bodySample.length,
        },
        next_actions: [
          'Executar testes de endpoints específicos identificados na página inicial',
          'Auditar cookies de sessão para flags Secure e SameSite',
        ],
      };
    } catch (err: any) {
      return {
        summary: `Falha ao conectar no alvo autorizado ${url}: ${err.message}`,
        findings: [
          {
            title: `Falha de Conectividade com o Alvo (${url})`,
            description: `O Web Recon Agent não conseguiu estabelecer handshake HTTP com ${url}. Motivo: ${err.message}`,
            category: 'QA',
            severity: 'INFO',
            confidence: 'CONFIRMED',
            recommendation: 'Verifique se a aplicação está online e acessível a partir da estação do SaaS Validation Lab.',
            evidence: {
              type: 'LOG_OUTPUT',
              source_url: url,
              raw_content: `Error: ${err.message}\nStack: ${err.stack || ''}`,
            },
          },
        ],
        next_actions: ['Rever status do ambiente e verificar conectividade de rede'],
      };
    }
  }
}
