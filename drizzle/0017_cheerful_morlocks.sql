CREATE TYPE "public"."club_cadence" AS ENUM('monthly', 'bimonthly');--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "cadence" "club_cadence";