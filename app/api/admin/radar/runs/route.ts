import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/admin";

export async function GET() {
  await requireStaff();

  const runs = await prisma.radarRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(runs);
}
