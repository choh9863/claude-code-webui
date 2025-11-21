import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure the directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.initializeSchema();
  }

  private initializeSchema(): void {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}

let dbInstance: DatabaseManager | null = null;

export function initializeDatabase(dbPath: string): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager(dbPath);
  }
  return dbInstance;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance.getDatabase();
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
