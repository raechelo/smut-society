CREATE TABLE "bingo_card_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"shared_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bingo_card_shares_card_id_club_id_unique" UNIQUE("card_id","club_id")
);
--> statement-breakpoint
ALTER TABLE "bingo_card_shares" ADD CONSTRAINT "bingo_card_shares_card_id_bingo_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."bingo_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bingo_card_shares" ADD CONSTRAINT "bingo_card_shares_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bingo_card_shares" ADD CONSTRAINT "bingo_card_shares_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;