CREATE TABLE "exercise_muscle_groups" (
	"exercise_id" uuid,
	"muscle_group_id" uuid,
	CONSTRAINT "exercise_muscle_groups_pkey" PRIMARY KEY("exercise_id","muscle_group_id")
);
--> statement-breakpoint
CREATE TABLE "muscle_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "exercise_muscle_groups_exercise_id_idx" ON "exercise_muscle_groups" ("exercise_id");--> statement-breakpoint
CREATE INDEX "exercise_muscle_groups_muscle_group_id_idx" ON "exercise_muscle_groups" ("muscle_group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "muscle_groups_name_unique" ON "muscle_groups" ("name");--> statement-breakpoint
ALTER TABLE "exercise_muscle_groups" ADD CONSTRAINT "exercise_muscle_groups_exercise_id_exercises_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exercise_muscle_groups" ADD CONSTRAINT "exercise_muscle_groups_muscle_group_id_muscle_groups_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "muscle_groups"("id") ON DELETE CASCADE;
--> statement-breakpoint
INSERT INTO "muscle_groups" ("name") VALUES
  ('Peito'), ('Costas'), ('Ombros'), ('Bíceps'), ('Tríceps'),
  ('Quadríceps'), ('Posteriores de coxa'), ('Glúteos'), ('Panturrilhas'), ('Abdômen')
ON CONFLICT ("name") DO NOTHING;
