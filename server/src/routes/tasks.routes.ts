import { Router, Request, Response } from 'express';
import { TaskService, createTaskSchema } from '../services/task.service.js';

export const tasksRouter = Router();

tasksRouter.get('/', (req: Request, res: Response) => {
  try {
    const { projectId, column, category, priority } = req.query;
    const tasks = TaskService.listTasks({
      projectId: projectId as string,
      column: column as string,
      category: category as string,
      priority: priority as string,
    });
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

tasksRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const task = TaskService.getTaskById(String(req.params.id));
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

tasksRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: parsed.error.issues });
    }
    const created = TaskService.createTask(parsed.data);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

tasksRouter.patch('/:id/move', (req: Request, res: Response) => {
  try {
    const { column, justification } = req.body;
    if (!column) {
      return res.status(400).json({ success: false, error: 'Coluna de destino é obrigatória' });
    }
    const updated = TaskService.moveTask(String(req.params.id), column, justification);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

tasksRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = TaskService.updateTask(String(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

tasksRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = TaskService.deleteTask(String(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    res.json({ success: true, message: 'Tarefa excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
