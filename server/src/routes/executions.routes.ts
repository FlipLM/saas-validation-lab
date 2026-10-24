import { Router, Request, Response } from 'express';
import { ExecutionService } from '../services/execution.service.js';

export const executionsRouter = Router();

executionsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { status, projectId, agentId } = req.query;
    const jobs = ExecutionService.listJobs({
      status: status as string,
      projectId: projectId as string,
      agentId: agentId as string,
    });
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

executionsRouter.get('/automation-status', (_req: Request, res: Response) => {
  try {
    const status = ExecutionService.getGlobalAutomationStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

executionsRouter.post('/trigger', (req: Request, res: Response) => {
  try {
    const { project_id, agent_id, task_id, payload } = req.body;
    if (!project_id || !agent_id) {
      return res.status(400).json({ success: false, error: 'project_id e agent_id são obrigatórios' });
    }
    const job = ExecutionService.triggerExecution({ project_id, agent_id, task_id, payload });
    res.status(201).json({ success: true, data: job });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

executionsRouter.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const job = ExecutionService.cancelJob(String(req.params.id), reason);
    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

executionsRouter.post('/toggle-pause', (req: Request, res: Response) => {
  try {
    const { pause } = req.body;
    const result = ExecutionService.setGlobalAutomationPause(Boolean(pause));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
