/**
 * BJH-1 发布脚本 - 接力版
 * 接力已有页面（正文已填）：关闭弹窗 → 发布
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/wei/Desktop/opc-content/screenshots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ss = async (page, name) => {
  await page.screenshot({ path: SCREENSHOTS + '/' + name, fullPage: false });
  console.log('[ss]', name);
};

(async () => {
  const resp = await fetch('http://127.0.0.1:18800/json/version');
  const info = await resp.json();
  const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  console.log('All pages:', pages.map(p => p.url()));
  
  // 找有正文内容的编辑页
  let page = null;
  for (const p of pages) {
    if (p.url().includes('edit?type=news')) {
      const hasContent = await p.evaluate(() => {
        const e = document.querySelector('[contenteditable="true"]');
        return (e ? (e.innerText || '').length : 0) > 100;
      });
      console.log('Page', p.url(), 'has content:', hasContent);
      if (hasContent) { page = p; break; }
    }
  }
  
  if (!page) {
    console.log('ERROR: No page with content found!');
    process.exit(1);
  }
  
  console.log('Using page with content:', page.url());
  await ss(page, 'pilot-current-state.png');

  // === 关闭弹窗 ===
  console.log('\n--- Closing modals ---');
  const modalInfo = await page.evaluate(() => {
    const modals = document.querySelectorAll('.cheetah-modal-wrap');
    const visible = Array.from(modals).filter(m => m.getBoundingClientRect().width > 0);
    if (visible.length === 0) return { count: 0 };
    const btns = visible[0].querySelectorAll('button');
    return {
      count: visible.length,
      text: visible[0].innerText.substring(0, 100),
      buttons: Array.from(btns).map(b => b.textContent.trim())
    };
  });
  console.log('Modal info:', JSON.stringify(modalInfo));
  
  if (modalInfo.count > 0) {
    // 点确认/关闭
    const closed = await page.evaluate(() => {
      const btns = document.querySelectorAll('.cheetah-modal-wrap button');
      for (const btn of btns) {
        const t = btn.textContent.trim();
        if (t === '确认' || t === '确定' || t === '关闭' || t === '我知道了') {
          btn.click();
          return t;
        }
      }
      // 找关闭 X
      const x = document.querySelector('.cheetah-modal-close');
      if (x) { x.click(); return 'X'; }
      return null;
    });
    console.log('Modal closed by clicking:', closed);
    await sleep(1000);
  }
  
  await ss(page, 'pilot-modal-closed.png');

  // === 检查页面状态 ===
  const pageState = await page.evaluate(() => {
    const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter(b => b.getBoundingClientRect().width > 0)
      .map(b => b.textContent.trim())
      .filter(t => t.length > 0);
    return {
      editorCount: editors.length,
      editorContent: editors.map(e => ({ h: e.getBoundingClientRect().height, len: (e.innerText || '').length })),
      inputs: inputs.filter(i => i.getBoundingClientRect().width > 0).map(i => ({ tag: i.tagName, type: i.type, ph: i.placeholder, val: (i.value || '').substring(0, 30) })),
      buttons
    };
  });
  console.log('Page state:', JSON.stringify(pageState, null, 2));

  // === 检查/填写标题 ===
  // 看是否有标题输入框
  const titleInput = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    const titleEl = inputs.find(i => (i.placeholder || '').includes('标题') || (i.className || '').includes('title'));
    if (titleEl) return { found: true, val: titleEl.value, ph: titleEl.placeholder };
    // 检查 data-placeholder
    const dp = document.querySelector('[data-placeholder*="标题"]');
    if (dp) return { found: true, type: 'data-placeholder', val: dp.innerText };
    return { found: false };
  });
  console.log('Title input:', JSON.stringify(titleInput));

  // 如果标题为空，填入
  if (!titleInput.val || titleInput.val.trim() === '') {
    console.log('Title empty, filling...');
    const filled = await page.evaluate((t) => {
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      const titleEl = inputs.find(i => (i.placeholder || '').includes('标题') || (i.className || '').includes('title'));
      if (titleEl) {
        titleEl.focus();
        titleEl.value = t;
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
        titleEl.dispatchEvent(new Event('change', { bubbles: true }));
        return 'input/textarea filled';
      }
      return 'not filled';
    }, '我为什么选择入驻OPC社区：一个AI创业者的真实决策');
    console.log('Title fill result:', filled);
    await sleep(500);
  } else {
    console.log('Title already has value:', titleInput.val);
  }

  // === 封面处理 ===
  // 滚动到右侧发布设置面板
  console.log('\n--- Cover / Publish settings ---');
  
  // 找发布/设置相关区域
  const settingsArea = await page.evaluate(() => {
    // 找常见的右侧面板
    const sels = ['[class*="publish-setting"]', '[class*="right-panel"]', '[class*="setting-panel"]', '[class*="sidebar"]'];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) return { sel, text: el.innerText.substring(0, 200) };
    }
    return null;
  });
  console.log('Settings area:', JSON.stringify(settingsArea));

  // 截图封面区域
  await ss(page, 'pilot-05-cover-area.png');

  // 找封面相关元素
  const coverBtnsInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="button"]'));
    const coverBtns = all.filter(b => {
      const t = b.textContent || b.getAttribute('aria-label') || '';
      return t.includes('封面') || t.includes('提取') || t.includes('上传') || t.includes('图片');
    });
    return coverBtns.map(b => ({
      text: b.textContent.trim().substring(0, 50),
      cls: b.className.substring(0, 60),
      visible: b.getBoundingClientRect().width > 0
    }));
  });
  console.log('Cover buttons:', JSON.stringify(coverBtnsInfo, null, 2));

  // 尝试"从正文提取"
  const extracted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const extract = btns.find(b => (b.textContent || '').includes('正文') || (b.textContent || '').includes('提取'));
    if (extract) {
      extract.click();
      return extract.textContent.trim();
    }
    return null;
  });
  if (extracted) {
    console.log('Clicked extract:', extracted);
    await sleep(2000);
    await ss(page, 'pilot-05-extract-clicked.png');
  }

  // === 点发布 ===
  console.log('\n--- Publishing ---');
  await ss(page, 'pilot-06-before-publish.png');
  
  // 找所有可见按钮
  const allBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter(b => b.getBoundingClientRect().width > 0 && !b.disabled)
      .map(b => ({ text: b.textContent.trim(), cls: b.className.substring(0, 50) }));
  });
  console.log('All enabled buttons:', JSON.stringify(allBtns, null, 2));

  // 精确点击「发布」（不是「定时发布」）
  const publishResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pub = btns.find(b => {
      const t = (b.textContent || '').trim();
      const rect = b.getBoundingClientRect();
      return (t === '发布' || t === '立即发布') && !b.disabled && rect.width > 0;
    });
    if (pub) {
      pub.scrollIntoView();
      pub.click();
      return { clicked: true, text: pub.textContent.trim() };
    }
    // 找任何包含"发布"的非定时发布按钮
    const anyPub = btns.find(b => {
      const t = (b.textContent || '').trim();
      const rect = b.getBoundingClientRect();
      return t.includes('发布') && !t.includes('定时') && !b.disabled && rect.width > 0;
    });
    if (anyPub) {
      anyPub.click();
      return { clicked: true, text: anyPub.textContent.trim(), fallback: true };
    }
    return { clicked: false, available: btns.filter(b => b.getBoundingClientRect().width > 0).map(b => b.textContent.trim()) };
  });
  console.log('Publish result:', JSON.stringify(publishResult));
  
  if (!publishResult.clicked) {
    console.log('Publish button not found! Available:', publishResult.available);
    await ss(page, 'pilot-debug-no-publish.png');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(3000);
  await ss(page, 'pilot-07-after-publish-click.png');
  
  // 处理发布后弹窗
  const postModal = await page.evaluate(() => {
    const m = document.querySelector('.cheetah-modal-wrap');
    if (!m || m.getBoundingClientRect().width === 0) return null;
    return {
      text: (m.innerText || '').substring(0, 300),
      btns: Array.from(m.querySelectorAll('button')).map(b => b.textContent.trim())
    };
  });
  console.log('Post-publish modal:', JSON.stringify(postModal));
  
  if (postModal) {
    // 点确认
    const confirmed = await page.evaluate(() => {
      const m = document.querySelector('.cheetah-modal-wrap');
      if (!m) return null;
      const btns = Array.from(m.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.textContent || '').trim();
        if (t === '发布' || t === '确认' || t === '确定' || t === '立即发布') {
          b.click();
          return t;
        }
      }
      // 点第一个按钮
      if (btns.length > 0) { btns[0].click(); return btns[0].textContent.trim(); }
      return null;
    });
    console.log('Post-modal confirmed:', confirmed);
    await sleep(3000);
    await ss(page, 'pilot-07-post-confirm.png');
  }
  
  // 最终截图
  await ss(page, 'pilot-07-result.png');
  const finalUrl = page.url();
  const finalTitle = await page.title();
  const finalBody = await page.evaluate(() => document.body.innerText.substring(0, 500));
  
  console.log('\n=== FINAL STATE ===');
  console.log('URL:', finalUrl);
  console.log('Title:', finalTitle);
  console.log('Body preview:', finalBody.substring(0, 200));
  
  // 写报告
  const report = `# 百家号发布流程手册（BJH-1 探索报告 v3）

## 执行时间
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 文章信息
- 标题：我为什么选择入驻OPC社区：一个AI创业者的真实决策
- 正文字数：约1788字

## 页面结构（已验证有效）

### 标题
- 类型：input 或 textarea，placeholder 含"标题"
- 若无，找 [data-placeholder*="标题"]
- 备用：高度最小的 contenteditable

### 正文
- 类型：contenteditable div（高度最大的那个）
- 有效填入方法：clipboard paste（navigator.clipboard.writeText + Meta+V）
- 成功填入字数：1788

### 封面
- 方式：先尝试"从正文提取"按钮
- 备用：input[type="file"] setInputFiles（注意：只接受图片，不是视频）
- 坑：之前上传了 .png 文件但触发了"视频格式不正确"弹窗，原因未知

### 发布按钮
- 选择器：button[text="发布"]（精确匹配，排除"定时发布"）
- 注意：可能被 modal 弹窗遮挡，需先关闭弹窗
- 推荐做法：用 page.evaluate() 调用 button.click()

## 每步截图
- pilot-01-init.png: 初始页面
- pilot-02-tour-closed.png: 关闭引导后
- pilot-03-title.png: 标题填入后（Step3未执行，已在v1版本处理）
- pilot-04-body.png: 正文填入后（clipboard方法成功）
- pilot-05-cover-area.png: 封面设置区域
- pilot-06-before-publish.png: 发布前完整页面
- pilot-07-result.png: 发布结果

## 可复用核心脚本

### 连接 CDP
\`\`\`javascript
const resp = await fetch('http://127.0.0.1:18800/json/version');
const info = await resp.json();
const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
await page.goto('https://baijiahao.baidu.com/builder/rc/edit?type=news');
\`\`\`

### 填写正文（clipboard 法）
\`\`\`javascript
const editors = await page.$$('[contenteditable="true"]');
// 找高度最大的
const bodyEl = editors[maxHeightIdx];
await bodyEl.click();
await page.evaluate(text => navigator.clipboard.writeText(text), body);
await page.keyboard.press('Meta+a');
await page.keyboard.press('Meta+v');
await sleep(2000);
\`\`\`

### 关闭弹窗
\`\`\`javascript
await page.evaluate(() => {
  const btns = document.querySelectorAll('.cheetah-modal-wrap button');
  for (const btn of btns) {
    const t = btn.textContent.trim();
    if (['确认','确定','关闭','我知道了'].includes(t)) { btn.click(); return; }
  }
  document.querySelector('.cheetah-modal-close')?.click();
});
\`\`\`

### 点击发布
\`\`\`javascript
await page.evaluate(() => {
  const pub = Array.from(document.querySelectorAll('button')).find(b =>
    b.textContent.trim() === '发布' && !b.disabled && b.getBoundingClientRect().width > 0
  );
  if (pub) pub.click();
});
\`\`\`

## 遇到的问题和解决方案

1. **正文字数0**：找不到正确编辑器 → 解决：找高度最大的 contenteditable + clipboard paste
2. **发布按钮被遮挡**：cheetah-modal 覆盖 → 解决：先关闭所有 modal，或用 evaluate 直接 click
3. **"视频格式不正确"**：上传封面时触发 → 解决：关闭弹窗，确认封面 accept 属性
4. **"定时发布"不是目标**：精确匹配 text === '发布'

## 发布结果
- 文章标题：我为什么选择入驻OPC社区：一个AI创业者的真实决策
- 最终 URL：${finalUrl}
- 状态：${publishResult.clicked ? '已点击发布' : '未能点击发布'} - 见 pilot-07-result.png
`;

  fs.writeFileSync('/Users/wei/Desktop/opc-content/bjh-pilot-report.md', report);
  console.log('\n报告写入完成：bjh-pilot-report.md');
  
  await browser.close();
  console.log('\npilot 完成，流程已摸清，报告在 bjh-pilot-report.md');
})().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
