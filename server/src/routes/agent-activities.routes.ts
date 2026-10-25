import { Router, Request, Response } from 'express';
import { AgentActivityService } from '../services/agent-activity.service.js';

export const agentActivitiesRouter = Router();

// 1. Listagem paginada/filtrada das atividades dos agentes
agentActivitiesRouter.get('/activities', (req: Request, res: Response) => {
  try {
    const { projectId, agentId, stage, limit, since } = req.query;
    const activities = AgentActivityService.listActivities({
      projectId: projectId as string,
      agentId: agentId as string,
      stage: stage as string,
      limit: limit ? parseInt(limit as string, 10) : 60,
      since: since as string,
    });
    res.json({ success: true, data: activities });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Stream Server-Sent Events (SSE) em tempo real
agentActivitiesRouter.get('/stream', (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    AgentActivityService.subscribeSSE(res, projectId as string);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
