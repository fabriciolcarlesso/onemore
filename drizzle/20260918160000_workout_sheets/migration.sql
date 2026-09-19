CREATE TABLE "workout_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sheet_workouts" (
	"sheet_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workout_sheet_workouts_pkey" PRIMARY KEY("sheet_id","workout_id")
);
--> statement-breakpoint
ALTER TABLE "workout_sheets" ADD CONSTRAINT "workout_sheets_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "workout_sheet_workouts" ADD CONSTRAINT "workout_sheet_workouts_sheet_id_workout_sheets_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "workout_sheets"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "workout_sheet_workouts" ADD CONSTRAINT "workout_sheet_workouts_workout_id_workouts_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "workout_sheets_created_by_idx" ON "workout_sheets" ("created_by");
--> statement-breakpoint
CREATE INDEX "workout_sheet_workouts_workout_id_idx" ON "workout_sheet_workouts" ("workout_id");
