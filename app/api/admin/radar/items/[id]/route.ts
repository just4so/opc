import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();

  const { id } = await params;

  const item = await prisma.radarItem.findUnique({
    where: { id },
    select: { issueId: true },
  });

  if (!item) {
    return NextResponse.json({ error: "条目不存在" }, { status: 404 });
  }

  if (item.issueId !== null) {
    return NextResponse.json({ error: "已收录条目不能删除" }, { status: 403 });
  }

  await prisma.radarItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
