PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_id` integer,
	`term` text NOT NULL,
	`definition` text NOT NULL,
	`example` text,
	`level` integer DEFAULT 0,
	`next_review` integer,
	`is_favorite` integer DEFAULT false,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cards`("id", "deck_id", "term", "definition", "example", "level", "next_review", "is_favorite") SELECT "id", "deck_id", "term", "definition", "example", "level", "next_review", "is_favorite" FROM `cards`;--> statement-breakpoint
DROP TABLE `cards`;--> statement-breakpoint
ALTER TABLE `__new_cards` RENAME TO `cards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `decks` ADD `description` text;--> statement-breakpoint
ALTER TABLE `decks` ADD `created_at` integer;