/**
 * BJH-1 修复：在正文前加标题
 * 发现：百家号编辑区第一段是标题，后续是正文
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/wei/Desktop/opc-content/screenshots';
const TITLE = '我为什么选择入驻OPC社区：一个AI创业者的真实决策';

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
  
  let page = null;
  for (const p of pages) {
    if (p.url().includes('edit?type=news')) {
      const len = await p.evaluate(() => {
        const e = document.querySelector('[contenteditable]');
        return (e ? (e.innerText || '').length : 0);
      });
      if (len > 100) { page = p; break; }
    }
  }
  if (!page) { console.log('No page found'); process.exit(1); }
  
  await page.evaluate(() => window.scrollTo(0, 0));
  await ss(page, 'fix-01-before.png');
  
  // 在正文最前面插入标题
  // 方法：点击正文区开头，然后插入标题+换行
  const editor = await page.$('[contenteditable="true"]');
  if (!editor) { console.log('No editor found'); process.exit(1); }
  
  await editor.click();
  await sleep(300);
  
  // 移动到最开始
  await page.keyboard.press('Meta+Home');
  await sleep(200);
  
  // 检查光标位置（看第一个字）
  const firstContent = await editor.evaluate(el => (el.innerText || '').substring(0, 20));
  console.log('First content:', firstContent);
  
  // 在最前面输入标题 + Enter
  // 注意：不能用 type 输入标题（太慢），用 clipboard
  // 先把标题+换行写入剪贴板
  const titleWithNewline = TITLE + '\n';
  
  await page.evaluate(text => navigator.clipboard.writeText(text), titleWithNewline);
  await sleep(200);
  
  // 确保光标在最开始
  await page.keyboard.press('Meta+Home');
  await sleep(100);
  
  // 粘贴
  await page.keyboard.press('Meta+v');
  await sleep(1000);
  
  // 检查结果
  const content = await editor.evaluate(el => (el.innerText || '').substring(0, 100));
  console.log('Content after title insert:', content);
  
  await ss(page, 'fix-02-title-added.png');
  
  // 检查字数
  const wordCount = await page.evaluate(() => {
    const wc = document.querySelector('[class*="word-count"], [class*="wordCount"]');
    return wc ? wc.textContent : '未找到字数';
  });
  console.log('Word count:', wordCount);
  
  // 现在处理封面
  // 需要滚动到发文设置 -> 封面区域
  console.log('\n--- 处理封面 ---');
  
  // 展开发文设置
  const settingsEl = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if ((t === '发文设置' || t === '发文设置▾') && el.getBoundingClientRect().width > 0) {
        return { tag: el.tagName, cls: el.className.substring(0, 60) };
      }
    }
    return null;
  });
  console.log('Settings el:', settingsEl);
  
  // 先截图
  await ss(page, 'fix-03-before-settings.png');
  
  // 点发文设置
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if (t === '发文设置' || t.startsWith('发文设置')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.height < 50) {
          el.click();
          return;
        }
      }
    }
  });
  await sleep(1000);
  
  // 滚动到底部找封面
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1000);
  await ss(page, 'fix-04-settings-bottom.png');
  
  // 找封面上传区域
  const coverArea = await page.evaluate(() => {
    const coverEl = document.querySelector('[class*="cover"]');
    if (!coverEl) return null;
    const r = coverEl.getBoundingClientRect();
    return { cls: coverEl.className.substring(0, 60), y: r.y, h: r.height };
  });
  console.log('Cover area:', coverArea);
  
  // 滚动到封面区
  if (coverArea && coverArea.y > 0) {
    await page.evaluate(y => window.scrollTo(0, window.scrollY + y - 200), coverArea.y);
    await sleep(500);
  }
  
  await ss(page, 'fix-05-cover-area.png');
  
  // 找"选择封面"按钮
  const coverBtnClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], span'));
    for (const b of btns) {
      const t = (b.textContent || '').trim();
      const r = b.getBoundingClientRect();
      if ((t === '选择封面' || t.includes('选择封面') || t.includes('封面')) && r.width > 0 && r.y > 0) {
        b.click();
        return t;
      }
    }
    return null;
  });
  console.log('Cover button clicked:', coverBtnClicked);
  
  if (coverBtnClicked) {
    await sleep(1500);
    await ss(page, 'fix-06-cover-dialog.png');
    
    // 在封面对话框里找上传按钮
    const uploadBtn = await page.evaluate(() => {
      const modal = document.querySelector('.cheetah-modal-wrap, [class*="modal"], [class*="dialog"]');
      if (!modal || modal.getBoundingClientRect().width === 0) return null;
      const fi = modal.querySelector('input[type="file"]');
      return fi ? { found: true } : { found: false, text: (modal.innerText || '').substring(0, 200) };
    });
    console.log('Upload in cover dialog:', uploadBtn);
  }
  
  // 找所有 file input
  const fileInputInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="file"]')).map(fi => ({
      accept: fi.accept,
      visible: fi.getBoundingClientRect().width > 0,
      y: fi.getBoundingClientRect().y
    }));
  });
  console.log('File inputs:', JSON.stringify(fileInputInfo));
  
  // 生成并上传封面（选择可见的图片 file input）
  const { execSync } = require('child_process');
  try {
    execSync('python3 -c "from PIL import Image; Image.new(\'RGB\',(1200,675),(41,98,255)).save(\'/tmp/bjh-cover.png\')"');
    console.log('Cover image ready');
  } catch(e) {
    console.log('PIL error, trying alternative...');
    // 用系统默认图片
  }
  
  const fileInputs = await page.$$('input[type="file"]');
  for (const fi of fileInputs) {
    const accept = await fi.getAttribute('accept');
    console.log('File input accept:', accept);
    if (!accept || accept.includes('image') || accept === '*' || accept.includes('jpg') || accept.includes('png')) {
      try {
        await fi.setInputFiles('/tmp/bjh-cover.png');
        console.log('Cover uploaded!');
        await sleep(3000);
        await ss(page, 'fix-07-cover-uploaded.png');
        break;
      } catch(e) {
        console.log('Upload error:', e.message);
      }
    }
  }
  
  // 最终发布
  console.log('\n--- 最终发布 ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await ss(page, 'fix-08-before-publish.png');
  
  // 点发布
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pub = btns.find(b => {
      const t = (b.textContent || '').trim();
      const r = b.getBoundingClientRect();
      return t === '发布' && !b.disabled && r.width > 0;
    });
    if (pub) pub.click();
  });
  
  await sleep(2000);
  await ss(page, 'fix-09-after-publish.png');
  
  // 检查是否有错误或成功
  const afterState = await page.evaluate(() => {
    // 找错误提示（通常在顶部）
    const errBanner = document.querySelector('[class*="error-banner"], [class*="errorMsg"], [class*="tip-error"]');
    const err = document.querySelector('[class*="error"]');
    const toasts = Array.from(document.querySelectorAll('[class*="toast"], [class*="message"]'))
      .filter(e => e.getBoundingClientRect().width > 0)
      .map(e => (e.innerText || '').substring(0, 100));
    
    // 找顶部提示
    const topBanner = document.querySelector('[class*="banner"], .cheetah-alert, [class*="alert"]');
    
    return {
      url: window.location.href,
      topBanner: topBanner ? (topBanner.innerText || '').substring(0, 100) : null,
      toasts,
      pageTitle: document.title
    };
  });
  console.log('After publish state:', JSON.stringify(afterState, null, 2));
  
  // 检查顶部是否还有错误
  await page.screenshot({
    path: SCREENSHOTS + '/fix-09-top.png',
    clip: { x: 0, y: 0, width: 1280, height: 80 }
  });
  
  // 如果成功跳转或有确认弹窗
  const modal2 = await page.evaluate(() => {
    const m = document.querySelector('.cheetah-modal-wrap');
    if (!m || m.getBoundingClientRect().width === 0) return null;
    return {
      text: (m.innerText || '').substring(0, 300),
      btns: Array.from(m.querySelectorAll('button')).map(b => b.textContent.trim())
    };
  });
  console.log('Modal after publish:', JSON.stringify(modal2));
  
  if (modal2) {
    // 确认
    await page.evaluate(() => {
      const m = document.querySelector('.cheetah-modal-wrap');
      if (!m) return;
      const btns = Array.from(m.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.textContent || '').trim();
        if (['发布', '确认', '确定', '立即发布'].includes(t)) { b.click(); return; }
      }
      if (btns.length > 0) btns[0].click();
    });
    await sleep(4000);
    await ss(page, 'fix-10-final.png');
  }
  
  const finalState = await page.evaluate(() => window.location.href);
  console.log('Final URL:', finalState);
  
  await browser.close();
  console.log('\nDone');
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
