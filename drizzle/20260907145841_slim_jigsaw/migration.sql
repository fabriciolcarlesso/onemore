CREATE TABLE "workout_exercise_load_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"workout_exercise_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"load" numeric(8,2) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "workout_exercise_load_history_exercise_idx" ON "workout_exercise_load_history" ("workout_exercise_id");--> statement-breakpoint
CREATE INDEX "workout_exercise_load_history_user_idx" ON "workout_exercise_load_history" ("user_id");--> statement-breakpoint
CREATE INDEX "workout_exercise_load_history_recorded_at_idx" ON "workout_exercise_load_history" ("recorded_at");--> statement-breakpoint
ALTER TABLE "workout_exercise_load_history" ADD CONSTRAINT "workout_exercise_load_history_zJYOLsbK8NQx_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workout_exercise_load_history" ADD CONSTRAINT "workout_exercise_load_history_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;