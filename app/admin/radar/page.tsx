"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const CATEGORIES = [
  { value: "policy", label: "政策" },
  { value: "community", label: "社区" },
  { value: "event", label: "活动" },
  { value: "resource", label: "资源" },
  { value: "content", label: "内容" },
];

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
  issueId: string | null;
  collectedAt: string;
  issue?: { issueNo: number } | null;
};

type Stats = {
  pending: number;
  published: number;
  cbArchive: number;
  lastRunAt: string | null;
};

type RadarRun = {
  id: string;
  createdAt: string;
  source: string;
  collected: number;
  skipped: number;
  error: string | null;
};

type ItemsResponse = {
  items: RadarItem[];
  total: number;
  page: number;
  pageSize: number;
};

type RadarIssue = {
  id: string;
  issueNo: number;
  publishedAt: string;
  _count: { items: number };
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export default function AdminRadarPage() {
  const [form, setForm] = useState({
    title: "",
    url: "",
    source: "",
    summary: "",
    category: "community",
    city: "",
    publishedAt: "",
    importance: "3",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);

  // Items tab
  const [activeTab, setActiveTab] = useState<"pending" | "published">("pending");
  const [itemsData, setItemsData] = useState<ItemsResponse | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Runs log
  const [runs, setRuns] = useState<RadarRun[]>([]);

  // Issues list
  const [issues, setIssues] = useState<RadarIssue[]>([]);

  // Collect
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectMessage, setCollectMessage] = useState("");

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/radar/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchItems = useCallback(async (tab: "pending" | "published", page: number) => {
    setItemsLoading(true);
    const status = tab === "pending" ? "pending" : "published";
    const res = await fetch(`/api/admin/radar/items?status=${status}&page=${page}`);
    if (res.ok) setItemsData(await res.json());
    setItemsLoading(false);
  }, []);

  const fetchRuns = useCallback(async () => {
    const res = await fetch("/api/admin/radar/runs");
    if (res.ok) setRuns(await res.json());
  }, []);

  const fetchIssues = useCallback(async () => {
    const res = await fetch("/api/admin/radar/issues");
    if (res.ok) setIssues(await res.json());
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRuns();
    fetchIssues();
  }, [fetchStats, fetchRuns, fetchIssues]);

  useEffect(() => {
    fetchItems(activeTab, itemsPage);
  }, [activeTab, itemsPage, fetchItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/radar/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          importance: parseInt(form.importance),
          publishedAt: form.publishedAt || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("保存成功");
        setForm({ title: "", url: "", source: "", summary: "", category: "community", city: "", publishedAt: "", importance: "3" });
        fetchStats();
        if (activeTab === "pending") fetchItems("pending", itemsPage);
      } else {
        setMessage(data.error || "保存失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/radar/generate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`生成成功：第 ${data.issueNo} 期，共 ${data.itemCount} 条`);
        fetchStats();
        fetchItems(activeTab, itemsPage);
        fetchIssues();
      } else {
        setMessage(data.error || "生成失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleCollect() {
    setCollectLoading(true);
    setCollectMessage("");
    try {
      const res = await fetch("/api/admin/radar/collect", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCollectMessage(`采集完成：新增 ${data.collected} 条，跳过 ${data.skipped} 条（重复）`);
        fetchStats();
        fetchRuns();
        if (activeTab === "pending") fetchItems("pending", 1);
      } else {
        setCollectMessage(data.error || "采集失败");
      }
    } catch {
      setCollectMessage("网络错误");
    } finally {
      setCollectLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除这条待发布条目？")) return;
    const res = await fetch(`/api/admin/radar/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchStats();
      fetchItems(activeTab, itemsPage);
    } else {
      const data = await res.json();
      alert(data.error || "删除失败");
    }
  }

  const totalPages = itemsData ? Math.ceil(itemsData.total / itemsData.pageSize) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">录入雷达条目</h1>

      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-4 text-sm text-[#78716C] mb-6">
          <span>待发布 <strong className="text-[#1C1917]">{stats.pending}</strong> 条</span>
          <span className="text-gray-300">|</span>
          <span>已入期 <strong className="text-[#1C1917]">{stats.published}</strong> 条</span>
          <span className="text-gray-300">|</span>
          <span>中经报备用库 <strong className="text-[#1C1917]">{stats.cbArchive ?? 0}</strong> 篇</span>
          <span className="text-gray-300">|</span>
          <span>上次采集 <strong className="text-[#1C1917]">{stats.lastRunAt ? relativeTime(stats.lastRunAt) : "从未"}</strong></span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-6 mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题 *</label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">来源 *</label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL *</label>
          <input
            required
            type="url"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">摘要</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">分类 *</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">城市</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">发布日期</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.publishedAt}
              onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">重要性 (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={form.importance}
              onChange={e => setForm(f => ({ ...f, importance: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            保存条目
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="border border-black px-6 py-2 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            生成一期雷达
          </button>
          <button
            type="button"
            onClick={handleCollect}
            disabled={collectLoading}
            className="border border-[#F97316] text-[#F97316] px-6 py-2 rounded text-sm hover:bg-orange-50 disabled:opacity-50"
          >
            {collectLoading ? "采集中…" : "立即采集"}
          </button>
          {message && (
            <span className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
          {collectMessage && (
            <span className={`text-sm ${collectMessage.includes("完成") ? "text-green-600" : "text-red-600"}`}>
              {collectMessage}
            </span>
          )}
        </div>
      </form>

      {/* Items tabs */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => { setActiveTab("pending"); setItemsPage(1); }}
          className={`text-sm font-medium pb-1 border-b-2 ${activeTab === "pending" ? "border-[#F97316] text-[#F97316]" : "border-transparent text-[#78716C] hover:text-[#1C1917]"}`}
        >
          待发布
        </button>
        <button
          onClick={() => { setActiveTab("published"); setItemsPage(1); }}
          className={`text-sm font-medium pb-1 border-b-2 ${activeTab === "published" ? "border-[#F97316] text-[#F97316]" : "border-transparent text-[#78716C] hover:text-[#1C1917]"}`}
        >
          已收录
        </button>
        {itemsData && (
          <span className="text-xs text-[#78716C] ml-auto">共 {itemsData.total} 条</span>
        )}
      </div>

      <div className="space-y-2 min-h-[100px]">
        {itemsLoading && <p className="text-gray-400 text-sm">加载中…</p>}
        {!itemsLoading && itemsData?.items.length === 0 && (
          <p className="text-gray-400 text-sm">暂无条目</p>
        )}
        {!itemsLoading && itemsData?.items.map(item => (
          <div key={item.id} className="border border-gray-200 rounded p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                </span>
                {item.city && <span className="text-xs text-[#78716C]">{item.city}</span>}
                <span className="text-xs text-[#78716C]">重要性 {item.importance}</span>
                {item.issue && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    已收录 #{item.issue.issueNo}期
                  </span>
                )}
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">
                {item.title}
              </a>
              <p className="text-xs text-[#78716C] mt-0.5">
                {item.source} · {new Date(item.collectedAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
            {activeTab === "pending" && (
              <button
                onClick={() => handleDelete(item.id)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded shrink-0"
              >
                删除
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {itemsData && itemsData.total > itemsData.pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#78716C]">
          <button
            disabled={itemsPage <= 1}
            onClick={() => setItemsPage(p => p - 1)}
            className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span>第 {itemsPage} 页，共 {itemsData.total} 条</span>
          <button
            disabled={itemsPage >= totalPages}
            onClick={() => setItemsPage(p => p + 1)}
            className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}

      {/* Runs log */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">采集日志</h2>
        {runs.length === 0 && <p className="text-gray-400 text-sm">暂无采集记录</p>}
        <div className="space-y-2">
          {runs.map(run => (
            <div key={run.id} className="border border-gray-200 rounded p-3 text-sm flex items-start gap-4">
              <span className="text-[#78716C] shrink-0">{relativeTime(run.createdAt)}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded shrink-0">{run.source}</span>
              <span className="text-[#1C1917]">新增 {run.collected} 条 / 跳过 {run.skipped} 条</span>
              {run.error && (
                <span className="text-red-500 text-xs truncate">{run.error}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Published issues */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">已发布期刊</h2>
        {issues.length === 0 && <p className="text-gray-400 text-sm">暂无已发布期刊</p>}
        <div className="space-y-2">
          {issues.map(issue => (
            <div key={issue.id} className="border border-gray-200 rounded p-3 text-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="font-medium text-[#1C1917]">第 {issue.issueNo} 期</span>
                <span className="text-[#78716C]">{new Date(issue.publishedAt).toLocaleDateString("zh-CN")}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{issue._count.items} 条</span>
              </div>
              <Link
                href={`/admin/radar/issues/${issue.id}/edit`}
                className="text-xs text-[#F97316] hover:underline border border-[#F97316] px-3 py-1 rounded"
              >
                编辑
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
