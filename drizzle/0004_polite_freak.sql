CREATE TABLE "club_finished_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"book_id" text NOT NULL,
	"book_title" text NOT NULL,
	"book_cover" text,
	"book_author" text,
	"finished_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_finished_books" ADD CONSTRAINT "club_finished_books_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;