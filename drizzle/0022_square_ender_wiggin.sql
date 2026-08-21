CREATE TABLE "quiz_ratings" (
	"user_id" text NOT NULL,
	"quiz_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_ratings_user_id_quiz_id_pk" PRIMARY KEY("user_id","quiz_id")
);
--> statement-breakpoint
ALTER TABLE "quiz_ratings" ADD CONSTRAINT "quiz_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_ratings" ADD CONSTRAINT "quiz_ratings_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;