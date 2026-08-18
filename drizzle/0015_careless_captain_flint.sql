CREATE TYPE "public"."read_status" AS ENUM('in progress', 'completed', 'dnf');--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "status" "read_status" DEFAULT 'in progress' NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "reading_shelf" ADD COLUMN "status" "read_status" DEFAULT 'in progress' NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_shelf" ADD COLUMN "started_at" timestamp;