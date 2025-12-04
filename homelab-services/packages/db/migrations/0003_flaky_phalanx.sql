CREATE TABLE `work_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`spec_id` text NOT NULL,
	`priority` integer DEFAULT 3 NOT NULL,
	`position` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`blocked_by` text,
	`added_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`assigned_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spec_id`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_by`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE sessions ADD `current_work_item_id` integer;--> statement-breakpoint
ALTER TABLE sessions ADD `last_activity_at` integer;