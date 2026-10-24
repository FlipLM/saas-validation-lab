import { Router, Request, Response } from 'express';
import { ApprovalService } from '../services/approval.service.js';

export const approvalsRouter = Router();

approvalsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const list = ApprovalService.listApprovals(status as any);
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

approvalsRouter.post('/:id/decide', (req: Request, res: Response) => {
  try {
    const { decision, decided_by, notes } = req.body;
    if (!['APPROVED', 'REJECTED', 'POSTPONED'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decisão inválida. Valores aceitos: APPROVED, REJECTED, POSTPONED' });
    }
    const result = ApprovalService.decide(String(req.params.id), decision, decided_by, notes);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
