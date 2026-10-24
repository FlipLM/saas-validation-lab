import { queryAll, queryOne, execute } from '../db/index.js';
import { ChecklistItem, ChecklistStatus } from '../types/index.js';

export class ChecklistService {
  static listAll() {
    const items = queryAll<ChecklistItem>('SELECT * FROM checklist_items ORDER BY category, title');
    
    // Agrupa por categoria
    const categoriesMap: Record<string, ChecklistItem[]> = {};
    let totalItems = 0;
    let completedItems = 0;

    for (const item of items) {
      totalItems++;
      if (item.status === 'COMPLETED') completedItems++;

      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = [];
      }
      categoriesMap[item.category].push(item);
    }

    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      overall_progress: overallProgress,
      total_items: totalItems,
      completed_items: completedItems,
      categories: categoriesMap,
      raw_items: items,
    };
  }

  static updateItem(id: string, updates: { status?: ChecklistStatus; evidence_text?: string; assigned_to?: string }) {
    const existing = queryOne<ChecklistItem>('SELECT * FROM checklist_items WHERE id = ?', [id]);
    if (!existing) {
      throw new Error('Item do checklist não encontrado');
    }

    // Regra Rígida: Estado COMPLETED exige evidência de conclusão documentada
    if (updates.status === 'COMPLETED') {
      const evidence = updates.evidence_text ?? existing.evidence_text;
      if (!evidence || evidence.trim().length < 10) {
        throw new Error('O estado COMPLETED exige evidência concreta de conclusão (mínimo de 10 caracteres explicativos).');
      }
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.evidence_text !== undefined) {
      fields.push('evidence_text = ?');
      params.push(updates.evidence_text);
    }
    if (updates.assigned_to !== undefined) {
      fields.push('assigned_to = ?');
      params.push(updates.assigned_to);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    execute(`UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?`, params);
    return queryOne<ChecklistItem>('SELECT * FROM checklist_items WHERE id = ?', [id]);
  }
}
