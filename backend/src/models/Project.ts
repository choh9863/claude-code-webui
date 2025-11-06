import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../../../shared/types';

export class ProjectModel {
  static create(name: string, directoryPath: string, description?: string): Project {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO projects (id, name, description, directory_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, name, description || null, directoryPath, now, now);

    return {
      id,
      name,
      description: description || null,
      directoryPath,
      createdAt: now,
      updatedAt: now,
    };
  }

  static findById(id: string): Project | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, description, directory_path as directoryPath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects WHERE id = ?
    `);

    const row = stmt.get(id) as Project | undefined;
    return row || null;
  }

  static findAll(): Project[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, description, directory_path as directoryPath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects
      ORDER BY updated_at DESC
    `);

    return stmt.all() as Project[];
  }

  static update(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'directoryPath'>>): boolean {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.directoryPath !== undefined) {
      fields.push('directory_path = ?');
      values.push(updates.directoryPath);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE projects SET ${fields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
