"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type IssueItem = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  source: string;
};

type IssueDetail = {
  id: string;
  issueNo: number;
  publishedAt: string;
  items: IssueItem[];
};

type EditableItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  removed: boolean;
};

export default function IssueEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/admin/radar/issues/${id}`)
      .then(r => r.json())
      .then((data: IssueDetail) => {
        setIssue(data);
        setItems(data.items.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary ?? "",
          category: item.category,
          source: item.source,
          removed: false,
        })));
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const activeItems = items.filter(i => !i.removed);
      const removeIds = items.filter(i => i.removed).map(i => i.id);

      const res = await fetch(`/api/admin/radar/issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: activeItems.map(i => ({ id: i.id, title: i.title, summary: i.summary || null })),
          removeIds,
        }),
      });

      if (res.ok) {
        setMessage("保存成功");
      } else {
        const data = await res.json();
        setMessage(data.error || "保存失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-gray-400 text-sm">加载中…</div>;
  }

  if (!issue) {
    return <div className="text-red-500 text-sm">期刊不存在</div>;
  }

  const activeItems = items.filter(i => !i.removed);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#78716C] hover:text-[#1C1917]"
        >
          ← 返回
        </button>
        <h1 className="text-2xl font-bold">
          编辑第 {issue.issueNo} 期
        </h1>
        <span className="text-sm text-[#78716C]">
          {new Date(issue.publishedAt).toLocaleDateString("zh-CN")}
        </span>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
          {activeItems.length} 条
        </span>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 ${item.removed ? "opacity-40 bg-gray-50" : "border-gray-200 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.category}</span>
                <span className="text-xs text-[#78716C]">{item.source}</span>
              </div>
              <button
                onClick={() => setItems(prev => prev.map((it, i) => i === idx ? { ...it, removed: !it.removed } : it))}
                className={`text-xs px-3 py-1 rounded border shrink-0 ${
                  item.removed
                    ? "border-green-300 text-green-600 hover:bg-green-50"
                    : "border-red-200 text-red-500 hover:border-red-400 hover:text-red-700"
                }`}
              >
                {item.removed ? "恢复" : "移除"}
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">标题</label>
                <input
                  disabled={item.removed}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-50"
                  value={item.title}
                  onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">摘要</label>
                <textarea
                  disabled={item.removed}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-50"
                  value={item.summary}
                  onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, summary: e.target.value } : it))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#F97316] text-white px-6 py-2 rounded text-sm hover:bg-[#EA6C0A] disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存修改"}
        </button>
        {message && (
          <span className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
