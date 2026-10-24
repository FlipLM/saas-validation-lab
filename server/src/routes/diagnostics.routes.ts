import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../db/index.js';
import os from 'node:os';

export const diagnosticsRouter = Router();

diagnosticsRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // 1. Teste real de consulta ao banco de dados SQLite WAL
    let dbStatus = 'HEALTHY';
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      queryOne('SELECT 1 as ping');
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'UNHEALTHY';
    }

    // 2. Status da fila e workers
    const activeJobs = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM execution_jobs WHERE status = 'RUNNING'")?.count || 0;
    const queuedJobs = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM execution_jobs WHERE status = 'QUEUED'")?.count || 0;
    const failedJobs = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM execution_jobs WHERE status = 'FAILED'")?.count || 0;

    // 3. Checagem do último heartbeat de worker
    const latestHeartbeat = queryOne<{ heartbeat_at: string }>(`
      SELECT heartbeat_at FROM execution_jobs 
      WHERE heartbeat_at IS NOT NULL 
      ORDER BY heartbeat_at DESC LIMIT 1
    `)?.heartbeat_at;

    let workerStatus = 'IDLE';
    if (activeJobs > 0) {
      workerStatus = 'ACTIVE';
    }

    // 4. Última execução com sucesso e última falha
    const lastSuccess = queryOne<{ id: string; finished_at: string; agent_id: string }>(`
      SELECT id, finished_at, agent_id FROM execution_jobs 
      WHERE status = 'SUCCEEDED' 
      ORDER BY finished_at DESC LIMIT 1
    `);

    const lastFailure = queryOne<{ id: string; finished_at: string; agent_id: string; error_message: string }>(`
      SELECT id, finished_at, agent_id, error_message FROM execution_jobs 
      WHERE status = 'FAILED' 
      ORDER BY finished_at DESC LIMIT 1
    `);

    // 5. Status das integrações persistidas no banco
    const integrations = queryAll<{ id: string; name: string; status: string; last_test_at: string }>(`
      SELECT id, name, status, last_test_at FROM integrations
    `);

    // 6. Métricas de recursos do host
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memoryUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const isSystemHealthy = dbStatus === 'HEALTHY' && memoryUsagePercent < 95;

    res.json({
      success: true,
      data: {
        status: isSystemHealthy ? 'ONLINE' : 'DEGRADED',
        uptime_seconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          driver: 'node:sqlite (WAL Mode)',
          latency_ms: dbLatencyMs,
        },
        worker: {
          status: workerStatus,
          active_jobs: activeJobs,
          queued_jobs: queuedJobs,
          failed_jobs: failedJobs,
          last_heartbeat: latestHeartbeat || 'Aguardando inicialização do worker daemon',
        },
        history: {
          last_success: lastSuccess || null,
          last_failure: lastFailure || null,
        },
        integrations,
        host_system: {
          platform: os.platform(),
          cpus: os.cpus().length,
          memory_usage_percent: memoryUsagePercent,
          node_version: process.version,
        },
        diagnostics_latency_ms: Date.now() - startTime,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
