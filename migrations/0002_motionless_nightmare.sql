PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`credits` integer DEFAULT 5 NOT NULL,
	`convert_credits` integer DEFAULT 20 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "credits", "convert_credits") SELECT "id", "name", "email", "credits", "convert_credits" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);