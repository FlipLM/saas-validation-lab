export interface PentAGIStatusResult {
  isAvailable: boolean;
  status: 'TESTED' | 'FAILED' | 'BLOCKED' | 'NOT_CONFIGURED';
  responseTimeMs?: number;
  error?: string;
  details?: any;
}

export class PentAGIAdapter {
  private apiUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(apiUrl = 'http://localhost:8080', apiKey = '', timeoutMs = 5000) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  async testConnection(): Promise<PentAGIStatusResult> {
    if (!this.apiUrl) {
      return {
        isAvailable: false,
        status: 'NOT_CONFIGURED',
        error: 'URL base da API PentAGI não configurada',
      };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Inspeciona endpoint de saúde canônico do PentAGI
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const responseTimeMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          isAvailable: true,
          status: 'TESTED',
          responseTimeMs,
          details: data,
        };
      } else {
        return {
          isAvailable: false,
          status: 'FAILED',
          responseTimeMs,
          error: `PentAGI respondeu com status HTTP ${response.status} (${response.statusText})`,
        };
      }
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      const isConnectionRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');

      return {
        isAvailable: false,
        status: isConnectionRefused ? 'BLOCKED' : 'FAILED',
        error: isTimeout 
          ? `Timeout (${this.timeoutMs}ms) aguardando resposta do PentAGI em ${this.apiUrl}`
          : isConnectionRefused
            ? `Serviço PentAGI inacessível em ${this.apiUrl}. Verifique se o daemon Docker e o container vxcontrol/pentagi estão em execução.`
            : `Erro ao conectar ao PentAGI: ${err.message}`,
      };
    }
  }
}
