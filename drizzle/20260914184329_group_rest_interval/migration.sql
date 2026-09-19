ALTER TABLE "workout_groups" ADD COLUMN "rest_seconds" integer;
--> statement-breakpoint
UPDATE "workout_groups" AS g SET "rest_seconds" = (
  SELECT e."rest_seconds" FROM "workout_exercises" AS e
  WHERE e."group_id" = g."id" AND e."rest_seconds" IS NOT NULL
  ORDER BY e."order_index" DESC LIMIT 1
);
