import { Router, Request, Response } from 'express';
import { OrchestratorControlService } from '../services/orchestrator-control.service.js';

export const orchestratorRouter = Router();

orchestratorRouter.get('/status', (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const status = OrchestratorControlService.getStatus(projectId as string);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

orchestratorRouter.post('/decision', async (req: Request, res: Response) => {
  try {
    const { action, projectId } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: 'O parâmetro "action" é obrigatório' });
    }

    const result = await OrchestratorControlService.executeDecision(action, projectId);
    const updatedStatus = OrchestratorControlService.getStatus(projectId);

    res.json({
      success: result.success,
      message: result.message,
      data: updatedStatus,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
