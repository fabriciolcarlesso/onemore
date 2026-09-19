CREATE TABLE "student_workouts" (
	"student_id" uuid,
	"teacher_id" uuid NOT NULL,
	"source_workout_id" uuid,
	"workout_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_workouts_pkey" PRIMARY KEY("student_id","source_workout_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "student_workouts_workout_unique" ON "student_workouts" ("workout_id");--> statement-breakpoint
ALTER TABLE "student_workouts" ADD CONSTRAINT "student_workouts_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_workouts" ADD CONSTRAINT "student_workouts_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_workouts" ADD CONSTRAINT "student_workouts_source_workout_id_workouts_id_fkey" FOREIGN KEY ("source_workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_workouts" ADD CONSTRAINT "student_workouts_workout_id_workouts_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE;