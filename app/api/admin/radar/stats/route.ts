import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/admin";

export async function GET() {
  await requireStaff();

  const [pending, published, cbArchive, lastRun] = await Promise.all([
    prisma.radarItem.count({ where: { issueId: null } }),
    prisma.radarItem.count({ where: { issueId: { not: null } } }),
    prisma.radarCbArticle.count({ where: { used: false } }),
    prisma.radarRun.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  return NextResponse.json({
    pending,
    published,
    cbArchive,
    lastRunAt: lastRun?.createdAt ?? null,
  });
}
