CREATE TYPE "preferred_teacher" AS ENUM('romeu', 'julieta');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_teacher" "preferred_teacher";