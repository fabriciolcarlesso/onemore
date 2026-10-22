CREATE TYPE "exercise_muscle_role" AS ENUM('principal', 'auxiliar', 'sinergista', 'estabilizador');
--> statement-breakpoint
CREATE TYPE "exercise_document_status" AS ENUM('uploaded', 'processing', 'ready', 'error');
--> statement-breakpoint
ALTER TABLE "exercise_muscle_groups" ADD COLUMN "role" "exercise_muscle_role" DEFAULT 'auxiliar' NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercise_muscle_groups" ADD COLUMN "importance_order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercise_muscle_groups" ADD COLUMN "notes" text;
--> statement-breakpoint
CREATE TABLE "exercise_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exercise_id" uuid NOT NULL,
  "original_name" varchar(255) NOT NULL,
  "mime_type" varchar(120) NOT NULL,
  "file_size" integer NOT NULL,
  "page_count" integer,
  "checksum" varchar(64),
  "content" bytea NOT NULL,
  "status" "exercise_document_status" DEFAULT 'uploaded' NOT NULL,
  "extracted_text" text,
  "error_message" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_phases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exercise_id" uuid NOT NULL,
  "name" varchar(80) NOT NULL,
  "order_index" integer NOT NULL,
  "description" text,
  "image_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "joints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "region" varchar(80),
  "description" text
);
--> statement-breakpoint
CREATE TABLE "exercise_joints" (
  "exercise_id" uuid NOT NULL,
  "joint_id" uuid NOT NULL,
  "movement" varchar(120),
  "role" varchar(80),
  "order_index" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "exercise_joints_pkey" PRIMARY KEY("exercise_id", "joint_id")
);
--> statement-breakpoint
CREATE TABLE "equipment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text
);
--> statement-breakpoint
CREATE TABLE "exercise_equipment" (
  "exercise_id" uuid NOT NULL,
  "equipment_id" uuid NOT NULL,
  "notes" text,
  CONSTRAINT "exercise_equipment_pkey" PRIMARY KEY("exercise_id", "equipment_id")
);
--> statement-breakpoint
ALTER TABLE "exercise_documents" ADD CONSTRAINT "exercise_documents_exercise_id_exercises_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "exercise_documents" ADD CONSTRAINT "exercise_documents_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "exercise_phases" ADD CONSTRAINT "exercise_phases_exercise_id_exercises_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "exercise_joints" ADD CONSTRAINT "exercise_joints_exercise_id_exercises_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "exercise_joints" ADD CONSTRAINT "exercise_joints_joint_id_joints_id_fkey" FOREIGN KEY ("joint_id") REFERENCES "joints"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_exercise_id_exercises_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_equipment_id_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "exercise_documents_exercise_id_idx" ON "exercise_documents" ("exercise_id");
--> statement-breakpoint
CREATE INDEX "exercise_documents_status_idx" ON "exercise_documents" ("status");
--> statement-breakpoint
CREATE INDEX "exercise_phases_exercise_id_idx" ON "exercise_phases" ("exercise_id");
--> statement-breakpoint
CREATE INDEX "exercise_joints_joint_id_idx" ON "exercise_joints" ("joint_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "joints_name_unique" ON "joints" ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_name_unique" ON "equipment" ("name");
--> statement-breakpoint
INSERT INTO "joints" ("name", "region", "description") VALUES
  ('Ombro', 'Membro superior', 'Articulação responsável pelos movimentos do braço.'),
  ('Cotovelo', 'Membro superior', 'Articulação que conecta braço e antebraço.'),
  ('Punho', 'Membro superior', 'Articulação entre antebraço e mão.'),
  ('Quadril', 'Membro inferior', 'Articulação entre pelve e fêmur.'),
  ('Joelho', 'Membro inferior', 'Articulação entre fêmur, tíbia e patela.'),
  ('Tornozelo', 'Membro inferior', 'Articulação entre perna e pé.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "equipment" ("name", "description") VALUES
  ('Banco', 'Banco utilizado para exercícios deitado ou sentado.'),
  ('Máquina de cabos', 'Equipamento com cabos e pesos ajustáveis.'),
  ('Halteres', 'Pesos livres utilizados individualmente ou em pares.')
ON CONFLICT ("name") DO NOTHING;
