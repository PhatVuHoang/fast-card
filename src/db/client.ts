// src/db/client.ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import * as schema from "./schema";

export let db: any;
export let expoDb: SQLiteDatabase | any;

export const setupDb = async () => {
  try {
    expoDb = await openDatabaseAsync("flashcards.db");
    db = drizzle(expoDb, { schema });

    await expoDb.execAsync("PRAGMA journal_mode = WAL;");
    await expoDb.execAsync("PRAGMA foreign_keys = ON;");

    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER
      );
    `);

    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER, 
        term TEXT NOT NULL, 
        definition TEXT NOT NULL,
        example TEXT,
        level INTEGER DEFAULT 0,
        next_review INTEGER,
        is_favorite INTEGER DEFAULT 0,
        FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
      );
    `);

    console.log("✅ Database & expoDb initialized");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
};
