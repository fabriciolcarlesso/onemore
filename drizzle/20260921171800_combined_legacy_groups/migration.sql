UPDATE "workout_groups"
SET "type" = 'combined'
WHERE "type" IN ('bi_set', 'tri_set');
