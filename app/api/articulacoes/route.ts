import { asc, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { joints } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const user = await requireUser();
  if (user.role === "aluno") return NextResponse.json({ joints: [], hasMore: false }, { status: 403 });
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const rows = await db.select({ id: joints.id, name: joints.name, region: joints.region, description: joints.description }).from(joints).where(query ? ilike(joints.name, `%${query}%`) : undefined).orderBy(asc(joints.name)).limit(20).offset(offset);
  return NextResponse.json({ joints: rows, hasMore: rows.length === 20 });
}
