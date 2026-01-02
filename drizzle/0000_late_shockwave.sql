CREATE TABLE `MoLOS-Tasks_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'to_do' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`due_date` integer,
	`do_date` integer,
	`effort` integer,
	`context` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`project_id` text,
	`area_id` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Tasks_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`theme_color` text,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Tasks_daily_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`log_date` integer NOT NULL,
	`mood` text,
	`sleep_hours` real,
	`morning_routine` integer DEFAULT false,
	`evening_routine` integer DEFAULT false,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Tasks_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`description` text,
	`start_date` integer,
	`end_date` integer,
	`area_id` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MoLOS-Tasks_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`show_completed` integer DEFAULT false NOT NULL,
	`compact_mode` integer DEFAULT false NOT NULL,
	`notifications` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
