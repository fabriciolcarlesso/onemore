ALTER TABLE "student_workouts" ADD COLUMN "sheet_id" uuid;--> statement-breakpoint
CREATE INDEX "student_workouts_sheet_id_idx" ON "student_workouts" ("sheet_id");--> statement-breakpoint
ALTER TABLE "student_workouts" ADD CONSTRAINT "student_workouts_sheet_id_workout_sheets_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "workout_sheets"("id") ON DELETE SET NULL;