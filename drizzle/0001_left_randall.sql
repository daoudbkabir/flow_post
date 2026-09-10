ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);