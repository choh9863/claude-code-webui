import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Message, MessageMetadata } from '../../../shared/types';

export class MessageModel {
  static create(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: MessageMetadata
  ): Message {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO messages (id, session_id, role, content, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    stmt.run(id, sessionId, role, content, metadataStr, now);

    return {
      id,
      sessionId,
      role,
      content,
      metadata: metadata || null,
      createdAt: now,
    };
  }

  static findById(id: string): Message | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, session_id as sessionId, role, content, metadata, created_at as createdAt
      FROM messages WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  static findBySessionId(sessionId: string, limit?: number, offset?: number): Message[] {
    const db = getDatabase();
    let query = `
      SELECT id, session_id as sessionId, role, content, metadata, created_at as createdAt
      FROM messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `;

    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
      if (offset !== undefined) {
        query += ` OFFSET ${offset}`;
      }
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  static update(id: string, content: string, metadata?: MessageMetadata): boolean {
    const db = getDatabase();
    const metadataStr = metadata ? JSON.stringify(metadata) : null;

    const stmt = db.prepare(`
      UPDATE messages SET content = ?, metadata = ? WHERE id = ?
    `);

    const result = stmt.run(content, metadataStr, id);
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deleteBySessionId(sessionId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM messages WHERE session_id = ?');
    const result = stmt.run(sessionId);
    return result.changes;
  }

  static count(sessionId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?');
    const row = stmt.get(sessionId) as { count: number };
    return row.count;
  }
}
