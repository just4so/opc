/**
 * BJH-1 探索：点开"发文设置"，看里面有什么
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
  
  // 找有正文的编辑页
  let page = null;
  for (const p of pages) {
    if (p.url().includes('edit?type=news')) {
      const len = await p.evaluate(() => {
        const e = document.querySelector('[contenteditable="true"]');
        return (e ? (e.innerText || '').length : 0);
      });
      if (len > 100) { page = p; break; }
    }
  }
  if (!page) { console.log('No page found'); process.exit(1); }
  
  console.log('Found page with content');
  
  // 截当前状态
  await ss(page, 'settings-00-before.png');
  
  // 点"发文设置"展开
  const settingsEl = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const el = all.find(e => {
      const t = (e.textContent || '').trim();
      return t === '发文设置' || t === '发文设置▾' || t === '发文设置 ▾';
    });
    if (el) {
      const r = el.getBoundingClientRect();
      return { found: true, tag: el.tagName, cls: el.className.substring(0,60), x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return { found: false };
  });
  console.log('Settings element:', JSON.stringify(settingsEl));
  
  if (settingsEl.found) {
    await page.mouse.click(settingsEl.x + settingsEl.w / 2, settingsEl.y + settingsEl.h / 2);
    console.log('Clicked settings');
    await sleep(1500);
    await ss(page, 'settings-01-opened.png');
    
    // 分析展开后的内容
    const expanded = await page.evaluate(() => {
      // 找设置面板/抽屉
      const panels = Array.from(document.querySelectorAll(
        '[class*="setting"], [class*="Setting"], [class*="panel"], [class*="drawer"], [class*="publish"]'
      )).filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 100 && r.height > 50;
      });
      
      return panels.map(p => ({
        cls: p.className.substring(0, 80),
        text: (p.innerText || '').substring(0, 300),
        h: p.getBoundingClientRect().height
      }));
    });
    console.log('Expanded panels:', JSON.stringify(expanded, null, 2));
    
    // 找所有输入框（标题可能在这里）
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(
        'input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]), textarea, [contenteditable="true"]'
      )).filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).map(e => ({
        tag: e.tagName,
        type: e.type || '',
        ph: e.placeholder || e.getAttribute('data-placeholder') || '',
        val: (e.value || e.innerText || '').substring(0, 60),
        cls: e.className.substring(0, 60),
        y: Math.round(e.getBoundingClientRect().y)
      }));
    });
    console.log('All inputs after settings opened:', JSON.stringify(inputs, null, 2));
  }
  
  // 不管怎样，截取完整页面
  await page.screenshot({ path: SCREENSHOTS + '/settings-02-full.png', fullPage: true });
  console.log('[ss] settings-02-full.png (full page)');
  
  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
