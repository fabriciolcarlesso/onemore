CREATE TABLE "exercise_primary_muscles" (
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "muscle_group_id" uuid NOT NULL REFERENCES "muscle_groups"("id") ON DELETE CASCADE,
  CONSTRAINT "exercise_primary_muscles_pkey" PRIMARY KEY("exercise_id", "muscle_group_id")
);
--> statement-breakpoint
CREATE INDEX "exercise_primary_muscles_exercise_id_idx" ON "exercise_primary_muscles" ("exercise_id");
--> statement-breakpoint
CREATE INDEX "exercise_primary_muscles_muscle_group_id_idx" ON "exercise_primary_muscles" ("muscle_group_id");
