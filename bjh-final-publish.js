/**
 * BJH-1 最终发布脚本
 * 策略：点发布按钮，观察弹窗，在弹窗中填写标题+封面，然后确认
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
  console.log('Found page with content');
  
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await ss(page, 'pilot-final-01-start.png');
  
  // 点击发布按钮
  console.log('Clicking publish...');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pub = btns.find(b => {
      const t = (b.textContent || '').trim();
      const r = b.getBoundingClientRect();
      return t === '发布' && !b.disabled && r.width > 0;
    });
    if (pub) { pub.click(); return true; }
    return false;
  });
  console.log('Publish clicked:', clicked);
  
  await sleep(2000);
  await ss(page, 'pilot-final-02-after-click.png');
  
  // 分析点击后出现的弹窗
  const modal = await page.evaluate(() => {
    const modals = Array.from(document.querySelectorAll(
      '.cheetah-modal-wrap, [class*="modal"], [class*="dialog"], [class*="popup"], [class*="drawer"]'
    )).filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 100 && r.height > 50;
    });
    
    if (modals.length === 0) return null;
    
    const m = modals[0];
    const inputs = Array.from(m.querySelectorAll(
      'input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
    )).filter(e => e.getBoundingClientRect().width > 0)
    .map(e => ({
      tag: e.tagName,
      type: e.type || '',
      ph: e.placeholder || e.getAttribute('data-placeholder') || '',
      val: (e.value || e.innerText || '').substring(0, 50),
      cls: e.className.substring(0, 40)
    }));
    
    const fileInputs = Array.from(m.querySelectorAll('input[type="file"]')).length;
    const buttons = Array.from(m.querySelectorAll('button')).map(b => b.textContent.trim());
    
    return {
      cls: m.className.substring(0, 80),
      text: m.innerText.substring(0, 500),
      inputs,
      fileInputs,
      buttons
    };
  });
  console.log('Modal after publish click:', JSON.stringify(modal, null, 2));
  
  if (!modal) {
    console.log('No modal appeared - checking page for errors...');
    const errors = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="error"], [class*="Error"]'))
        .filter(e => e.getBoundingClientRect().width > 0)
        .map(e => (e.innerText || '').substring(0, 100));
    });
    console.log('Errors:', errors);
    await ss(page, 'pilot-final-03-no-modal.png');
  } else {
    // 在弹窗中填写标题（如果有）
    const titleInput = modal.inputs.find(i => i.ph.includes('标题') || i.ph.includes('title'));
    if (titleInput) {
      console.log('Found title input in modal:', titleInput);
      await page.evaluate((title) => {
        const modal = document.querySelector('.cheetah-modal-wrap');
        const inputs = modal.querySelectorAll('input, textarea, [contenteditable]');
        for (const inp of inputs) {
          const ph = inp.placeholder || inp.getAttribute('data-placeholder') || '';
          if (ph.includes('标题') || ph.includes('title')) {
            inp.focus();
            if (inp.tagName === 'INPUT' || inp.tagName === 'TEXTAREA') {
              inp.value = title;
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              inp.innerText = title;
              inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return true;
          }
        }
        return false;
      }, TITLE);
      await sleep(500);
    }
    
    // 处理封面（如果有文件上传）
    if (modal.fileInputs > 0) {
      console.log('File input in modal, uploading cover...');
      const fileInput = await page.$('.cheetah-modal-wrap input[type="file"]');
      if (fileInput) {
        // 先确保封面图存在
        const { execSync } = require('child_process');
        try {
          execSync('python3 -c "from PIL import Image; Image.new(\'RGB\',(1200,675),(41,98,255)).save(\'/tmp/bjh-cover.png\')"');
        } catch(e) {}
        await fileInput.setInputFiles('/tmp/bjh-cover.png');
        await sleep(3000);
        await ss(page, 'pilot-final-03-cover.png');
      }
    }
    
    await ss(page, 'pilot-final-03-modal-filled.png');
    
    // 找确认/发布按钮
    const confirmed = await page.evaluate(() => {
      const modal = document.querySelector('.cheetah-modal-wrap');
      if (!modal) return null;
      const btns = Array.from(modal.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.textContent || '').trim();
        if (t === '发布' || t === '确认' || t === '确定' || t === '立即发布' || t === '提交') {
          b.click();
          return t;
        }
      }
      console.log('Modal buttons:', btns.map(b => b.textContent.trim()));
      return null;
    });
    console.log('Modal confirmed:', confirmed);
    
    await sleep(4000);
    await ss(page, 'pilot-final-04-result.png');
  }
  
  const finalState = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    text: document.body.innerText.substring(0, 200)
  }));
  console.log('Final state:', JSON.stringify(finalState, null, 2));
  
  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
