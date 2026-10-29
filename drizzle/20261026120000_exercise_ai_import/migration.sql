ALTER TABLE "exercise_documents" ADD COLUMN "structured_data" jsonb;
--> statement-breakpoint
CREATE TYPE "exercise_review_status" AS ENUM ('pendente', 'aprovado');
--> statement-breakpoint
-- Exercícios existentes já foram revisados; apenas importações por IA entram como pendentes.
ALTER TABLE "exercises" ADD COLUMN "review_status" "exercise_review_status" DEFAULT 'aprovado' NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "english_name" varchar(160);
--> statement-breakpoint
CREATE TABLE "exercise_attributes" (
  "exercise_id" uuid PRIMARY KEY NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "type" varchar(60),
  "laterality" varchar(60),
  "kinetic_chain" varchar(60),
  "movement_pattern" varchar(60),
  "plane" varchar(60),
  "stability_demand" varchar(60),
  "load_progression" varchar(60),
  "resistance_curve" text,
  "machine_adjustments" text,
  "equipment_category" varchar(80),
  "session_role" varchar(60),
  "systemic_fatigue" integer,
  "technical_complexity" integer,
  "safe_to_failure" boolean,
  "setup_seconds" integer,
  "seconds_per_set" integer,
  "unilateral" boolean,
  "position" varchar(60),
  "impact" varchar(60),
  "axial_load" varchar(60),
  "goes_to_floor" boolean,
  "minimum_level" varchar(60),
  "sources" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_discomfort" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "region" varchar(80) NOT NULL,
  "score" integer NOT NULL,
  "label" varchar(60),
  "notes" text
);
--> statement-breakpoint
CREATE INDEX "exercise_discomfort_exercise_id_idx" ON "exercise_discomfort" ("exercise_id");
--> statement-breakpoint
CREATE TABLE "exercise_muscle_volume" (
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "slug" varchar(80) NOT NULL,
  "label" varchar(80) NOT NULL,
  "value" numeric(4, 2) NOT NULL,
  "kind" varchar(40),
  CONSTRAINT "exercise_muscle_volume_pkey" PRIMARY KEY("exercise_id", "slug")
);
--> statement-breakpoint
CREATE TABLE "health_conditions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(80) NOT NULL,
  "name" varchar(160) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "health_conditions_slug_unique" ON "health_conditions" ("slug");
--> statement-breakpoint
CREATE TYPE "health_rule_action" AS ENUM ('excluir', 'permitido', 'adaptar');
--> statement-breakpoint
CREATE TABLE "exercise_health_rules" (
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "health_condition_id" uuid NOT NULL REFERENCES "health_conditions"("id") ON DELETE CASCADE,
  "action" "health_rule_action" NOT NULL,
  CONSTRAINT "exercise_health_rules_pkey" PRIMARY KEY("exercise_id", "health_condition_id")
);
--> statement-breakpoint
CREATE INDEX "exercise_health_rules_condition_idx" ON "exercise_health_rules" ("health_condition_id");
--> statement-breakpoint
CREATE TYPE "exercise_priority_kind" AS ENUM ('objetivo', 'nivel', 'perfil', 'condicao');
--> statement-breakpoint
CREATE TABLE "exercise_priorities" (
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "kind" "exercise_priority_kind" NOT NULL,
  "slug" varchar(80) NOT NULL,
  "label" varchar(120) NOT NULL,
  CONSTRAINT "exercise_priorities_pkey" PRIMARY KEY("exercise_id", "kind", "slug")
);
--> statement-breakpoint
CREATE INDEX "exercise_priorities_kind_slug_idx" ON "exercise_priorities" ("kind", "slug");
