INSERT INTO "muscle_groups" ("name", "description") VALUES
  ('Peitoral maior', 'Músculo superficial do tórax que aproxima, flexiona e gira o braço para dentro, participando principalmente dos movimentos de empurrar.'),
  ('Peitoral menor', 'Músculo profundo do tórax que estabiliza, projeta e inclina a escápula anteriormente, auxiliando a mecânica do ombro.')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";
--> statement-breakpoint

-- Duplica os vínculos do grupo combinado para o peitoral menor antes de
-- substituir o vínculo original pelo peitoral maior.
INSERT INTO "exercise_muscle_groups" ("exercise_id", "muscle_group_id", "role", "importance_order", "notes")
SELECT emg."exercise_id", menor."id", emg."role", emg."importance_order", emg."notes"
FROM "exercise_muscle_groups" emg
JOIN "muscle_groups" antigo ON antigo."id" = emg."muscle_group_id"
JOIN "muscle_groups" menor ON menor."name" = 'Peitoral menor'
WHERE antigo."name" = 'Peitoral maior e menor'
ON CONFLICT ("exercise_id", "muscle_group_id") DO NOTHING;
--> statement-breakpoint

UPDATE "exercise_muscle_groups" emg
SET "muscle_group_id" = maior."id"
FROM "muscle_groups" antigo, "muscle_groups" maior
WHERE emg."muscle_group_id" = antigo."id"
  AND antigo."name" = 'Peitoral maior e menor'
  AND maior."name" = 'Peitoral maior'
  AND NOT EXISTS (
    SELECT 1 FROM "exercise_muscle_groups" existente
    WHERE existente."exercise_id" = emg."exercise_id"
      AND existente."muscle_group_id" = maior."id"
  );
--> statement-breakpoint

DELETE FROM "exercise_muscle_groups"
WHERE "muscle_group_id" = (SELECT "id" FROM "muscle_groups" WHERE "name" = 'Peitoral maior e menor');
--> statement-breakpoint
DELETE FROM "muscle_groups" WHERE "name" = 'Peitoral maior e menor';
