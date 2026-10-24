import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = DashboardService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
