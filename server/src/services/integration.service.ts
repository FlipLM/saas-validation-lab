import { queryAll, queryOne, execute } from '../db/index.js';
import { Integration, IntegrationStatus } from '../types/index.js';
import { PentAGIAdapter } from '../integrations/pentagi/pentagi-adapter.js';
import { TelegramAdapter } from '../integrations/telegram/telegram-adapter.js';
import crypto from 'node:crypto';

export class IntegrationService {
  private static maskSecret(val: string): string {
    if (!val || val === 'NOT_SET') return 'NOT_SET';
    if (val.length <= 8) return '********';
    return `${val.substring(0, 4)}****${val.substring(val.length - 4)}`;
  }

  static listIntegrations() {
    const integrations = queryAll<Integration>('SELECT * FROM integrations ORDER BY id');
    
    return integrations.map(item => {
      let config = {};
      try {
        config = JSON.parse(item.config_masked);
      } catch {
        config = {};
      }

      // Adiciona metadados operacionais e documentação
      let metadata = {
        purpose: '',
        documentation_url: '',
        requirements: '',
        external_cost: 'Nenhum custo adicional conhecido (código aberto)',
      };

      if (item.id === 'pentagi') {
        metadata = {
          purpose: 'Plataforma autônoma de segurança ofensiva autorizada e testes de vulnerabilidade.',
          documentation_url: 'https://github.com/vxcontrol/pentagi',
          requirements: 'Docker Desktop ativo, ~2GB RAM, porta 8080.',
          external_cost: 'Gratuito e de código aberto (self-hosted).',
        };
      } else if (item.id === 'telegram') {
        metadata = {
          purpose: 'Envio de notificações críticas, relatórios de auditoria e alertas de aprovação.',
          documentation_url: 'https://core.telegram.org/bots/api',
          requirements: 'Bot Token criado via @BotFather e Chat ID válido.',
          external_cost: 'Gratuito via Telegram Bot API.',
        };
      }

      return {
        ...item,
        config,
        metadata,
      };
    });
  }

  static updateConfig(id: string, newConfig: Record<string, any>) {
    const existing = queryOne<Integration>('SELECT * FROM integrations WHERE id = ?', [id]);
    if (!existing) {
      throw new Error('Integração não encontrada');
    }

    // Mascara campos sensíveis antes de persistir
    const masked: Record<string, any> = { ...newConfig };
    if (masked.api_key && masked.api_key !== 'NOT_SET') {
      masked.api_key = this.maskSecret(masked.api_key);
    }
    if (masked.bot_token && masked.bot_token !== 'NOT_SET') {
      masked.bot_token = this.maskSecret(masked.bot_token);
    }

    const status: IntegrationStatus = 'CONFIGURED';
    execute(`
      UPDATE integrations 
      SET config_masked = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [JSON.stringify(masked), status, id]);

    return this.listIntegrations().find(i => i.id === id);
  }

  static async testIntegration(id: string) {
    const existing = queryOne<Integration>('SELECT * FROM integrations WHERE id = ?', [id]);
    if (!existing) {
      throw new Error('Integração não encontrada');
    }

    // Registra status intermediário TESTING
    execute(`UPDATE integrations SET status = 'TESTING' WHERE id = ?`, [id]);

    let testResult: { status: IntegrationStatus; error?: string; responseTimeMs?: number } = {
      status: 'FAILED',
    };

    if (id === 'pentagi') {
      const apiUrl = process.env.PENTAGI_API_URL || 'http://localhost:8080';
      const apiKey = process.env.PENTAGI_API_KEY || '';
      const adapter = new PentAGIAdapter(apiUrl, apiKey);
      const res = await adapter.testConnection();
      testResult = {
        status: res.status,
        error: res.error,
        responseTimeMs: res.responseTimeMs,
      };
    } else if (id === 'telegram') {
      const token = process.env.TELEGRAM_BOT_TOKEN || '';
      const chatId = process.env.TELEGRAM_CHAT_ID || '';
      const adapter = new TelegramAdapter(token, chatId);
      const res = await adapter.testConnection();
      testResult = {
        status: res.status,
        error: res.error,
        responseTimeMs: res.responseTimeMs,
      };
    }

    // Persiste resultado oficial
    execute(`
      UPDATE integrations 
      SET status = ?, last_test_at = CURRENT_TIMESTAMP, last_error = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [testResult.status, testResult.error || null, id]);

    // Registra no histórico de testes
    execute(`
      INSERT INTO integration_test_runs (id, integration_id, status, response_time_ms, error_message)
      VALUES (?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      id,
      testResult.status,
      testResult.responseTimeMs || 0,
      testResult.error || null,
    ]);

    return this.listIntegrations().find(i => i.id === id);
  }

  static disableIntegration(id: string) {
    execute(`UPDATE integrations SET status = 'DISABLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    return this.listIntegrations().find(i => i.id === id);
  }
}
