import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { collectRssFeeds, collectTier3, type RadarRawItem } from "@/lib/radar/rssProvider";
import { getAIClient, judgeItem, isTooOld } from "@/lib/radar/aiJudge";
import { requireStaff } from "@/lib/admin";
import { FILTER_KEYWORDS } from "@/config/search-queries";

export const maxDuration = 60;

const SOURCE_BLOCKLIST = [
  "facebook.com",
  "baike.baidu.com",
  "bendibao.com",
  "taogongwei.com",
];

export async function POST() {
  await requireStaff();

  let collected = 0;
  let skipped = 0;
  let tooOldCount = 0;
  let runError: string | undefined;

  try {
    const aiClient = getAIClient();

    // Tier 1 + 2 RSS
    const rssResult = await collectRssFeeds({
      tiers: [1, 2],
      maxPerSource: 20,
      concurrency: 6,
      minPublishedDays: 7,
    });

    // Tier 3 with keyword filter
    const tier3Items = await collectTier3(FILTER_KEYWORDS);

    const allItems: RadarRawItem[] = [...rssResult.items, ...tier3Items];

    const filtered = allItems.filter((item) => {
      try {
        const hostname = new URL(item.url).hostname;
        if (SOURCE_BLOCKLIST.some((b) => hostname.includes(b))) return false;
      } catch {
        return false;
      }
      if (item.tier <= 2) return true;
      const text = `${item.title} ${item.content}`;
      return FILTER_KEYWORDS.some((kw) => text.includes(kw));
    });

    for (const item of filtered) {
      // 时间硬过滤：超过 30 天的旧文直接丢弃
      if (isTooOld(item.publishedAt, null)) {
        tooOldCount++; skipped++; continue;
      }

      // URL 去重
      const existsByUrl = await prisma.radarItem.findFirst({ where: { url: item.url }, select: { id: true } });
      if (existsByUrl) { skipped++; continue; }
      // 标题去重
      const existsByTitle = await prisma.radarItem.findFirst({ where: { title: item.title }, select: { id: true } });
      if (existsByTitle) { skipped++; continue; }

      if (!aiClient) {
        // No AI: 降级入库
        try {
          await prisma.radarItem.create({
            data: {
              title: item.title,
              url: item.url,
              source: item.source,
              publishedAt: item.publishedAt,
              category: item.category ?? "content",
              importance: 2,
            },
          });
          collected++;
        } catch {
          skipped++;
        }
        continue;
      }

      // AI 判断
      const publishedDateStr = item.publishedAt?.toISOString().slice(0, 10);
      const aiResult = await judgeItem(aiClient, {
        title: item.title,
        content: item.content,
        url: item.url,
        publishedAt: publishedDateStr,
        baseImportanceBonus: item.baseImportanceBonus,
      });

      if (!aiResult.relevant) { skipped++; continue; }

      // AI 返回 estimated_date 后再做一次时间过滤
      if (isTooOld(item.publishedAt, aiResult.estimated_date)) {
        tooOldCount++; skipped++; continue;
      }

      let importance = Math.max(1, Math.min(5, aiResult.importance ?? 3));
      if (!aiResult.is_recent && importance > 2) importance = 2;

      // 解析最终发布时间
      let finalPublishedAt = item.publishedAt;
      if (!finalPublishedAt && aiResult.estimated_date) {
        const d = new Date(aiResult.estimated_date);
        finalPublishedAt = isNaN(d.getTime()) ? null : d;
      }
      // 没有任何时间信息的条目不入库
      if (!finalPublishedAt) { skipped++; continue; }

      try {
        await prisma.radarItem.create({
          data: {
            title: item.title,
            url: item.url,
            source: item.source,
            publishedAt: finalPublishedAt,
            summary: aiResult.summary ?? null,
            category: aiResult.category ?? item.category ?? "content",
            city: aiResult.city ?? null,
            importance,
            eventKey: null,  // 入库时不再由 AI 生成，出刊时统一做重复判断
          },
        });
        collected++;
      } catch {
        skipped++;
      }
    }
  } catch (err) {
    runError = err instanceof Error ? err.message : String(err);
  }

  // 写 RadarRun 记录
  const radarRun = await prisma.radarRun.create({
    data: {
      source: "admin-manual",
      collected,
      skipped,
      error: runError ?? null,
    },
  });

  if (runError) {
    return NextResponse.json({ error: runError, runId: radarRun.id }, { status: 500 });
  }

  return NextResponse.json({ collected, skipped, tooOld: tooOldCount, runId: radarRun.id });
}
