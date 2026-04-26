import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const decks = sqliteTable("decks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckId: integer("deck_id").references(() => decks.id, {
    onDelete: "cascade",
  }),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  example: text("example"),

  // Logic học tập (SRS)
  level: integer("level").default(0),
  nextReview: integer("next_review", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
});
