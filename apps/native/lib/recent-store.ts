import type { RecentItem } from "@MediaConvertor/conversion";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("mediaconvertor.db");

function ensureTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS recent (
      id TEXT PRIMARY KEY,
      fileName TEXT,
      inputFormat TEXT,
      outputFormat TEXT,
      createdAt INTEGER,
      uri TEXT
    );
  `);
}

export function readRecentItems(limit = 10): RecentItem[] {
  ensureTable();
  const rows = db.getAllSync<RecentItem>(
    `SELECT id, fileName, inputFormat, outputFormat, createdAt, uri
     FROM recent
     ORDER BY createdAt DESC
     LIMIT ?;`,
    [limit],
  );

  return rows;
}

export function saveRecentItem(item: RecentItem) {
  ensureTable();

  db.runSync(
    `INSERT OR REPLACE INTO recent
      (id, fileName, inputFormat, outputFormat, createdAt, uri)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [item.id, item.fileName, item.inputFormat, item.outputFormat, item.createdAt, item.uri],
  );

  db.runSync(
    `DELETE FROM recent
     WHERE id IN (
       SELECT id FROM recent ORDER BY createdAt ASC LIMIT (
         SELECT CASE WHEN COUNT(*) > 10 THEN COUNT(*) - 10 ELSE 0 END FROM recent
       )
     );`,
  );
}

export function deleteRecentItem(id: string) {
  ensureTable();
  db.runSync(`DELETE FROM recent WHERE id = ?;`, [id]);
}
