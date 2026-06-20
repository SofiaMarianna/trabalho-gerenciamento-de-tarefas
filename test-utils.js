// ============================================
// UTILITÁRIOS COMPARTILHADOS PARA TESTES
// Gerenciador de Tarefas
// ============================================

const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js/dist/sql-wasm.js");

// ============================================
// CLASSE SQLiteLocalStorage
// ============================================

class SQLiteLocalStorage {
  constructor(Database) {
    this.db = new Database();
    this.db.run(`
            CREATE TABLE IF NOT EXISTS storage (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);
  }

  getItem(key) {
    const statement = this.db.prepare(
      "SELECT value FROM storage WHERE key = ?",
    );
    statement.bind([key]);

    if (!statement.step()) {
      statement.free();
      return null;
    }

    const row = statement.getAsObject();
    statement.free();
    return row.value;
  }

  setItem(key, value) {
    this.db.run("INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?)", [
      key,
      value.toString(),
    ]);
  }

  removeItem(key) {
    this.db.run("DELETE FROM storage WHERE key = ?", [key]);
  }

  clear() {
    this.db.run("DELETE FROM storage");
  }

  key(index) {
    const statement = this.db.prepare(
      "SELECT key FROM storage ORDER BY key LIMIT 1 OFFSET ?",
      [index],
    );
    statement.bind([index]);

    if (!statement.step()) {
      statement.free();
      return null;
    }

    const row = statement.getAsObject();
    statement.free();
    return row.key;
  }

  get length() {
    const result = this.db.exec("SELECT COUNT(*) AS total FROM storage");
    return result.length > 0 ? result[0].values[0][0] : 0;
  }
}

// ============================================
// FUNÇÃO usarLocalStorageSQLite
// ============================================

let sqliteLocalStoragePromise;

async function usarLocalStorageSQLite() {
  if (!sqliteLocalStoragePromise) {
    sqliteLocalStoragePromise = initSqlJs().then(
      (SQL) => new SQLiteLocalStorage(SQL.Database),
    );
  }

  const storage = await sqliteLocalStoragePromise;
  storage.clear();

  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });

  return storage;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  SQLiteLocalStorage,
  usarLocalStorageSQLite,
};
