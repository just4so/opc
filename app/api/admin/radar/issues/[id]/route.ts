import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();

  const { id } = await params;

  const issue = await prisma.radarIssue.findUnique({
    where: { id },
    include: {
      items: { orderBy: { importance: "desc" } },
    },
  });

  if (!issue) {
    return NextResponse.json({ error: "期刊不存在" }, { status: 404 });
  }

  return NextResponse.json(issue);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();

  const { id } = await params;
  const body = await req.json();
  const { items, removeIds } = body as {
    items: { id: string; title: string; summary: string | null }[];
    removeIds: string[];
  };

  // Update titles and summaries
  await Promise.all(
    items.map(item =>
      prisma.radarItem.update({
        where: { id: item.id },
        data: { title: item.title, summary: item.summary },
      })
    )
  );

  // Remove items from issue (set issueId to null)
  if (removeIds.length > 0) {
    await prisma.radarItem.updateMany({
      where: { id: { in: removeIds } },
      data: { issueId: null },
    });
  }

  const updated = await prisma.radarIssue.findUnique({
    where: { id },
    include: { items: { orderBy: { importance: "desc" } } },
  });

  return NextResponse.json(updated);
}
