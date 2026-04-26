import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

// Sử dụng alias thay vì "./schema"
import * as schema from "@db/schema";

export const expoDb = openDatabaseSync("flashcards.db", {
  enableChangeListener: true,
});

export const db = drizzle(expoDb, { schema });
