import { asc, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { muscleGroups } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const user = await requireUser();
  if (user.role === "aluno") return NextResponse.json({ groups: [], hasMore: false }, { status: 403 });
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const groups = await db.select({ id: muscleGroups.id, name: muscleGroups.name, description: muscleGroups.description }).from(muscleGroups).where(query ? ilike(muscleGroups.name, `%${query}%`) : undefined).orderBy(asc(muscleGroups.name)).limit(20).offset(offset);
  return NextResponse.json({ groups, hasMore: groups.length === 20 });
}
