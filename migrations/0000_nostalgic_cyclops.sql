CREATE TABLE `users` (
	`name` text NOT NULL,
	`email` text NOT NULL,
	`credits` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);