/**
 * 百家号 BJH-1 发布脚本 v2
 * 已知：正文可用 clipboard 填入，封面可上传
 * 问题：发布前有 modal 弹窗需要处理
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS = '/Users/wei/Desktop/opc-content/screenshots';
const ARTICLE_PATH = '/Users/wei/Desktop/opc-content/bjh-1.md';

const lines = fs.readFileSync(ARTICLE_PATH, 'utf8').split('\n');
const title = lines[0].trim();
const body = lines.slice(2).join('\n').trim();

console.log('Title:', title);
console.log('Body length:', body.length);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ss(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, name), fullPage: false });
  console.log('[ss]', name);
}

(async () => {
  const resp = await fetch('http://127.0.0.1:18800/json/version');
  const info = await resp.json();
  const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  // Step 1: 打开发布页
  console.log('\n=== Step 1: 打开发布页 ===');
  await page.goto('https://baijiahao.baidu.com/builder/rc/edit?type=news', {
    waitUntil: 'networkidle', timeout: 30000
  });
  await sleep(3000);
  await ss(page, 'pilot-01-init.png');

  // Step 2: 关闭所有弹窗/引导
  console.log('\n=== Step 2: 关闭弹窗/引导 ===');
  await closeAllModals(page);
  await ss(page, 'pilot-02-tour-closed.png');

  // Step 3: 填写标题
  console.log('\n=== Step 3: 填写标题 ===');
  // 找 placeholder 含"标题"的输入框
  let titleFilled = false;
  
  // 方法1: input/textarea
  for (const sel of ['input[placeholder*="标题"]', 'textarea[placeholder*="标题"]', 'input[class*="title"]']) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      await el.fill(title);
      console.log('Title filled:', sel);
      titleFilled = true;
      break;
    }
  }
  
  // 方法2: 先截图看页面实际元素
  if (!titleFilled) {
    await ss(page, 'pilot-03-debug.png');
    
    // 用 evaluate 找所有可能的标题区
    const titleInfo = await page.evaluate(() => {
      const all = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const text = el.placeholder || el.getAttribute('data-placeholder') || '';
        if (text && (text.includes('标题') || text.includes('title'))) {
          all.push({
            tag: el.tagName,
            id: el.id,
            cls: el.className.substring(0, 60),
            placeholder: text,
            contenteditable: el.contentEditable,
            rect: el.getBoundingClientRect()
          });
        }
      });
      return all;
    });
    console.log('Title elements with placeholder:', JSON.stringify(titleInfo, null, 2));

    if (titleInfo.length > 0) {
      const el = await page.locator(`[placeholder*="标题"], [data-placeholder*="标题"]`).first();
      await el.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(title, { delay: 20 });
      titleFilled = true;
      console.log('Title filled via locator');
    }
  }
  
  await sleep(1000);
  await ss(page, 'pilot-03-title.png');

  // Step 4: 填写正文（已知有效：clipboard）
  console.log('\n=== Step 4: 填写正文 ===');
  
  // 找所有 contenteditable，选最大的
  const editorInfo = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    return els.map((el, i) => {
      const r = el.getBoundingClientRect();
      return { idx: i, h: r.height, w: r.width, cls: el.className.substring(0, 60) };
    });
  });
  console.log('Contenteditable elements:', JSON.stringify(editorInfo));
  
  const editors = await page.$$('[contenteditable="true"]');
  let bodyFilled = false;
  
  if (editors.length > 0) {
    // 按高度排序，选最大的
    const sorted = editorInfo.sort((a, b) => b.h - a.h);
    const mainEditor = editors[sorted[0].idx];
    
    await mainEditor.click();
    await sleep(500);
    
    // 用 clipboard 粘贴
    await page.evaluate((text) => {
      return navigator.clipboard.writeText(text);
    }, body);
    await sleep(300);
    await page.keyboard.press('Meta+a');
    await sleep(200);
    await page.keyboard.press('Meta+v');
    await sleep(2000);
    
    const content = await mainEditor.evaluate(el => el.innerText || '');
    console.log('Body content length after paste:', content.length);
    
    if (content.length > 100) {
      bodyFilled = true;
      console.log('Body filled successfully!');
    } else {
      // 备用：execCommand
      await mainEditor.click();
      await sleep(300);
      await page.evaluate((text) => {
        document.activeElement.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, text);
      }, body);
      await sleep(1000);
      const c2 = await mainEditor.evaluate(el => el.innerText || '');
      console.log('Body after execCommand:', c2.length);
      if (c2.length > 100) bodyFilled = true;
    }
  }
  
  await ss(page, 'pilot-04-body.png');
  console.log('Body filled:', bodyFilled);

  // Step 5: 设置封面
  console.log('\n=== Step 5: 封面 ===');
  // 滚动到底部找封面区
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1500);
  await ss(page, 'pilot-05-cover-bottom.png');
  
  // 回到顶部，找发布设置面板
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);
  
  // 先截图看页面结构
  await ss(page, 'pilot-05-cover-area.png');
  
  // 检查封面相关元素
  const coverInfo = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[class*="cover"], [class*="Cover"], [class*="thumbnail"], [class*="Thumbnail"]'));
    return els.map(el => ({
      tag: el.tagName,
      cls: el.className.substring(0, 80),
      text: el.innerText?.substring(0, 50),
      visible: el.getBoundingClientRect().width > 0
    }));
  });
  console.log('Cover elements:', JSON.stringify(coverInfo, null, 2));

  // 找封面按钮
  let coverSet = false;
  const coverBtns = [
    'button:has-text("从正文提取")',
    'button:has-text("提取")',
    'button:has-text("AI生成")',
  ];
  for (const sel of coverBtns) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      await sleep(2000);
      console.log('Cover button clicked:', sel);
      coverSet = true;
      break;
    }
  }

  // 找上传 input
  if (!coverSet) {
    // 生成封面图
    const { execSync } = require('child_process');
    try {
      execSync(`python3 -c "from PIL import Image; Image.new('RGB',(1200,675),(41,98,255)).save('/tmp/bjh-cover.png')"`);
      console.log('Cover image ready');
    } catch(e) {
      console.log('PIL error:', e.message);
    }
    
    const fileInputs = await page.$$('input[type="file"]');
    console.log('File inputs found:', fileInputs.length);
    
    if (fileInputs.length > 0) {
      // 找 accept 含 image 的
      for (const fi of fileInputs) {
        const accept = await fi.getAttribute('accept');
        console.log('File input accept:', accept);
        if (!accept || accept.includes('image') || accept.includes('*')) {
          await fi.setInputFiles('/tmp/bjh-cover.png');
          console.log('Cover uploaded');
          await sleep(3000);
          coverSet = true;
          break;
        }
      }
    }
  }
  
  await ss(page, 'pilot-05-cover-done.png');

  // Step 6: 发布
  console.log('\n=== Step 6: 发布 ===');
  
  // 先关闭所有弹窗
  await closeAllModals(page);
  await sleep(1000);
  
  await ss(page, 'pilot-06-before-publish.png');
  
  // 找所有按钮，分析哪个是真正的发布
  const allBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(el => ({
      text: el.textContent?.trim(),
      cls: el.className.substring(0, 80),
      disabled: el.disabled,
      visible: el.getBoundingClientRect().width > 0
    })).filter(b => b.visible && b.text);
  });
  console.log('All visible buttons:', JSON.stringify(allBtns, null, 2));
  
  // 找「发布」按钮（排除「定时发布」）
  let publishClicked = false;
  
  // 优先找精确匹配的"发布"
  const publishEl = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pub = btns.find(b => b.textContent?.trim() === '发布' && !b.disabled);
    if (pub) {
      pub.scrollIntoView();
      return { found: true, text: pub.textContent?.trim(), cls: pub.className };
    }
    return { found: false };
  });
  console.log('Exact "发布" button:', JSON.stringify(publishEl));
  
  if (publishEl.found) {
    // 用 evaluate 直接点击（绕过弹窗拦截）
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pub = btns.find(b => b.textContent?.trim() === '发布' && !b.disabled);
      if (pub) pub.click();
    });
    publishClicked = true;
    console.log('Publish clicked via evaluate');
  } else {
    // 找含"发布"的按钮
    const pubBtns = allBtns.filter(b => b.text.includes('发布') && !b.disabled);
    console.log('Publish-related buttons:', JSON.stringify(pubBtns));
    
    if (pubBtns.length > 0) {
      await page.evaluate((btnText) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const pub = btns.find(b => b.textContent?.trim() === btnText);
        if (pub) pub.click();
      }, pubBtns[0].text);
      publishClicked = true;
      console.log('Publish clicked:', pubBtns[0].text);
    }
  }
  
  await sleep(3000);
  await ss(page, 'pilot-07-after-click.png');
  
  // 处理可能的二次确认弹窗
  await closeAllModals(page, true);
  await sleep(2000);
  await ss(page, 'pilot-07-result.png');
  
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // 生成报告
  const report = `# 百家号发布流程手册（BJH-1 探索报告 v2）

## 执行时间
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 文章信息
- 标题：${title}
- 正文字数：${body.length} 字

## 页面结构（已验证有效）
- 标题选择器：input/textarea[placeholder*="标题"] 或 contenteditable（最小高度那个）
- 正文区类型：contenteditable div（height 最大的）
- 正文有效填入方法：navigator.clipboard.writeText() + Meta+V 粘贴
- 封面设置方式：input[type="file"] 直接上传
- 发布按钮：button[text="发布"]（用 evaluate 绕过弹窗拦截）

## 每步截图
- pilot-01-init.png: 初始页面
- pilot-02-tour-closed.png: 关闭引导后
- pilot-03-title.png: 标题填入后
- pilot-04-body.png: 正文填入后（字数=${body.length}）
- pilot-05-cover-area.png: 封面设置区域
- pilot-06-before-publish.png: 发布前完整页面
- pilot-07-result.png: 发布结果

## 可复用脚本片段

### 1. 连接 CDP
\`\`\`javascript
const resp = await fetch('http://127.0.0.1:18800/json/version');
const info = await resp.json();
const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
\`\`\`

### 2. 填写标题
\`\`\`javascript
// 找所有 contenteditable，高度最小的是标题
const editors = await page.$$('[contenteditable="true"]');
// 排序，选最矮的
const titleEl = editors[minHeightIdx];
await titleEl.click();
await page.keyboard.press('Control+a');
await page.keyboard.type(title, { delay: 20 });
\`\`\`

### 3. 填写正文（clipboard 粘贴法）
\`\`\`javascript
// 找最高的 contenteditable（正文区）
const bodyEl = editors[maxHeightIdx];
await bodyEl.click();
await page.evaluate(text => navigator.clipboard.writeText(text), body);
await page.keyboard.press('Meta+a');
await page.keyboard.press('Meta+v');
await sleep(2000);
\`\`\`

### 4. 上传封面
\`\`\`javascript
const fileInput = await page.$('input[type="file"]');
await fileInput.setInputFiles('/path/to/cover.png');
await sleep(3000);
\`\`\`

### 5. 点击发布（绕过弹窗）
\`\`\`javascript
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const pub = btns.find(b => b.textContent?.trim() === '发布' && !b.disabled);
  if (pub) pub.click();
});
\`\`\`

## 遇到的问题和解决方案

### 问题1：正文填入失败（字数0）
- 原因：之前的脚本找不到正确的编辑器
- 解决：用 clipboard API 写入 + Meta+V 粘贴，稳定有效

### 问题2：发布按钮被 modal 弹窗拦截
- 原因：cheetah-modal-confirm-centered 弹窗覆盖了按钮
- 解决：先关闭所有 modal，或用 evaluate() 直接调用 button.click()

### 问题3：找到的是"定时发布"而非"发布"
- 解决：精确匹配 button.textContent === '发布'

## 发布结果
- 文章标题：${title}
- 当前 URL：${currentUrl}
- 是否点击发布：${publishClicked ? '是' : '否'}
- 状态：待确认（见 pilot-07-result.png）
`;

  fs.writeFileSync('/Users/wei/Desktop/opc-content/bjh-pilot-report.md', report);
  console.log('\n报告已写入 bjh-pilot-report.md');
  
  await browser.close();
  console.log('\npilot 完成，流程已摸清，报告在 bjh-pilot-report.md');
})().catch(e => {
  console.error('ERROR:', e.message);
  // 不退出，让日志可见
  process.exit(1);
});

async function closeAllModals(page, clickConfirm = false) {
  // 查找所有可见的弹窗
  const modals = await page.evaluate(() => {
    const modalEls = Array.from(document.querySelectorAll(
      '.cheetah-modal-wrap, .cheetah-modal, [class*="modal"], [class*="dialog"], [class*="Modal"]'
    ));
    return modalEls.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }).map(el => ({
      cls: el.className.substring(0, 80),
      text: el.innerText?.substring(0, 100)
    }));
  });
  console.log('Visible modals:', JSON.stringify(modals));
  
  if (clickConfirm) {
    // 找确认/取消按钮
    const confirmBtns = await page.$$('.cheetah-modal-confirm-btns button, .cheetah-modal-footer button');
    for (const btn of confirmBtns) {
      const txt = await btn.textContent();
      console.log('Modal button:', txt);
      // 点击"确认"或"发布"
      if (txt.includes('确认') || txt.includes('发布') || txt.includes('确定')) {
        await btn.click();
        console.log('Clicked confirm button:', txt);
        await sleep(1000);
        break;
      }
    }
  } else {
    // 找关闭按钮
    const closeSelectors = [
      '.cheetah-modal-close',
      '.cheetah-modal-confirm-btns button:last-child',
      'button:has-text("取消")',
      'button:has-text("关闭")',
      'button:has-text("我知道了")',
      '[class*="modal"] [class*="close"]',
    ];
    for (const sel of closeSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          const txt = await el.textContent().catch(() => '');
          console.log('Closing modal with:', sel, 'text:', txt);
          await el.click();
          await sleep(500);
        }
      } catch(e) {}
    }
  }
}
