CREATE TABLE "workout_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"workout_id" uuid,
	"completed_on" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "workout_completions_user_workout_day_unique" ON "workout_completions" ("user_id","workout_id","completed_on");--> statement-breakpoint
CREATE INDEX "workout_completions_user_idx" ON "workout_completions" ("user_id");--> statement-breakpoint
ALTER TABLE "workout_completions" ADD CONSTRAINT "workout_completions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workout_completions" ADD CONSTRAINT "workout_completions_workout_id_workouts_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE SET NULL;