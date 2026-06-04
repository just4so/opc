import Image from 'next/image'
import { ShareIcon } from './ShareIcon'
import { formatIssueShortLabel } from '@/lib/radar/serializeIssue'

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  policy:    { zh: "政策动向", en: "POLICY TRENDS" },
  community: { zh: "社区动态", en: "COMMUNITY NEWS" },
  event:     { zh: "活动赛事", en: "EVENTS" },
  case:      { zh: "实战案例", en: "CASE STUDIES" },
  opinion:   { zh: "新锐观点", en: "OPINIONS" },
  // 历史兼容
  content:   { zh: "实战案例", en: "CASE STUDIES" },
  media:     { zh: "实战案例", en: "CASE STUDIES" },
  resource:  { zh: "实战案例", en: "CASE STUDIES" },
  developer: { zh: "实战案例", en: "CASE STUDIES" },
};

const CATEGORY_ORDER = ["policy", "community", "event", "case", "content", "opinion"];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const FULLWIDTH_DIGITS: Record<string, string> = {
  "0": "○", "1": "一", "2": "二", "3": "三", "4": "四",
  "5": "五", "6": "六", "7": "七", "8": "八", "9": "九",
};

function toFullwidthYear(year: number): string {
  return String(year).split("").map(d => FULLWIDTH_DIGITS[d] ?? d).join("");
}

type RadarItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  category: string;
  city: string | null;
  publishedAt: string | null;
  importance: number;
};

type RadarIssue = {
  id: string;
  issueNo: number;
  title: string | null;
  summary: string | null;
  publishedAt: string;
  windowStart: string;
  windowEnd: string;
  grouped: Record<string, RadarItem[]>;
};

export function IssueView({ issue }: { issue: RadarIssue }) {
  const categories = CATEGORY_ORDER.filter(c => issue.grouped[c]?.length > 0);
  const totalItems = Object.values(issue.grouped).reduce((s, arr) => s + arr.length, 0);

  const pubDate = new Date(issue.publishedAt);
  const year = pubDate.getFullYear();
  const month = pubDate.getMonth() + 1;
  const day = pubDate.getDate();
  const weekday = WEEKDAYS[pubDate.getDay()];

  const volStr = `VOL.${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;

  return (
    <div className="w-full">
      {/* Hero header — logo + 期号 + meta */}
      <div className="relative mb-0 pt-10 pb-8 px-6 md:px-10 border-b-2 border-[#1C1917] flex flex-col items-center text-center">
        {/* 背景装饰数字 */}
        <div className="absolute right-8 top-4 text-[120px] font-black text-[#F5F0EB] leading-none select-none pointer-events-none">
          {formatIssueShortLabel(issue.issueNo, issue.title)}
        </div>

        {/* 顶部： wordmark logo */}
        <div className="flex justify-center mb-6 relative z-10">
          <Image
            src="/logo-wordmark.png"
            alt="OPC圈"
            width={180}
            height={36}
            className="opacity-90"
          />
        </div>

        {/* 主标题：前半段黑色，期号橙色 */}
        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-5 relative z-10">
          {(() => {
            const title = issue.title || `OPC 雷达 第 ${issue.issueNo} 期`
            // 匹配「第N期」或「5月第N期」等结尾，期号部分橙色
            const match = title.match(/^(.+?)(\d+月第\d+期|第\d+期)$/)
            if (match) {
              return (
                <>
                  <span className="text-[#1C1917]">{match[1]}</span>
                  <span className="text-[#F97316]">{match[2]}</span>
                </>
              )
            }
            return <span className="text-[#1C1917]">{title}</span>
          })()}
        </h1>

        {/* 日期 + 统计 */}
        <div className="flex justify-center items-center space-x-5 relative z-10 text-xs md:text-sm font-medium tracking-widest uppercase">
          <span className="text-[#1C1917] font-mono">{volStr}</span>
          <span className="text-[#D6D3D1] font-light">/</span>
          <span className="text-[#78716C]">星期{weekday}</span>
          <span className="text-[#D6D3D1] font-light">/</span>
          <span className="text-[#78716C] flex items-center">{totalItems} ITEMS
            <ShareIcon issueNo={issue.issueNo} title={issue.title || ''} summary={issue.summary || ''} />
          </span>
        </div>
      </div>

      
      {/* Summary section */}
      {issue.summary && (
        <div className="mx-6 md:mx-10 mt-8 mb-2 p-5 bg-[#FDF8F3] border-l-4 border-[#F97316] text-[#44403C]">
          <p className="text-sm leading-relaxed">{issue.summary}</p>
        </div>
      )}

      {/* Category sections */}
      {categories.map((cat, idx) => {
        const label = CATEGORY_LABELS[cat] ?? { zh: cat, en: cat.toUpperCase() };
        const items = issue.grouped[cat];
        return (
          <section key={cat} id={`cat-${cat}`} className="mb-12">
            {/* Section header */}
            <div className="flex items-end gap-4 mb-5 px-6 md:px-10 pt-10">
              <span className="text-5xl font-black text-[#F97316] leading-none">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#1C1917] leading-tight">{label.zh}</span>
                <span className="text-xs tracking-[0.2em] text-[#A8A29E]">{label.en}</span>
              </div>
              <div className="flex-1 border-b border-[#E7E5E4] mb-2 mx-2" />
              <span className="text-xs text-[#A8A29E] mb-2 shrink-0 font-mono">{items.length} ITEMS</span>
            </div>

            {/* Article cards */}
            <div className="space-y-0">
              {items.map(item => (
                <div
                  key={item.id}
                  className="border-b border-[#F5F0EB] py-5 px-6 md:px-10 hover:bg-[#FFF7ED] transition-colors relative group"
                >
                  {/* 左侧 hover 指示条 */}
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-2 flex-wrap">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-[#1C1917] hover:text-[#F97316] leading-snug"
                    >
                      {item.title}
                    </a>
                    {item.importance >= 4 && (
                      <span className="shrink-0 text-xs bg-[#F97316] text-white px-1.5 py-0.5 rounded font-medium">
                        重要
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-xs bg-[#FFF0E0] text-[#C2410C] px-1.5 py-0.5 rounded font-medium">
                      {item.source}
                    </span>
                    {item.city && (
                      <span className="text-xs text-[#78716C]">{item.city}</span>
                    )}
                    {item.publishedAt && (
                      <span className="text-xs text-[#78716C]">
                        {new Date(item.publishedAt).toLocaleDateString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  {item.summary && (
                    <p className="text-sm text-[#78716C] mt-2 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
