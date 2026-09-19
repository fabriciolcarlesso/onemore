import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutCompletions, workouts } from "@/db/schema";
import { WorkoutCalendar } from "./workout-calendar";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardPage() {
  const user = await requireUser();

  const completions = await db.select({ day: workoutCompletions.completedOn }).from(workoutCompletions).where(eq(workoutCompletions.userId, user.id));
  const recentWorkouts = await db.select({ id: workouts.id, name: workouts.name }).from(workouts).where(eq(workouts.createdBy, user.id)).orderBy(desc(workouts.createdAt), desc(workouts.id)).limit(3);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return <DashboardShell recentWorkouts={recentWorkouts} user={user} signOut={signOut} completedWorkouts={<WorkoutCalendar days={completions.map((entry) => entry.day)} today={today} />} />;
}
