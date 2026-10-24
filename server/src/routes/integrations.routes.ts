import { Router, Request, Response } from 'express';
import { IntegrationService } from '../services/integration.service.js';

export const integrationsRouter = Router();

integrationsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const list = IntegrationService.listIntegrations();
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

integrationsRouter.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const result = await IntegrationService.testIntegration(String(req.params.id));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

integrationsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = IntegrationService.updateConfig(String(req.params.id), req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

integrationsRouter.post('/:id/disable', (req: Request, res: Response) => {
  try {
    const updated = IntegrationService.disableIntegration(String(req.params.id));
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
