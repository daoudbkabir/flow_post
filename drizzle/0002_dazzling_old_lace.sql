CREATE TABLE `content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`status` enum('DRAFT','READY') NOT NULL DEFAULT 'DRAFT',
	`contentType` enum('TEXT','POST','SCRIPT') NOT NULL DEFAULT 'TEXT',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content` ADD CONSTRAINT `content_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_user_id_idx` ON `content` (`userId`);