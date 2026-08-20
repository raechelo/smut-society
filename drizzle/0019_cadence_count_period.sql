ALTER TABLE "clubs" DROP COLUMN "cadence";--> statement-breakpoint
DROP TYPE "public"."club_cadence";--> statement-breakpoint
CREATE TYPE "public"."club_cadence_period" AS ENUM('weekly', 'biweekly', 'monthly');--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "cadence_count" integer;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "cadence_period" "club_cadence_period";
