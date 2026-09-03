CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "exercises_name_idx" ON "exercises" ("name");--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
INSERT INTO "exercises" ("name", "description") VALUES ('Supino Reto', 'Deitado no banco, mantenha os pés firmes no chão e desça a barra de forma controlada até a linha do peito. Empurre-a de volta sem perder o alinhamento dos punhos e cotovelos.');
