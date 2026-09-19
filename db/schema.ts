import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "admin",
  "professor",
  "aluno",
]);

export const preferredTeacher = pgEnum("preferred_teacher", [
  "romeu",
  "julieta",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    role: userRole("role").default("aluno").notNull(),
    preferredTeacher: preferredTeacher("preferred_teacher"),
    weight: numeric("weight", { precision: 5, scale: 2 }),
    height: integer("height"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const plans = pgTable("plans", {
  id: varchar("id", { length: 20 }).primaryKey(),
  name: varchar("name", { length: 60 }).notNull(),
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  durationMonths: integer("duration_months"),
  trialDays: integer("trial_days"),
});

export const studentPlans = pgTable("student_plans", {
  studentId: uuid("student_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 20 }).notNull().references(() => plans.id, { onDelete: "restrict" }),
  selectedAt: timestamp("selected_at", { withTimezone: true }).defaultNow().notNull(),
  freeExpiresAt: timestamp("free_expires_at", { withTimezone: true }),
});

export const teacherStudents = pgTable(
  "teacher_students",
  {
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.teacherId, table.studentId] }),
    index("teacher_students_teacher_id_idx").on(table.teacherId),
    index("teacher_students_student_id_idx").on(table.studentId),
  ],
);

export type TeacherStudent = typeof teacherStudents.$inferSelect;

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_token_hash_unique").on(
      table.tokenHash,
    ),
    index("email_verification_tokens_user_id_idx").on(table.userId),
  ],
);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("exercises_name_idx").on(table.name)],
);

export const workoutGroupType = pgEnum("workout_group_type", [
  "single",
  "bi_set",
  "tri_set",
]);

export const workoutSheets = pgTable(
  "workout_sheets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("workout_sheets_created_by_idx").on(table.createdBy)],
);

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    weekdays: text("weekdays").array().notNull().default([]),
    sheetId: uuid("sheet_id").references(() => workoutSheets.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workouts_created_by_idx").on(table.createdBy),
    index("workouts_sheet_id_idx").on(table.sheetId),
  ],
);

export const workoutGroups = pgTable(
  "workout_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    muscleGroupId: uuid("muscle_group_id"),
    type: workoutGroupType("type").default("single").notNull(),
    restSeconds: integer("rest_seconds"),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [index("workout_groups_workout_id_idx").on(table.workoutId)],
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => workoutGroups.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    orderIndex: integer("order_index").notNull(),
    sets: integer("sets").notNull(),
    repetitions: integer("repetitions").notNull(),
    restSeconds: integer("rest_seconds"),
    load: numeric("load", { precision: 8, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workout_exercises_group_id_idx").on(table.groupId),
    index("workout_exercises_exercise_id_idx").on(table.exerciseId),
  ],
);

export type Workout = typeof workouts.$inferSelect;

export const studentWorkouts = pgTable("student_workouts", {
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceWorkoutId: uuid("source_workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  workoutId: uuid("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.studentId, table.sourceWorkoutId] }),
  uniqueIndex("student_workouts_workout_unique").on(table.workoutId),
]);

export const workoutCompletions = pgTable("workout_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workoutId: uuid("workout_id").references(() => workouts.id, { onDelete: "set null" }),
  completedOn: date("completed_on").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("workout_completions_user_workout_day_unique").on(table.userId, table.workoutId, table.completedOn),
  index("workout_completions_user_idx").on(table.userId),
]);
export type WorkoutGroup = typeof workoutGroups.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;

export const workoutExerciseLoadHistory = pgTable(
  "workout_exercise_load_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    load: numeric("load", { precision: 8, scale: 2 }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workout_exercise_load_history_exercise_idx").on(table.workoutExerciseId),
    index("workout_exercise_load_history_user_idx").on(table.userId),
    index("workout_exercise_load_history_recorded_at_idx").on(table.recordedAt),
  ],
);

export type WorkoutExerciseLoadHistory = typeof workoutExerciseLoadHistory.$inferSelect;

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export const muscleGroups = pgTable(
  "muscle_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
  },
  (table) => [uniqueIndex("muscle_groups_name_unique").on(table.name)],
);

export const exerciseMuscleGroups = pgTable(
  "exercise_muscle_groups",
  {
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    muscleGroupId: uuid("muscle_group_id")
      .notNull()
      .references(() => muscleGroups.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.exerciseId, table.muscleGroupId] }),
    index("exercise_muscle_groups_exercise_id_idx").on(table.exerciseId),
    index("exercise_muscle_groups_muscle_group_id_idx").on(table.muscleGroupId),
  ],
);

export type MuscleGroup = typeof muscleGroups.$inferSelect;
