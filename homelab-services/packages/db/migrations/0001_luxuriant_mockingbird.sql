CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workflow_name` text NOT NULL,
	`run_number` integer,
	`hash` text NOT NULL,
	`file_path` text NOT NULL,
	`total_tests` integer DEFAULT 0 NOT NULL,
	`passed` integer DEFAULT 0 NOT NULL,
	`failed` integer DEFAULT 0 NOT NULL,
	`skipped` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'passed' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `failure_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`test_name` text NOT NULL,
	`test_file` text,
	`line_number` integer,
	`first_seen` integer DEFAULT (strftime('%s', 'now')),
	`last_seen` integer DEFAULT (strftime('%s', 'now')),
	`occurrences` integer DEFAULT 1 NOT NULL,
	`consecutive_failures` integer DEFAULT 1 NOT NULL,
	`total_runs` integer DEFAULT 1 NOT NULL,
	`classification_type` text
);
--> statement-breakpoint
CREATE TABLE `test_failures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` integer NOT NULL,
	`test_name` text NOT NULL,
	`test_file` text,
	`line_number` integer,
	`error` text,
	`stack_trace` text,
	`duration` integer,
	`retries` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `remediation_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` integer NOT NULL,
	`test_name` text NOT NULL,
	`claude_session_id` text,
	`triggered_at` integer DEFAULT (strftime('%s', 'now')),
	`completed_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`fix_description` text,
	`pr_url` text,
	`rerun_report_id` integer,
	`rerun_passed` integer,
	`error_message` text,
	`classification_type` text,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rerun_report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `threshold_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`min_failed_tests` integer DEFAULT 1 NOT NULL,
	`failure_rate` integer DEFAULT 0 NOT NULL,
	`include_flaky` integer DEFAULT false NOT NULL,
	`only_new_failures` integer DEFAULT true NOT NULL,
	`critical_test_patterns` text,
	`exclude_test_patterns` text,
	`rate_limit_per_workflow` integer DEFAULT 1,
	`global_rate_limit` integer DEFAULT 5,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_hash_unique` ON `reports` (`hash`);--> statement-breakpoint
CREATE INDEX `idx_reports_workflow` ON `reports` (`workflow_name`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reports_status` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reports_hash` ON `reports` (`hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `failure_history_test_name_unique` ON `failure_history` (`test_name`);--> statement-breakpoint
CREATE INDEX `idx_failure_test_name` ON `failure_history` (`test_name`);--> statement-breakpoint
CREATE INDEX `idx_failure_classification` ON `failure_history` (`classification_type`);--> statement-breakpoint
CREATE INDEX `idx_failure_last_seen` ON `failure_history` (`last_seen`);--> statement-breakpoint
CREATE INDEX `idx_test_failures_report` ON `test_failures` (`report_id`);--> statement-breakpoint
CREATE INDEX `idx_test_failures_test_name` ON `test_failures` (`test_name`);--> statement-breakpoint
CREATE INDEX `idx_remediation_report` ON `remediation_attempts` (`report_id`,`triggered_at`);--> statement-breakpoint
CREATE INDEX `idx_remediation_test_name` ON `remediation_attempts` (`test_name`);--> statement-breakpoint
CREATE INDEX `idx_remediation_status` ON `remediation_attempts` (`status`,`triggered_at`);--> statement-breakpoint
CREATE INDEX `idx_remediation_session` ON `remediation_attempts` (`claude_session_id`);