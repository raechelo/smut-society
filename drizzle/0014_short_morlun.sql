CREATE TYPE "public"."goal_status" AS ENUM('in progress', 'completed');--> statement-breakpoint
CREATE TABLE "book_reviews" (
	"user_id" text NOT NULL,
	"book_id" text NOT NULL,
	"rating" integer,
	"spice_rating" integer,
	"review_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_reviews_user_id_book_id_pk" PRIMARY KEY("user_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN "status" "goal_status" DEFAULT 'in progress' NOT NULL;--> statement-breakpoint
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;