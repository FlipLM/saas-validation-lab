import { Router, Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';

export const reportsRouter = Router();

reportsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const reports = ReportService.listReports(projectId as string);
    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

reportsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const report = ReportService.getReportById(String(req.params.id));
    if (!report) {
      return res.status(404).json({ success: false, error: 'Relatório não encontrado' });
    }
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

reportsRouter.post('/generate', (req: Request, res: Response) => {
  try {
    const { projectId, title } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId é obrigatório' });
    }
    const report = ReportService.generateReport(projectId, title);
    res.status(201).json({ success: true, data: report });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

reportsRouter.get('/:id/download/:format', (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;
    const report = ReportService.getReportById(String(id));
    if (!report) {
      return res.status(404).json({ success: false, error: 'Relatório não encontrado' });
    }

    if (format === 'md') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="report_${id}.md"`);
      return res.send(report.raw_content_md);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="report_${id}.json"`);
      return res.json(report);
    } else {
      return res.status(400).json({ success: false, error: 'Formato suportado: md ou json' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
