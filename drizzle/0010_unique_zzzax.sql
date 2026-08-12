CREATE TABLE "comment_reactions" (
	"user_id" text NOT NULL,
	"comment_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_reactions_user_id_comment_id_emoji_pk" PRIMARY KEY("user_id","comment_id","emoji")
);
--> statement-breakpoint
CREATE TABLE "thread_reactions" (
	"user_id" text NOT NULL,
	"thread_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "thread_reactions_user_id_thread_id_emoji_pk" PRIMARY KEY("user_id","thread_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_club_thread_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."club_thread_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_reactions" ADD CONSTRAINT "thread_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_reactions" ADD CONSTRAINT "thread_reactions_thread_id_club_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."club_threads"("id") ON DELETE cascade ON UPDATE no action;