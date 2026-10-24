export interface TelegramStatusResult {
  isAvailable: boolean;
  status: 'TESTED' | 'FAILED' | 'NOT_CONFIGURED';
  botUsername?: string;
  responseTimeMs?: number;
  error?: string;
}

export class TelegramAdapter {
  private botToken: string;
  private chatId: string;

  constructor(botToken = '', chatId = '') {
    this.botToken = botToken.trim();
    this.chatId = chatId.trim();
  }

  async testConnection(): Promise<TelegramStatusResult> {
    if (!this.botToken || this.botToken === 'NOT_SET') {
      return {
        isAvailable: false,
        status: 'NOT_CONFIGURED',
        error: 'TELEGRAM_BOT_TOKEN não informado ou inválido',
      };
    }

    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      const responseTimeMs = Date.now() - startTime;
      const data = (await response.json().catch(() => ({}))) as any;

      if (response.ok && data.ok) {
        return {
          isAvailable: true,
          status: 'TESTED',
          botUsername: data.result?.username,
          responseTimeMs,
        };
      } else {
        return {
          isAvailable: false,
          status: 'FAILED',
          responseTimeMs,
          error: data.description || `Falha de autenticação com o Telegram (HTTP ${response.status})`,
        };
      }
    } catch (err: any) {
      return {
        isAvailable: false,
        status: 'FAILED',
        error: `Erro de comunicação com a API do Telegram: ${err.message}`,
      };
    }
  }

  async sendMessage(text: string): Promise<{ success: boolean; messageId?: number; error?: string }> {
    if (!this.botToken || !this.chatId) {
      return { success: false, error: 'Telegram não configurado para envio de mensagens' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      const data = (await response.json().catch(() => ({}))) as any;
      if (response.ok && data.ok) {
        return { success: true, messageId: data.result?.message_id };
      } else {
        return { success: false, error: data.description || `Erro HTTP ${response.status}` };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
