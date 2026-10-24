import { Router, Request, Response } from 'express';
import { ProjectService, createProjectSchema } from '../services/project.service.js';

export const projectsRouter = Router();

projectsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const projects = ProjectService.listProjects();
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

projectsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const project = ProjectService.getProjectById(String(req.params.id));
    if (!project) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

projectsRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: parsed.error.issues });
    }
    const created = ProjectService.createProject(parsed.data);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

projectsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = ProjectService.updateProject(String(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

projectsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = ProjectService.deleteProject(String(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }
    res.json({ success: true, message: 'Projeto excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
