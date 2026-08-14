CREATE TABLE "reading_shelf" (
	"user_id" text NOT NULL,
	"book_id" text NOT NULL,
	"book_title" text NOT NULL,
	"book_cover" text,
	"book_author" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_shelf_user_id_book_id_pk" PRIMARY KEY("user_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "reading_shelf" ADD CONSTRAINT "reading_shelf_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;