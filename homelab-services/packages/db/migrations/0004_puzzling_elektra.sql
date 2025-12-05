CREATE TABLE `worker_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` integer NOT NULL,
	`spec_id` text NOT NULL,
	`agent_type` text NOT NULL,
	`status` text DEFAULT 'spawned' NOT NULL,
	`spawned_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`result` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spec_id`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `error_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`test_failure_id` integer NOT NULL,
	`spec_id` text,
	`generated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_failure_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`auto_generated_content` text,
	`user_modified` integer DEFAULT false NOT NULL,
	`occurrence_count` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`test_failure_id`) REFERENCES `test_failures`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spec_id`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `worker_agents_session_id_idx` ON `worker_agents` (`session_id`);--> statement-breakpoint
CREATE INDEX `worker_agents_spec_id_idx` ON `worker_agents` (`spec_id`);--> statement-breakpoint
CREATE INDEX `worker_agents_status_idx` ON `worker_agents` (`status`);--> statement-breakpoint
CREATE INDEX `worker_agents_spawned_at_idx` ON `worker_agents` (`spawned_at`);--> statement-breakpoint
CREATE INDEX `idx_error_proposals_test_failure` ON `error_proposals` (`test_failure_id`);--> statement-breakpoint
CREATE INDEX `idx_error_proposals_spec` ON `error_proposals` (`spec_id`);--> statement-breakpoint
CREATE INDEX `idx_error_proposals_generated_at` ON `error_proposals` (`generated_at`);