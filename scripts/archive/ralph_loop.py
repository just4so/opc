#!/usr/bin/env python3
"""
Ralph Loop — OpenClaw 版任务状态管理器

用法：
  python3 ralph_loop.py --prd prd.json                                    # 获取下一个任务描述
  python3 ralph_loop.py --prd prd.json --status                          # 查看进度
  python3 ralph_loop.py --prd prd.json --mark-done US-001 --notes "..."  # 标记完成
  python3 ralph_loop.py --prd prd.json --mark-done US-001 --done-file /tmp/ralph_US-001_done.txt  # 从done文件提取经验
  python3 ralph_loop.py --prd prd.json --verify US-001                   # 验收检查
  python3 ralph_loop.py --prd prd.json --dry-run                         # 预览不改状态
  python3 ralph_loop.py --prd prd.json --archive                         # 归档当前 prd+progress
  python3 ralph_loop.py --prd prd.json --next-id                         # 输出下一个story的id
  python3 ralph_loop.py --prd prd.json --resume                          # 断点续跑摘要
"""

import json
import os
import re
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional


def load_prd(prd_path: str) -> dict:
    return json.loads(Path(prd_path).read_text(encoding="utf-8"))


def save_prd(prd: dict, prd_path: str):
    Path(prd_path).write_text(
        json.dumps(prd, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def get_next_story(prd: dict) -> Optional[dict]:
    """取最高优先级且 passes=false 的 story"""
    pending = [s for s in prd["userStories"] if not s.get("passes", False)]
    if not pending:
        return None
    return sorted(pending, key=lambda s: s.get("priority", 99))[0]


def get_parallel_stories(prd: dict) -> list:
    """取所有同优先级且 passes=false 的 story（可并行执行）"""
    pending = [s for s in prd["userStories"] if not s.get("passes", False)]
    if not pending:
        return []
    min_priority = min(s.get("priority", 99) for s in pending)
    return [s for s in pending if s.get("priority", 99) == min_priority]


def get_patterns(progress_path: Path) -> str:
    """从 progress.txt 提取 Codebase Patterns 部分"""
    if not progress_path.exists():
        return "（暂无历史经验）"
    text = progress_path.read_text(encoding="utf-8")
    if "## Codebase Patterns" not in text:
        return "（暂无历史经验）"
    start = text.index("## Codebase Patterns")
    end = text.find("\n---", start)
    return text[start:end].strip() if end > 0 else text[start:].strip()


def update_patterns(progress_path: Path, new_pattern: str):
    """把新经验追加到 Codebase Patterns 区域"""
    if not progress_path.exists() or not new_pattern.strip():
        return
    text = progress_path.read_text(encoding="utf-8")
    if "## Codebase Patterns" not in text:
        return
    marker = "（在此积累可复用发现，每次迭代前必读）"
    if marker in text:
        text = text.replace(marker, f"{marker}\n- {new_pattern.strip()}")
    else:
        # 在 Codebase Patterns 标题后追加
        idx = text.index("## Codebase Patterns") + len("## Codebase Patterns")
        text = text[:idx] + f"\n- {new_pattern.strip()}" + text[idx:]
    progress_path.write_text(text, encoding="utf-8")


def init_progress(progress_path: Path, project: str):
    """初始化 progress.txt（若不存在）"""
    if not progress_path.exists():
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        progress_path.write_text(
            f"# Ralph Progress Log\nStarted: {timestamp}\nProject: {project}\n\n"
            f"## Codebase Patterns\n（在此积累可复用发现，每次迭代前必读）\n\n---\n",
            encoding="utf-8",
        )


def append_progress(progress_path: Path, story: dict, notes: str):
    """追加本轮经验到 progress.txt"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = (
        f"\n## {timestamp} - {story['id']}\n"
        f"**标题：** {story['title']}\n"
        f"**经验教训：**\n{notes}\n"
        f"---\n"
    )
    with progress_path.open("a", encoding="utf-8") as f:
        f.write(entry)


def parse_done_file(done_path: str) -> dict:
    """解析子Agent的done文件，提取经验教训"""
    p = Path(done_path)
    if not p.exists():
        return {"ok": False, "error": f"文件不存在: {done_path}"}
    text = p.read_text(encoding="utf-8")
    result = {"ok": "DONE" in text.upper() or "完成" in text, "raw": text}

    # 尝试多种格式提取经验
    lessons = ""
    # 格式1: "经验教训: ..."
    for marker in ["经验教训:", "经验教训：", "经验:", "经验：", "Lessons:"]:
        if marker in text:
            idx = text.index(marker) + len(marker)
            end = len(text)
            for stop in ["修改文件:", "修改文件：", "实现内容:", "实现内容：", "\n## ", "\n---"]:
                pos = text.find(stop, idx)
                if 0 < pos < end:
                    end = pos
            lessons = text[idx:end].strip()
            break

    # 格式2: "关键发现" / "主要发现" / "核心发现" 作为降级
    if not lessons:
        for marker in ["关键发现:", "关键发现：", "主要发现:", "主要发现：", "核心发现:", "核心发现：",
                       "关键发现\n", "主要发现\n", "核心发现\n"]:
            if marker in text:
                idx = text.index(marker) + len(marker)
                # 取接下来最多300字
                snippet = text[idx:idx + 300].strip()
                # 取到空行或下一个标题
                for stop in ["\n\n", "\n## ", "\n---"]:
                    pos = snippet.find(stop)
                    if pos > 0:
                        snippet = snippet[:pos]
                lessons = snippet.strip()
                break

    # 格式3: "政策亮点" 作为最后降级
    if not lessons:
        for marker in ["政策亮点:", "政策亮点：", "亮点:"]:
            if marker in text:
                idx = text.index(marker) + len(marker)
                snippet = text[idx:idx + 200].strip()
                pos = snippet.find("\n\n")
                if pos > 0:
                    snippet = snippet[:pos]
                lessons = snippet.strip()
                break

    if lessons:
        result["lessons"] = lessons
    return result


def verify_story(story: dict) -> list:
    """自动验收：检查验收标准中的文件存在性和字数要求"""
    issues = []
    for criterion in story.get("acceptanceCriteria", []):
        # 检查文件路径（匹配含空格和中文的路径）
        path_match = re.search(r'(/[\w/\.\-\u4e00-\u9fff ]+\.(md|json|txt|csv))', criterion)
        if path_match:
            fpath = path_match.group(1)
            if not Path(fpath).exists():
                issues.append(f"文件不存在: {fpath}")
            else:
                # 检查字数要求
                size_match = re.search(r'>(\d+)字', criterion)
                if size_match:
                    min_chars = int(size_match.group(1))
                    actual = len(Path(fpath).read_text(encoding="utf-8"))
                    if actual < min_chars:
                        issues.append(f"字数不足: {fpath} 实际{actual}字 < 要求{min_chars}字")
    return issues


def archive_run(prd_path: str, prd: dict):
    """归档当前 prd.json + progress.txt"""
    prd_p = Path(prd_path)
    progress_p = prd_p.parent / "progress.txt"
    branch = prd.get("branchName", "unknown").replace("ralph/", "")
    date_str = datetime.now().strftime("%Y-%m-%d")
    archive_dir = prd_p.parent / "archive" / f"{date_str}-{branch}"
    archive_dir.mkdir(parents=True, exist_ok=True)

    if prd_p.exists():
        shutil.copy2(prd_p, archive_dir / "prd.json")
    if progress_p.exists():
        shutil.copy2(progress_p, archive_dir / "progress.txt")
        # 重置 progress.txt
        init_progress(progress_p, prd.get("project", "未命名"))

    print(f"📦 已归档到: {archive_dir}")


def build_task(story: dict, prd: dict, progress_path: Path) -> str:
    """构造子 Agent 的任务描述字符串"""
    criteria = "\n".join(f"- {c}" for c in story.get("acceptanceCriteria", []))
    patterns = get_patterns(progress_path)
    sid = story["id"]

    return (
        f"你是一个自主执行任务的 Agent，完成以下任务后退出。\n\n"
        f"## 项目背景\n{prd.get('description', '（无描述）')}\n\n"
        f"## 当前任务：{sid} — {story['title']}\n{story.get('description', '')}\n\n"
        f"## 验收标准（全部满足才算完成）\n{criteria}\n\n"
        f"## 历史经验（先读，避免踩坑）\n{patterns}\n\n"
        f"## 搜索降级策略\n"
        f"如果 web_search 失败：\n"
        f"1. 尝试用 exec 运行 tavily 搜索脚本：`source /Users/wei/Documents/aidoc/.env && node ~/.openclaw/skills/tavily-search-1.0.0/scripts/search.mjs \"关键词\"`\n"
        f"2. 若仍失败，在报告中标注「⚠️ 仅基于笔记数据，未补充网络信息」\n"
        f"3. 不要因搜索失败而停止任务\n\n"
        f"## 完成要求\n"
        f"1. 实现所有验收标准\n"
        f"2. 如果修改了代码文件，检查对应目录有无 AGENTS.md，有则追加你发现的可复用经验\n"
        f"3. 将结果写入 `/tmp/ralph_{sid}_done.txt`，格式：\n"
        f"   DONE: {sid}\n"
        f"   实现内容: <做了什么>\n"
        f"   修改文件: <路径列表>\n"
        f"   经验教训: <1-2条可复用发现，供后续迭代参考>\n"
        f"4. 打印 \"DONE: {sid}\"\n"
    )


def print_status(prd: dict):
    stories = prd["userStories"]
    done = sum(1 for s in stories if s.get("passes"))
    total = len(stories)
    print(f"\n📊 进度: {done}/{total} 完成")
    for s in sorted(stories, key=lambda x: x.get("priority", 99)):
        icon = "✅" if s.get("passes") else "⏳"
        stype = f" [{s['type']}]" if s.get("type") else ""
        note = f"  ({s['notes']})" if s.get("notes") else ""
        print(f"  {icon} [{s['id']}]{stype} {s['title']}{note}")


def print_resume(prd: dict, prd_path: str):
    """断点续跑摘要：帮助主Agent在context丢失后恢复"""
    stories = prd["userStories"]
    done = [s for s in stories if s.get("passes")]
    pending = [s for s in stories if not s.get("passes")]
    total = len(stories)

    print(f"🔄 Ralph Loop 断点续跑摘要")
    print(f"项目: {prd.get('project', '未知')}")
    print(f"PRD: {prd_path}")
    print(f"进度: {len(done)}/{total} 完成\n")

    if done:
        print("已完成:")
        for s in done:
            print(f"  ✅ [{s['id']}] {s['title']}")

    if pending:
        print("\n待执行:")
        parallel = get_parallel_stories(prd)
        parallel_ids = {s["id"] for s in parallel}
        for s in sorted(pending, key=lambda x: x.get("priority", 99)):
            marker = " ← 下一个" if s["id"] in parallel_ids else ""
            stype = f" [{s.get('type', 'agent')}]" if s.get("type") else ""
            print(f"  ⏳ [{s['id']}]{stype} {s['title']}{marker}")

        # 检查是否有done文件未被标记
        print("\n未标记的完成文件:")
        found_unmarked = False
        for s in pending:
            done_file = Path(f"/tmp/ralph_{s['id']}_done.txt")
            if done_file.exists():
                found_unmarked = True
                print(f"  ⚠️ {done_file} 存在但 {s['id']} 未标记完成！")
        if not found_unmarked:
            print("  （无）")

        if len(parallel) > 1:
            print(f"\n💡 可并行: {', '.join(s['id'] for s in parallel)}（同优先级）")

    if not pending:
        print("\n🎉 所有任务已完成！只差最终确认。")


def main():
    parser = argparse.ArgumentParser(description="Ralph Loop 任务状态管理器")
    parser.add_argument("--prd", default="prd.json", help="prd.json 路径")
    parser.add_argument("--max", type=int, default=20, help="最大迭代次数")
    parser.add_argument("--dry-run", action="store_true", help="只打印任务描述，不修改任何文件")
    parser.add_argument("--status", action="store_true", help="只显示当前进度")
    parser.add_argument("--mark-done", metavar="STORY_ID", help="标记指定 story 为完成")
    parser.add_argument("--notes", default="", help="配合 --mark-done 传入本轮经验教训")
    parser.add_argument("--done-file", default="", help="配合 --mark-done，从子Agent的done文件自动提取经验")
    parser.add_argument("--archive", action="store_true", help="归档当前 prd.json + progress.txt")
    parser.add_argument("--next-id", action="store_true", help="只输出下一个待执行 story 的 id")
    parser.add_argument("--verify", metavar="STORY_ID", help="验收检查指定 story")
    parser.add_argument("--resume", action="store_true", help="断点续跑摘要")
    args = parser.parse_args()

    prd = load_prd(args.prd)
    progress_path = Path(args.prd).parent / "progress.txt"
    init_progress(progress_path, prd.get("project", "未命名项目"))

    if args.status:
        print_status(prd)
        return

    if args.resume:
        print_resume(prd, args.prd)
        return

    if args.archive:
        archive_run(args.prd, prd)
        return

    if args.next_id:
        story = get_next_story(prd)
        print(story["id"] if story else "ALL_DONE")
        return

    if args.verify:
        story = next((s for s in prd["userStories"] if s["id"] == args.verify), None)
        if not story:
            print(f"❌ 未找到 story: {args.verify}")
            return
        issues = verify_story(story)
        if issues:
            print(f"❌ 验收失败 [{args.verify}]:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"✅ 验收通过 [{args.verify}]")
        return

    if args.mark_done:
        # 如果提供了 done-file，先从中提取经验
        notes = args.notes
        extracted_lessons = ""
        if args.done_file:
            parsed = parse_done_file(args.done_file)
            if not parsed["ok"]:
                print(f"⚠️ done文件异常: {parsed.get('error', '未找到DONE标记')}")
            extracted_lessons = parsed.get("lessons", "")
            if not notes and extracted_lessons:
                notes = extracted_lessons

        # 自动验收
        story = next((s for s in prd["userStories"] if s["id"] == args.mark_done), None)
        if not story:
            print(f"❌ 未找到 story: {args.mark_done}")
            return

        issues = verify_story(story)
        if issues:
            print(f"⚠️ 验收有问题（仍会标记完成）:")
            for issue in issues:
                print(f"  - {issue}")

        story["passes"] = True
        if notes:
            story["notes"] = notes[:500]
        print(f"✅ 已标记 {args.mark_done} 为完成")

        save_prd(prd, args.prd)
        if notes:
            append_progress(progress_path, story, notes)
        # 把经验提炼到 Codebase Patterns
        if extracted_lessons:
            update_patterns(progress_path, extracted_lessons)

        print_status(prd)
        return

    # 默认：获取下一个任务
    story = get_next_story(prd)
    if not story:
        print("🎉 所有任务已完成！")
        print_status(prd)
        return

    task = build_task(story, prd, progress_path)

    if args.dry_run:
        print("=" * 60)
        print(f"[DRY RUN] 下一个任务: {story['id']} — {story['title']}")
        print("=" * 60)
        print(task)
        print_status(prd)
        return

    # 正常输出
    print(f"🚀 下一个任务: {story['id']} — {story['title']}\n")
    print(task)


if __name__ == "__main__":
    main()
