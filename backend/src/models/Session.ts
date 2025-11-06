import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Session } from '../../../shared/types';

export class SessionModel {
  static create(
    projectId: string,
    name: string,
    autoSaveEnabled: boolean = true,
    contextCompressionEnabled: boolean = false
  ): Session {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sessions (id, project_id, name, auto_save_enabled, context_compression_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, projectId, name, autoSaveEnabled ? 1 : 0, contextCompressionEnabled ? 1 : 0, now, now);

    return {
      id,
      projectId,
      name,
      autoSaveEnabled,
      contextCompressionEnabled,
      createdAt: now,
      updatedAt: now,
    };
  }

  static findById(id: string): Session | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, project_id as projectId, name,
             auto_save_enabled as autoSaveEnabled,
             context_compression_enabled as contextCompressionEnabled,
             created_at as createdAt, updated_at as updatedAt
      FROM sessions WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      ...row,
      autoSaveEnabled: Boolean(row.autoSaveEnabled),
      contextCompressionEnabled: Boolean(row.contextCompressionEnabled),
    };
  }

  static findByProjectId(projectId: string): Session[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, project_id as projectId, name,
             auto_save_enabled as autoSaveEnabled,
             context_compression_enabled as contextCompressionEnabled,
             created_at as createdAt, updated_at as updatedAt
      FROM sessions
      WHERE project_id = ?
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all(projectId) as any[];
    return rows.map(row => ({
      ...row,
      autoSaveEnabled: Boolean(row.autoSaveEnabled),
      contextCompressionEnabled: Boolean(row.contextCompressionEnabled),
    }));
  }

  static findAll(): Session[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, project_id as projectId, name,
             auto_save_enabled as autoSaveEnabled,
             context_compression_enabled as contextCompressionEnabled,
             created_at as createdAt, updated_at as updatedAt
      FROM sessions
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      autoSaveEnabled: Boolean(row.autoSaveEnabled),
      contextCompressionEnabled: Boolean(row.contextCompressionEnabled),
    }));
  }

  static update(id: string, updates: Partial<Pick<Session, 'name' | 'autoSaveEnabled' | 'contextCompressionEnabled'>>): boolean {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.autoSaveEnabled !== undefined) {
      fields.push('auto_save_enabled = ?');
      values.push(updates.autoSaveEnabled ? 1 : 0);
    }
    if (updates.contextCompressionEnabled !== undefined) {
      fields.push('context_compression_enabled = ?');
      values.push(updates.contextCompressionEnabled ? 1 : 0);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE sessions SET ${fields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static touchUpdatedAt(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), id);
  }
}
