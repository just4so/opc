import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/admin";

export async function GET() {
  await requireStaff();

  const issues = await prisma.radarIssue.findMany({
    orderBy: { issueNo: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json(issues);
}
