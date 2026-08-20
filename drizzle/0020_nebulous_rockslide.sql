ALTER TABLE "clubs" ADD COLUMN "invite_token" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_invite_token_unique" UNIQUE("invite_token");