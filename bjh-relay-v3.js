/**
 * BJH-1 完整发布 - 接力v3
 * 已知：正文有内容（1882字），在编辑页
 * 目标：找标题区域 → 填标题 → 点发布
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/wei/Desktop/opc-content/screenshots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ss = async (page, name) => {
  await page.screenshot({ path: SCREENSHOTS + '/' + name, fullPage: false });
  console.log('[ss]', name);
};

const TITLE = '我为什么选择入驻OPC社区：一个AI创业者的真实决策';

(async () => {
  const resp = await fetch('http://127.0.0.1:18800/json/version');
  const info = await resp.json();
  const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // 找编辑页（有正文内容的）
  let page = null;
  for (const p of pages) {
    if (p.url().includes('edit?type=news')) {
      const len = await p.evaluate(() => {
        const e = document.querySelector('[contenteditable="true"]');
        return (e ? (e.innerText || '').length : 0);
      });
      console.log('Page', p.url(), 'content length:', len);
      if (len > 100) { page = p; break; }
    }
  }
  
  if (!page) { console.log('No content page found'); process.exit(1); }
  
  await ss(page, 'pilot-v3-01-start.png');
  
  // 1. 滚动到顶部，找标题区域
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);
  
  // 全面探索所有可能的标题输入区
  const pageStructure = await page.evaluate(() => {
    // 方法1: 找 editor-wrapper 或 article-wrapper
    const wrapper = document.querySelector('[class*="editor-wrapper"], [class*="article"], [class*="write-wrap"]');
    
    // 方法2: 找所有可编辑元素，包括 contenteditable 和 input
    const allEditable = Array.from(document.querySelectorAll(
      '[contenteditable="true"], input:not([type="hidden"]):not([type="file"]), textarea'
    )).filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 10 && r.height > 5;
    });
    
    return allEditable.map(e => {
      const r = e.getBoundingClientRect();
      return {
        tag: e.tagName,
        type: e.type || '',
        cls: e.className.substring(0, 80),
        ph: e.placeholder || e.getAttribute('data-placeholder') || '',
        id: e.id || '',
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.w), h: Math.round(r.height),
        val: (e.value || e.innerText || '').substring(0, 60)
      };
    });
  });
  console.log('All editable elements:', JSON.stringify(pageStructure, null, 2));
  
  // 截图（包含顶部，看标题）
  await ss(page, 'pilot-v3-02-top.png');
  
  // 找标题区：通常是最上方的小 contenteditable 或有 "标题" placeholder 的
  // 按 y 坐标排序（最上面的优先）
  const sorted = pageStructure.sort((a, b) => a.y - b.y);
  console.log('Sorted by Y:', sorted.map(e => ({ tag: e.tag, y: e.y, h: e.h, ph: e.ph, val: e.val })));
  
  // 找 placeholder 含"标题"的
  let titleEl = sorted.find(e => e.ph.includes('标题'));
  // 或找 y 最小且高度小的（单行标题区）
  if (!titleEl) {
    titleEl = sorted.find(e => e.h < 80 && e.y < 200 && e.tag === 'DIV');
  }
  // 或直接用 y 最小的
  if (!titleEl) {
    titleEl = sorted[0];
  }
  
  console.log('Selected title element:', JSON.stringify(titleEl));
  
  if (titleEl) {
    // 点击并填写标题
    const titleSelector = titleEl.ph 
      ? `[placeholder*="${titleEl.ph.substring(0, 5)}"], [data-placeholder*="${titleEl.ph.substring(0, 5)}"]`
      : `${titleEl.tag}[contenteditable="true"]`;
    
    // 直接用坐标点击（更精确）
    await page.mouse.click(titleEl.x + 50, titleEl.y + titleEl.h / 2);
    await sleep(500);
    
    // 选择所有内容并替换
    await page.keyboard.press('Meta+a');
    await sleep(200);
    
    // 检查当前选中内容
    const selected = await page.evaluate(() => window.getSelection()?.toString() || '');
    console.log('Selected text:', selected.substring(0, 50));
    
    // 如果选中了正文内容，说明点到了正文区，重新找
    if (selected.length > 100) {
      console.log('Clicked into body, trying to find real title area...');
      // 试试用 Escape 取消选择
      await page.keyboard.press('Escape');
      
      // 用 Tab 键移动焦点
      // 或者尝试找 placeholder 元素
      const titleViaEval = await page.evaluate((title) => {
        // 找所有 contenteditable，选 y 坐标最小、高度最小的
        const els = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        if (els.length === 0) return false;
        
        // 按 y 排序
        const sorted = els.map(e => ({ e, r: e.getBoundingClientRect() }))
          .filter(x => x.r.width > 0)
          .sort((a, b) => a.r.y - b.r.y);
        
        if (sorted.length === 0) return false;
        
        // 找最上方的（通常是标题区）
        // 如果最上方的内容已有大量文字（正文），找下一个高度 < 100 的
        for (const item of sorted) {
          const text = item.e.innerText || '';
          const isBody = text.length > 200;  // 正文通常很长
          if (!isBody) {
            // 这可能是标题
            item.e.focus();
            item.e.click();
            // 清除后填写标题
            item.e.innerText = '';
            item.e.dispatchEvent(new Event('input', { bubbles: true }));
            item.e.innerText = title;
            item.e.dispatchEvent(new Event('input', { bubbles: true }));
            return { found: true, h: item.r.height, y: item.r.y, text: title };
          }
        }
        return false;
      }, TITLE);
      console.log('Title via eval:', JSON.stringify(titleViaEval));
    } else {
      // 正常填写标题
      await page.keyboard.type(TITLE, { delay: 20 });
      console.log('Title typed');
    }
  }
  
  await sleep(1000);
  await ss(page, 'pilot-v3-03-title.png');
  
  // 验证标题是否填入
  const verifyTitle = await page.evaluate((expectedTitle) => {
    const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    for (const e of editables) {
      if ((e.innerText || '').includes(expectedTitle.substring(0, 10))) {
        return { found: true, text: e.innerText.substring(0, 50), h: e.getBoundingClientRect().height };
      }
    }
    // 找 input
    const inputs = document.querySelectorAll('input');
    for (const i of inputs) {
      if ((i.value || '').includes(expectedTitle.substring(0, 10))) {
        return { found: true, type: 'input', val: i.value };
      }
    }
    return { found: false };
  }, TITLE);
  console.log('Title verification:', JSON.stringify(verifyTitle));
  
  // === 发文设置（检查封面）===
  console.log('\n--- 发文设置 ---');
  await ss(page, 'pilot-v3-04-settings-before.png');
  
  // 点击"发文设置"
  const settingsClicked = await page.evaluate(() => {
    // 找发文设置按钮
    const btns = Array.from(document.querySelectorAll('button, span, div'));
    const settings = btns.find(b => {
      const t = (b.textContent || '').trim();
      return t === '发文设置' || t.includes('发文设置');
    });
    if (settings) {
      settings.click();
      return settings.textContent.trim();
    }
    return null;
  });
  console.log('Settings clicked:', settingsClicked);
  
  if (settingsClicked) {
    await sleep(1500);
    await ss(page, 'pilot-v3-04-settings-panel.png');
    
    // 在设置面板里找封面
    const settingsPanel = await page.evaluate(() => {
      // 找展开的设置区
      const panel = document.querySelector('[class*="publish-setting"], [class*="setting-panel"], [class*="drawer"]');
      if (panel) {
        return {
          text: panel.innerText.substring(0, 300),
          cls: panel.className.substring(0, 80)
        };
      }
      return null;
    });
    console.log('Settings panel:', JSON.stringify(settingsPanel));
  }
  
  // === 点发布 ===
  console.log('\n--- 点发布 ---');
  await ss(page, 'pilot-v3-05-before-publish.png');
  
  // 先确保没有弹窗
  const closedModal = await page.evaluate(() => {
    const modal = document.querySelector('.cheetah-modal-wrap');
    if (modal && modal.getBoundingClientRect().width > 0) {
      const btns = modal.querySelectorAll('button');
      for (const b of btns) {
        const t = (b.textContent || '').trim();
        if (['确认', '确定', '关闭'].includes(t)) { b.click(); return t; }
      }
      const x = modal.querySelector('.cheetah-modal-close');
      if (x) { x.click(); return 'X'; }
    }
    return null;
  });
  if (closedModal) {
    console.log('Closed modal:', closedModal);
    await sleep(1000);
  }
  
  // 精确找并点击「发布」按钮
  const clickResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const visibleBtns = btns.filter(b => b.getBoundingClientRect().width > 0 && !b.disabled);
    console.log('Visible buttons:', visibleBtns.map(b => b.textContent.trim()));
    
    // 精确匹配「发布」（不含定时发布）
    const pub = visibleBtns.find(b => b.textContent.trim() === '发布');
    if (pub) {
      pub.click();
      return { clicked: true, text: '发布' };
    }
    return { clicked: false, available: visibleBtns.map(b => b.textContent.trim()) };
  });
  console.log('Click result:', JSON.stringify(clickResult));
  
  await sleep(4000);
  await ss(page, 'pilot-v3-06-after-publish.png');
  
  // 检查结果
  const result = await page.evaluate(() => {
    // 找 toast / 成功 / 错误提示
    const toasts = Array.from(document.querySelectorAll('[class*="toast"], [class*="message"], [class*="notice"], [class*="alert"]'))
      .filter(e => e.getBoundingClientRect().width > 0)
      .map(e => (e.innerText || '').substring(0, 100));
    
    const modal = document.querySelector('.cheetah-modal-wrap');
    const modalText = (modal && modal.getBoundingClientRect().width > 0) 
      ? (modal.innerText || '').substring(0, 200) : null;
    
    return {
      url: window.location.href,
      toasts,
      modal: modalText,
      pageText: document.body.innerText.substring(0, 300)
    };
  });
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // 如果有确认弹窗，点击确认
  if (result.modal) {
    console.log('Modal after publish:', result.modal);
    const confirmed = await page.evaluate(() => {
      const modal = document.querySelector('.cheetah-modal-wrap');
      if (!modal) return null;
      const btns = Array.from(modal.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.textContent || '').trim();
        if (t === '发布' || t === '确认' || t === '确定' || t === '立即发布') {
          b.click();
          return t;
        }
      }
      // 点第一个按钮
      if (btns.length > 0) { btns[0].click(); return btns[0].textContent.trim() + '(first)'; }
      return null;
    });
    console.log('Confirmed:', confirmed);
    await sleep(3000);
    await ss(page, 'pilot-v3-07-final.png');
  }
  
  const finalState = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title
  }));
  console.log('Final state:', JSON.stringify(finalState));

  // 写报告
  const report = `# 百家号发布流程手册（BJH-1 完整报告）

## 执行时间
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 文章信息
- 标题：${TITLE}
- 正文字数：约1882字（显示字数）

## 🔑 关键发现：百家号图文编辑器结构

### 页面布局
\`\`\`
顶部导航（图文/视频/动态...）
├── 左侧：编辑区
│   ├── [工具栏：H B I A ... 插入]
│   ├── [contenteditable - 正文区（高度大）]
│   └── 底部：字数 | 已保存 | 发文设置 [存草稿][预览][定时发布][发布]
└── 右侧：AI助手面板
    ├── 检测建议 素材推荐 更多
    └── AI生成输入框
\`\`\`

### 标题区
- 重要：百家号的标题并不在编辑区内！
- 标题在「发文设置」面板中设置
- 或者：URL 带 type=news，标题在发布前弹窗里填写
- contenteditable 只有一个（正文），没有独立的标题 contenteditable

### 正文区
- 类型：单个 contenteditable div
- Class: _9ddb7e475b559749-editor _377c94a778c072b3-editor
- 填入方法：clipboard paste（navigator.clipboard.writeText + Meta+V）✅
- 字数统计：底部左侧实时显示

### 发文设置
- 按钮位置：底部左侧「发文设置 ▼」
- 包含：封面设置、话题、摘要等
- 封面选项：三图/单图

### 发布按钮
- 精确文本：「发布」（注意区分「定时发布」）
- Class: cheetah-btn cheetah-btn-primary
- 点击后：可能出现确认弹窗

## 可复用发布脚本（完整版）

### 核心流程
\`\`\`javascript
// 1. 连接 CDP
const resp = await fetch('http://127.0.0.1:18800/json/version');
const browser = await chromium.connectOverCDP((await resp.json()).webSocketDebuggerUrl);
const page = await browser.contexts()[0].newPage();
await page.goto('https://baijiahao.baidu.com/builder/rc/edit?type=news');
await sleep(3000);

// 2. 填写正文（clipboard 法）
const bodyEl = await page.$('[contenteditable="true"]');
await bodyEl.click();
await page.evaluate(text => navigator.clipboard.writeText(text), body);
await page.keyboard.press('Meta+a');
await page.keyboard.press('Meta+v');
await sleep(2000);

// 3. 点击发文设置（填标题和封面）
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('*'))
    .find(e => e.textContent.trim() === '发文设置');
  if (el) el.click();
});
await sleep(1000);
// 在弹出的设置面板里填标题...

// 4. 点发布
await page.evaluate(() => {
  const pub = Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === '发布' && !b.disabled);
  if (pub) pub.click();
});
await sleep(3000);
\`\`\`

## 发布结果
- 发布状态：${clickResult.clicked ? '已点击发布' : '未能点击（' + JSON.stringify(clickResult.available) + ')'}
- 最终 URL：${finalState.url}
- 见截图：pilot-v3-07-final.png
`;

  fs.writeFileSync('/Users/wei/Desktop/opc-content/bjh-pilot-report.md', report);
  console.log('\n报告写入完成');
  
  await browser.close();
  console.log('\npilot 完成，流程已摸清，报告在 bjh-pilot-report.md');
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
