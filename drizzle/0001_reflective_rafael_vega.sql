CREATE TABLE "club_nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"nominated_by" text NOT NULL,
	"book_id" text NOT NULL,
	"book_title" text NOT NULL,
	"book_cover" text,
	"book_author" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "club_nominations_club_id_book_id_unique" UNIQUE("club_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "nomination_votes" (
	"user_id" text NOT NULL,
	"nomination_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nomination_votes_user_id_nomination_id_pk" PRIMARY KEY("user_id","nomination_id")
);
--> statement-breakpoint
ALTER TABLE "club_nominations" ADD CONSTRAINT "club_nominations_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_nominations" ADD CONSTRAINT "club_nominations_nominated_by_users_id_fk" FOREIGN KEY ("nominated_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomination_votes" ADD CONSTRAINT "nomination_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomination_votes" ADD CONSTRAINT "nomination_votes_nomination_id_club_nominations_id_fk" FOREIGN KEY ("nomination_id") REFERENCES "public"."club_nominations"("id") ON DELETE cascade ON UPDATE no action;