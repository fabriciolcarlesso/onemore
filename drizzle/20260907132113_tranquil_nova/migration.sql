CREATE TABLE "teacher_students" (
	"teacher_id" uuid,
	"student_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_students_pkey" PRIMARY KEY("teacher_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "user_role";--> statement-breakpoint
UPDATE "users" SET "role" = CASE "role" WHEN 'trainer' THEN 'professor' WHEN 'student' THEN 'aluno' ELSE "role" END;--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('admin', 'professor', 'aluno');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "user_role" USING "role"::"user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'aluno'::"user_role";--> statement-breakpoint
CREATE INDEX "teacher_students_teacher_id_idx" ON "teacher_students" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_students_student_id_idx" ON "teacher_students" ("student_id");--> statement-breakpoint
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "users" SET "role" = 'aluno', "updated_at" = now() WHERE "email" = 'fabriciolcarlesso@gmail.com';--> statement-breakpoint
UPDATE "users" SET "role" = 'professor', "updated_at" = now() WHERE "email" = 'jeancacarlesso@gmail.com';--> statement-breakpoint
INSERT INTO "teacher_students" ("teacher_id", "student_id")
SELECT teacher."id", student."id"
FROM "users" teacher CROSS JOIN "users" student
WHERE teacher."email" = 'jeancacarlesso@gmail.com'
  AND student."email" = 'fabriciolcarlesso@gmail.com'
ON CONFLICT ("teacher_id", "student_id") DO NOTHING;
