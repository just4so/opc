import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/admin";

export async function GET(req: NextRequest) {
  await requireStaff();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  // No params: legacy behavior
  if (!status) {
    const items = await prisma.radarItem.findMany({
      orderBy: { collectedAt: "desc" },
      take: 20,
    });
    return NextResponse.json(items);
  }

  const where =
    status === "pending"
      ? { issueId: null }
      : { issueId: { not: null } };

  const orderBy =
    status === "pending"
      ? { importance: "desc" as const }
      : { collectedAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.radarItem.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { issue: { select: { issueNo: true } } },
    }),
    prisma.radarItem.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  await requireStaff();

  const body = await req.json();
  const { title, url, source, summary, category, city, publishedAt, importance } = body;

  if (!title || !url || !source || !category) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  try {
    const item = await prisma.radarItem.create({
      data: {
        id: crypto.randomUUID(),
        title,
        url,
        source,
        summary: summary || null,
        category,
        city: city || null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        importance: importance ?? 3,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === "P2002") {
      return NextResponse.json({ error: "该 URL 已存在" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
