ALTER TABLE "workouts" ADD COLUMN "sheet_id" uuid;
--> statement-breakpoint
UPDATE "workouts" AS w SET "sheet_id" = (
	SELECT l."sheet_id"
	FROM "workout_sheet_workouts" AS l
	WHERE l."workout_id" = w."id"
	ORDER BY l."created_at", l."sheet_id"
	LIMIT 1
);
--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_sheet_id_workout_sheets_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "workout_sheets"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "workouts_sheet_id_idx" ON "workouts" ("sheet_id");
--> statement-breakpoint
DROP TABLE "workout_sheet_workouts";
