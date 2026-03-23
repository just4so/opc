/**
 * 百家号 BJH-1 单篇发布探索脚本
 * 目标：走通发布流程，记录每步细节
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS = '/Users/wei/Desktop/opc-content/screenshots';
const ARTICLE_PATH = '/Users/wei/Desktop/opc-content/bjh-1.md';

// 读取文章
const lines = fs.readFileSync(ARTICLE_PATH, 'utf8').split('\n');
const title = lines[0].trim();
const body = lines.slice(2).join('\n').trim();

console.log('Title:', title);
console.log('Body length:', body.length);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshot(page, name) {
  const p = path.join(SCREENSHOTS, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log('[screenshot]', name);
}

(async () => {
  // 连接 CDP
  const resp = await fetch('http://127.0.0.1:18800/json/version');
  const info = await resp.json();
  console.log('CDP:', info.Browser);
  
  const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  // =======================================================
  // Step 1: 打开发布页
  // =======================================================
  console.log('\n=== Step 1: 打开发布页 ===');
  await page.goto('https://baijiahao.baidu.com/builder/rc/edit?type=news', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await sleep(3000);
  await screenshot(page, 'pilot-01-init.png');

  // 分析页面结构
  const inputs = await page.$$eval(
    '*[class*="title"], *[placeholder], input, textarea',
    els => els.map(e => ({
      tag: e.tagName,
      cls: e.className.substring(0, 80),
      ph: e.placeholder || '',
      id: e.id || ''
    }))
  );
  console.log('Input elements found:', JSON.stringify(inputs, null, 2));

  // 找 contenteditable
  const editables = await page.$$eval('[contenteditable="true"]', els => els.map(e => ({
    tag: e.tagName,
    cls: e.className.substring(0, 80),
    id: e.id || '',
    text: (e.innerText || '').substring(0, 50)
  })));
  console.log('Contenteditable elements:', JSON.stringify(editables, null, 2));

  // 找 iframe
  const frames = page.frames();
  console.log('Frames:', frames.map(f => ({ url: f.url(), name: f.name() })));

  // =======================================================
  // Step 2: 关闭新手引导（如果有）
  // =======================================================
  console.log('\n=== Step 2: 关闭引导 ===');
  const tourSelectors = [
    '.cheetah-tour-close',
    'button:has-text("关闭")',
    'button:has-text("跳过")',
    'button:has-text("我知道了")',
    '.tour-close',
    '[class*="tour"] [class*="close"]',
    '[class*="guide"] [class*="close"]',
  ];
  let tourClosed = false;
  for (const sel of tourSelectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        console.log('Closed tour with:', sel);
        tourClosed = true;
        await sleep(1000);
        break;
      }
    } catch (e) {}
  }
  if (!tourClosed) console.log('No tour found');
  await screenshot(page, 'pilot-02-tour-closed.png');

  // =======================================================
  // Step 3: 填写标题
  // =======================================================
  console.log('\n=== Step 3: 填写标题 ===');
  let titleFilled = false;

  // 方法1：找 placeholder 含"标题"的 input/textarea
  const titleInput = await page.$('input[placeholder*="标题"], textarea[placeholder*="标题"]');
  if (titleInput) {
    await titleInput.click();
    await titleInput.fill(title);
    console.log('Title filled via input/textarea');
    titleFilled = true;
  }

  // 方法2：找 contenteditable 含"标题"相关
  if (!titleFilled) {
    const titleEditable = await page.$('[class*="title"][contenteditable], [placeholder*="标题"][contenteditable]');
    if (titleEditable) {
      await titleEditable.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(title, { delay: 30 });
      console.log('Title filled via contenteditable');
      titleFilled = true;
    }
  }

  // 方法3：找所有 contenteditable，选第一个（通常是标题区）
  if (!titleFilled) {
    const allEditables = await page.$$('[contenteditable="true"]');
    if (allEditables.length > 0) {
      const boxes = [];
      for (let i = 0; i < allEditables.length; i++) {
        const bb = await allEditables[i].boundingBox();
        boxes.push({ idx: i, height: bb?.height || 0, width: bb?.width || 0, y: bb?.y || 0 });
      }
      console.log('Contenteditable boxes:', JSON.stringify(boxes));
      // 高度小的通常是标题（一行），高度大的是正文
      const sorted = boxes.sort((a, b) => a.height - b.height);
      const titleEl = allEditables[sorted[0].idx];
      await titleEl.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(title, { delay: 30 });
      console.log('Title filled via first contenteditable (idx:', sorted[0].idx, ')');
      titleFilled = true;
    }
  }

  await sleep(1000);
  await screenshot(page, 'pilot-03-title.png');

  // =======================================================
  // Step 4: 填写正文
  // =======================================================
  console.log('\n=== Step 4: 填写正文 ===');
  let bodyFilled = false;
  let bodyMethod = 'none';

  // 方法A: 检查 iframe (UEditor)
  const allFrames = page.frames();
  const editorFrame = allFrames.find(f => 
    f.url().includes('ueditor') || 
    f.name().includes('editor') ||
    f.url().includes('editor')
  );
  if (editorFrame) {
    console.log('Found editor frame:', editorFrame.url());
    try {
      await editorFrame.evaluate((text) => {
        document.body.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, text);
      }, body);
      console.log('Method A: UEditor iframe - filled');
      bodyFilled = true;
      bodyMethod = 'A-UEditor-iframe';
    } catch(e) {
      console.log('Method A failed:', e.message);
    }
  } else {
    console.log('No UEditor iframe found');
  }

  // 方法B: 找所有 contenteditable，选最大的
  if (!bodyFilled) {
    const editors = await page.$$('[contenteditable="true"]');
    console.log('Contenteditable count:', editors.length);
    if (editors.length > 0) {
      const boxes = [];
      for (let i = 0; i < editors.length; i++) {
        const bb = await editors[i].boundingBox();
        if (bb) boxes.push({ idx: i, height: bb.height, width: bb.width });
      }
      console.log('Boxes:', JSON.stringify(boxes));
      // 选最高的（正文编辑区）
      boxes.sort((a, b) => b.height - a.height);
      if (boxes.length > 0) {
        const bodyEl = editors[boxes[0].idx];
        await bodyEl.click();
        await sleep(500);

        // 先尝试 clipboard paste
        try {
          await page.evaluate((text) => {
            return navigator.clipboard.writeText(text);
          }, body);
          await page.keyboard.press('Meta+a');
          await sleep(200);
          await page.keyboard.press('Meta+v');
          await sleep(1000);

          // 检查是否填入
          const content = await bodyEl.evaluate(el => el.innerText || el.textContent);
          console.log('After clipboard paste, content length:', content.length);
          
          if (content.length > 50) {
            console.log('Method B+Clipboard: filled, content length:', content.length);
            bodyFilled = true;
            bodyMethod = 'B-contenteditable-clipboard';
          }
        } catch(e) {
          console.log('Clipboard method failed:', e.message);
        }

        // 若剪贴板失败，用 execCommand insertText
        if (!bodyFilled) {
          try {
            await bodyEl.click();
            await sleep(300);
            await page.evaluate((text) => {
              document.execCommand('selectAll');
              document.execCommand('delete');
              document.execCommand('insertText', false, text);
            }, body);
            await sleep(500);
            const content = await bodyEl.evaluate(el => el.innerText || el.textContent);
            console.log('After execCommand, content length:', content.length);
            if (content.length > 50) {
              bodyFilled = true;
              bodyMethod = 'B-contenteditable-execCommand';
            }
          } catch(e) {
            console.log('execCommand method failed:', e.message);
          }
        }

        // 若仍失败，用键盘输入前500字测试
        if (!bodyFilled) {
          try {
            await bodyEl.click();
            await sleep(300);
            await page.keyboard.type(body.substring(0, 500), { delay: 15 });
            await sleep(1000);
            const content = await bodyEl.evaluate(el => el.innerText || el.textContent);
            console.log('After keyboard type, content length:', content.length);
            if (content.length > 50) {
              bodyFilled = true;
              bodyMethod = 'D-keyboard-type (first 500 chars only)';
              console.log('Method D: keyboard type - partial success');
            }
          } catch(e) {
            console.log('Keyboard type failed:', e.message);
          }
        }
      }
    }
  }

  // 检查字数
  const wordCount = await page.$eval(
    '.word-count, [class*="count"], [class*="word-count"], [class*="wordCount"]',
    el => el.textContent
  ).catch(() => 'not found');
  console.log('Word count display:', wordCount);

  await screenshot(page, 'pilot-04-body.png');
  console.log('Body filled:', bodyFilled, 'Method:', bodyMethod);

  // =======================================================
  // Step 5: 设置封面图
  // =======================================================
  console.log('\n=== Step 5: 封面图 ===');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1500);
  await screenshot(page, 'pilot-05-cover-area.png');

  // 找封面相关按钮
  const coverSelectors = [
    'button:has-text("从正文提取")',
    'button:has-text("提取封面")',
    'button:has-text("AI生成")',
    '[class*="cover"] button',
    '[class*="thumbnail"] button',
    'button:has-text("封面")',
  ];
  let coverSet = false;
  for (const sel of coverSelectors) {
    const el = await page.$(sel);
    if (el) {
      console.log('Found cover button:', sel);
      await el.click();
      await sleep(2000);
      await screenshot(page, 'pilot-05b-cover-click.png');
      coverSet = true;
      break;
    }
  }

  // 如果没找到按钮，找上传 input
  if (!coverSet) {
    // 生成简单封面图
    console.log('Trying to generate cover image...');
    try {
      const { execSync } = require('child_process');
      execSync(`python3 -c "
from PIL import Image
img = Image.new('RGB', (1200, 675), (41, 98, 255))
img.save('/tmp/bjh-cover.png')
print('cover created')
"`);
      console.log('Cover image created at /tmp/bjh-cover.png');
    } catch(e) {
      console.log('PIL not available:', e.message);
      // 备用：用 node canvas 或直接跳过
    }

    // 找文件上传 input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      try {
        await fileInput.setInputFiles('/tmp/bjh-cover.png');
        console.log('Cover uploaded via file input');
        await sleep(2000);
        await screenshot(page, 'pilot-05c-cover-uploaded.png');
        coverSet = true;
      } catch(e) {
        console.log('File upload failed:', e.message);
      }
    } else {
      console.log('No file input found for cover');
    }
  }

  // =======================================================
  // Step 6: 点击发布
  // =======================================================
  console.log('\n=== Step 6: 发布 ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);
  await screenshot(page, 'pilot-06-before-publish.png');

  const publishSelectors = [
    'button:has-text("发布")',
    '.publish-btn',
    '[class*="publish"] button',
    'button[class*="submit"]',
    'button:has-text("提交")',
  ];
  let publishClicked = false;
  for (const sel of publishSelectors) {
    const el = await page.$(sel);
    if (el) {
      console.log('Found publish button:', sel);
      const text = await el.textContent();
      console.log('Button text:', text);
      await el.click();
      publishClicked = true;
      console.log('Publish button clicked');
      break;
    }
  }

  if (!publishClicked) {
    console.log('Publish button not found! Listing all buttons:');
    const buttons = await page.$$eval('button', els => els.map(e => ({
      text: e.textContent?.trim(),
      cls: e.className.substring(0, 60)
    })));
    console.log(JSON.stringify(buttons, null, 2));
  }

  await sleep(3000);
  await screenshot(page, 'pilot-07-result.png');

  // 检查是否有验证码
  const captchaSelectors = [
    '[class*="captcha"]',
    '[class*="verify"]',
    '[class*="validation"]',
    'iframe[src*="captcha"]',
  ];
  let hasCaptcha = false;
  for (const sel of captchaSelectors) {
    const el = await page.$(sel);
    if (el) {
      console.log('CAPTCHA detected:', sel);
      hasCaptcha = true;
      break;
    }
  }

  if (hasCaptcha) {
    console.log('Waiting 600s for user to complete captcha...');
    for (let i = 0; i < 10; i++) {
      await sleep(60000);
      await screenshot(page, `pilot-captcha-wait-${i+1}.png`);
      console.log(`Waited ${(i+1)*60}s`);
      // 检查是否已完成
      const stillCaptcha = await page.$(captchaSelectors[0]);
      if (!stillCaptcha) {
        console.log('Captcha completed!');
        break;
      }
    }
    await screenshot(page, 'pilot-07-final.png');
  }

  // =======================================================
  // 生成报告
  // =======================================================
  console.log('\n=== 生成报告 ===');
  
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  // 检查成功指标
  const successIndicators = await page.$$eval(
    '[class*="success"], [class*="审核"], [class*="published"]',
    els => els.map(e => e.textContent?.trim().substring(0, 100))
  ).catch(() => []);
  console.log('Success indicators:', successIndicators);

  const report = `# 百家号发布流程手册（BJH-1 探索报告）

## 执行时间
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 文章信息
- 标题：${title}
- 正文字数：${body.length} 字

## 页面结构
- 标题选择器：${titleFilled ? '已找到（见脚本日志）' : '未找到'}
- 正文区类型：${bodyMethod.includes('UEditor') ? 'UEditor iframe' : bodyMethod.includes('contenteditable') ? 'contenteditable div' : '未确定'}
- 正文有效填入方法：${bodyMethod}
- 封面设置方式：${coverSet ? '已找到并操作' : '未找到封面按钮/上传区'}
- 发布按钮选择器：${publishClicked ? 'button:has-text("发布") 或类似' : '未找到'}

## 每步截图
- pilot-01-init.png: 初始页面
- pilot-02-tour-closed.png: 关闭引导后
- pilot-03-title.png: 标题填入后
- pilot-04-body.png: 正文填入后（填入：${bodyFilled}，方法：${bodyMethod}）
- pilot-05-cover-area.png: 封面设置区域
- pilot-06-before-publish.png: 发布前完整页面
- pilot-07-result.png: 发布结果

## 可复用脚本片段

### 连接 CDP
\`\`\`javascript
const resp = await fetch('http://127.0.0.1:18800/json/version');
const info = await resp.json();
const browser = await chromium.connectOverCDP(info.webSocketDebuggerUrl);
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
\`\`\`

### 填写标题
\`\`\`javascript
// 方法：找所有 contenteditable，高度最小的是标题
const editors = await page.$$('[contenteditable="true"]');
// 选最矮的（标题）
await titleEl.click();
await page.keyboard.press('Control+a');
await page.keyboard.type(title, { delay: 30 });
\`\`\`

### 填写正文
\`\`\`javascript
// 有效方法：${bodyMethod}
// 见脚本中 Step 4 对应代码块
\`\`\`

### 发布
\`\`\`javascript
const publishBtn = await page.$('button:has-text("发布")');
if (publishBtn) await publishBtn.click();
\`\`\`

## 遇到的问题和解决方案
- 之前 BJH-1 失败原因：字数0，内容填入失败
- 本次探索的填入方法：${bodyMethod}
- 封面：${coverSet ? '已设置' : '需要手动处理或找到正确选择器'}

## 发布结果
- 文章标题：${title}
- 当前页面 URL：${currentUrl}
- 是否存在验证码：${hasCaptcha ? '是（需用户手动处理）' : '否'}
- 状态：${publishClicked ? '已点击发布按钮，等待审核' : '发布按钮未找到，需要手动操作'}
`;

  fs.writeFileSync('/Users/wei/Desktop/opc-content/bjh-pilot-report.md', report);
  console.log('Report written to bjh-pilot-report.md');

  await browser.close();
  console.log('\npilot 完成，流程已摸清，报告在 bjh-pilot-report.md');
})().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
