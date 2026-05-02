import type { ConversionRecentItem } from "@MediaConvertor/conversion";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("mediaconvertor.db");

function ensureTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS recent_conversions (
      id TEXT PRIMARY KEY NOT NULL,
      input_name TEXT NOT NULL,
      output_name TEXT NOT NULL,
      output_format TEXT NOT NULL,
      quality TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function readRecentItems(limit = 10): ConversionRecentItem[] {
  ensureTable();
  const rows = db.getAllSync<{
    id: string;
    input_name: string;
    output_name: string;
    output_format: ConversionRecentItem["outputFormat"];
    quality: ConversionRecentItem["quality"];
    size_bytes: number;
    created_at: string;
  }>(
    `SELECT id, input_name, output_name, output_format, quality, size_bytes, created_at
     FROM recent_conversions
     ORDER BY datetime(created_at) DESC
     LIMIT ?;`,
    [limit],
  );

  return rows.map((row: {
    id: string;
    input_name: string;
    output_name: string;
    output_format: ConversionRecentItem["outputFormat"];
    quality: ConversionRecentItem["quality"];
    size_bytes: number;
    created_at: string;
  }) => ({
    id: row.id,
    inputName: row.input_name,
    outputName: row.output_name,
    outputFormat: row.output_format,
    quality: row.quality,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  }));
}

export function saveRecentItem(item: ConversionRecentItem) {
  ensureTable();

  db.runSync(
    `INSERT OR REPLACE INTO recent_conversions
      (id, input_name, output_name, output_format, quality, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      item.id,
      item.inputName,
      item.outputName,
      item.outputFormat,
      item.quality,
      item.sizeBytes,
      item.createdAt,
    ],
  );

  db.runSync(
    `DELETE FROM recent_conversions
     WHERE id NOT IN (
       SELECT id FROM recent_conversions ORDER BY datetime(created_at) DESC LIMIT 10
     );`,
  );
}
