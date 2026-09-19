CREATE TABLE "plans" (
	"id" varchar(20) PRIMARY KEY,
	"name" varchar(60) NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"duration_months" integer,
	"trial_days" integer
);
--> statement-breakpoint
CREATE TABLE "student_plans" (
	"student_id" uuid PRIMARY KEY,
	"plan_id" varchar(20) NOT NULL,
	"selected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"free_expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "student_plans" ADD CONSTRAINT "student_plans_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_plans" ADD CONSTRAINT "student_plans_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT;
--> statement-breakpoint
INSERT INTO "plans" ("id", "name", "monthly_price_cents", "duration_months", "trial_days") VALUES
  ('free', 'Free', 0, NULL, 15),
  ('monthly', 'Mensal', 5990, 1, NULL),
  ('quarterly', 'Trimestral', 4990, 3, NULL),
  ('semiannual', 'Semestral', 3990, 6, NULL),
  ('yearly', 'Anual', 2990, 12, NULL);
