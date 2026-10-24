import { Router, Request, Response } from 'express';
import { ChecklistService } from '../services/checklist.service.js';

export const checklistRouter = Router();

checklistRouter.get('/', (_req: Request, res: Response) => {
  try {
    const data = ChecklistService.listAll();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

checklistRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const updated = ChecklistService.updateItem(String(req.params.id), req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
