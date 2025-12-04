CREATE TABLE `openspec_specs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'proposing' NOT NULL,
	`status_changed_at` integer,
	`status_changed_by` text,
	`proposal_content` text,
	`tasks_content` text,
	`design_content` text,
	`last_synced_at` integer,
	`filesystem_modified_at` integer,
	`db_modified_at` integer,
	`sync_error` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spec_id` text NOT NULL,
	`sync_direction` text NOT NULL,
	`triggered_by` text NOT NULL,
	`success` integer NOT NULL,
	`error_message` text,
	`files_changed` text,
	`synced_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`spec_id`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `applied_specs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spec_id` text NOT NULL,
	`project_id` integer NOT NULL,
	`applied_at` integer DEFAULT (strftime('%s', 'now')),
	`applied_by` integer,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`verification_notes` text,
	FOREIGN KEY (`spec_id`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`applied_by`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spec_lifecycle` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spec_id` text NOT NULL,
	`from_state` text,
	`to_state` text NOT NULL,
	`triggered_by` text NOT NULL,
	`trigger_user_id` integer,
	`trigger_session_id` integer,
	`transitioned_at` integer DEFAULT (strftime('%s', 'now')),
	`notes` text,
	FOREIGN KEY (`spec_id`) REFERENCES `openspec_specs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trigger_session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `openspec_specs_project_id_idx` ON `openspec_specs` (`project_id`);--> statement-breakpoint
CREATE INDEX `openspec_specs_status_idx` ON `openspec_specs` (`status`);--> statement-breakpoint
CREATE INDEX `openspec_specs_last_synced_at_idx` ON `openspec_specs` (`last_synced_at`);--> statement-breakpoint
CREATE INDEX `sync_history_spec_id_idx` ON `sync_history` (`spec_id`);--> statement-breakpoint
CREATE INDEX `sync_history_synced_at_idx` ON `sync_history` (`synced_at`);--> statement-breakpoint
CREATE INDEX `applied_specs_project_id_idx` ON `applied_specs` (`project_id`);--> statement-breakpoint
CREATE INDEX `applied_specs_spec_id_idx` ON `applied_specs` (`spec_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_project_spec` ON `applied_specs` (`project_id`,`spec_id`);--> statement-breakpoint
CREATE INDEX `spec_lifecycle_spec_id_idx` ON `spec_lifecycle` (`spec_id`);--> statement-breakpoint
CREATE INDEX `spec_lifecycle_transitioned_at_idx` ON `spec_lifecycle` (`transitioned_at`);--> statement-breakpoint
CREATE INDEX `spec_lifecycle_spec_id_transitioned_at_idx` ON `spec_lifecycle` (`spec_id`,`transitioned_at`);