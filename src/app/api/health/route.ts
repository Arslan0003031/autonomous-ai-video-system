import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      status: "ok",
      service: "AI Creator Studio",
      timestamp: new Date().toISOString(),
      db: "connected",
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", db: "disconnected", error: String(err) },
      { status: 500 }
    );
  }
}
