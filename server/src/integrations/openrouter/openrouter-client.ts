export interface OpenRouterStatusResult {
  isAvailable: boolean;
  status: 'TESTED' | 'FAILED' | 'NOT_CONFIGURED';
  responseTimeMs?: number;
  error?: string;
  freeRequestsRemaining?: number;
  modelsCount?: number;
}

export type LLMSpecialty = 'coding' | 'reasoning' | 'legal' | 'general';

export interface OpenRouterGenerateOptions {
  specialty?: LLMSpecialty;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenRouterGenerateResult {
  success: boolean;
  content: string;
  reasoning?: string;
  modelUsed?: string;
  escalatedToAntigravity: boolean;
  escalationReason?: string;
  error?: string;
}

export class OpenRouterAdapter {
  private apiKey: string;
  private siteUrl: string;
  private appTitle: string;

  constructor(apiKey = '', siteUrl = 'https://fisioterahub.com', appTitle = 'SaaS Validation Lab') {
    this.apiKey = apiKey.trim();
    this.siteUrl = siteUrl;
    this.appTitle = appTitle;
  }

  // Modelos gratuitos por especialidade
  private static modelHierarchy: Record<LLMSpecialty, string[]> = {
    coding: [
      'cohere/north-mini-code:free',
      'openrouter/free',
      'google/gemma-4-31b-it:free',
    ],
    reasoning: [
      'openrouter/free',
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      'google/gemma-4-31b-it:free',
      'thinkingmachines/inkling:free',
    ],
    legal: [
      'openrouter/free',
      'google/gemma-4-31b-it:free',
      'liquid/lfm-2.5-2.6b:free',
    ],
    general: [
      'openrouter/free',
      'google/gemma-4-26b-a4b-it:free',
      'liquid/lfm-2.5-2.6b:free',
    ],
  };

  async testConnection(): Promise<OpenRouterStatusResult> {
    if (!this.apiKey || this.apiKey === 'NOT_SET') {
      return {
        isAvailable: false,
        status: 'NOT_CONFIGURED',
        error: 'OPENROUTER_API_KEY não informada ou inválida',
      };
    }

    const startTime = Date.now();
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      const responseTimeMs = Date.now() - startTime;
      const data = (await response.json().catch(() => ({}))) as any;

      if (response.ok && data?.data) {
        const remaining = data.data.free_model_daily_requests?.remaining ?? 50;
        return {
          isAvailable: true,
          status: 'TESTED',
          responseTimeMs,
          freeRequestsRemaining: remaining,
        };
      } else {
        return {
          isAvailable: false,
          status: 'FAILED',
          responseTimeMs,
          error: data?.error?.message || `Falha de autenticação OpenRouter (HTTP ${response.status})`,
        };
      }
    } catch (err: any) {
      return {
        isAvailable: false,
        status: 'FAILED',
        error: `Erro de comunicação com a API do OpenRouter: ${err.message}`,
      };
    }
  }

  async generate(prompt: string, options: OpenRouterGenerateOptions = {}): Promise<OpenRouterGenerateResult> {
    if (!this.apiKey || this.apiKey === 'NOT_SET') {
      return {
        success: false,
        content: '',
        escalatedToAntigravity: true,
        escalationReason: 'Chave OPENROUTER_API_KEY não configurada. A tarefa foi repassada para o Antigravity.',
      };
    }

    const specialty = options.specialty || 'general';
    const candidateModels = OpenRouterAdapter.modelHierarchy[specialty] || ['openrouter/free'];

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    let lastError = '';

    // Tentativa em cascata nos modelos gratuitos
    for (const model of candidateModels) {
      try {
        console.log(`[OPENROUTER] Tentando geração com modelo "${model}" (Especialidade: ${specialty})...`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.appTitle,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages,
            max_tokens: options.maxTokens || 2048,
            temperature: options.temperature ?? 0.3,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as any;

        const choice = data?.choices?.[0];
        if (response.ok && (choice?.message?.content || choice?.message?.reasoning)) {
          const content = choice.message.content?.trim() || '';
          const reasoning = choice.message.reasoning?.trim() || (choice.message.reasoning_details ? JSON.stringify(choice.message.reasoning_details) : undefined);
          console.log(`[OPENROUTER] Sucesso com modelo "${model}". Tokens usados: ${data.usage?.total_tokens || 0}`);
          return {
            success: true,
            content,
            reasoning,
            modelUsed: model,
            escalatedToAntigravity: false,
          };
        } else {
          const errMsg = data?.error?.message || `HTTP ${response.status}`;
          console.warn(`[OPENROUTER] Modelo "${model}" falhou: ${errMsg}`);
          lastError = errMsg;
          // Se for 429 (Rate Limit) ou 404 (unavailable), continua para o próximo fallback
        }
      } catch (err: any) {
        console.warn(`[OPENROUTER] Erro de rede ao consultar "${model}":`, err.message);
        lastError = err.message;
      }
    }

    // Se todos os modelos gratuitos falharam ou esgotaram
    console.warn(`[OPENROUTER] Todos os modelos gratuitos falharam. Escalando tarefa para o Antigravity (IDE Local). Último erro: ${lastError}`);
    return {
      success: false,
      content: '',
      escalatedToAntigravity: true,
      escalationReason: `Esgotamento de tokens ou quota de modelos gratuitos no OpenRouter (${lastError}). Tarefa encaminhada ao Antigravity.`,
      error: lastError,
    };
  }
}
