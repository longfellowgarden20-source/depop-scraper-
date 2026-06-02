import Database from 'better-sqlite3'
import path from 'path'

// Points to the SQLite file the Python scraper writes to
const DB_PATH = path.resolve(process.cwd(), '../../data/listings.db')

let _db: ReturnType<typeof Database> | null = null

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true })
  }
  return _db
}
