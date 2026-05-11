import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateIssue } from "@/lib/radar/generateIssue";
import { requireStaff } from "@/lib/admin";

export const maxDuration = 60;

export async function POST() {
  await requireStaff();

  const result = await generateIssue(prisma);

  if (!result) {
    return NextResponse.json(
      { error: "条目不足或分类覆盖不够，无法生成新一期" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    issueNo: result.issueNo,
    itemCount: result.itemCount,
    issueId: result.issueId,
    editorialRemoved: result.editorialRemoved,
  });
}
