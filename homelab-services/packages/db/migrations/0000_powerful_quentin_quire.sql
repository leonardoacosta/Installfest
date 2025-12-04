CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`agent_id` text NOT NULL,
	`status` text DEFAULT 'stopped' NOT NULL,
	`started_at` integer DEFAULT (strftime('%s', 'now')),
	`stopped_at` integer,
	`error_message` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`hook_type` text NOT NULL,
	`timestamp` integer DEFAULT (strftime('%s', 'now')),
	`tool_name` text,
	`tool_input` text,
	`tool_output` text,
	`duration_ms` integer,
	`success` integer,
	`error_message` text,
	`metadata` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_agent_id_unique` ON `sessions` (`agent_id`);--> statement-breakpoint
CREATE INDEX `idx_hooks_session` ON `hooks` (`session_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_hooks_type` ON `hooks` (`hook_type`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_hooks_tool` ON `hooks` (`tool_name`,`timestamp`);