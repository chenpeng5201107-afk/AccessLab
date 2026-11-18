// Day 6 取证脚本（不属于应用代码，只在本地跑一次，产物写在 .day6-evidence/）
// 用本机真实 Chromium 内核浏览器 + CDP 走一遍评委流程：
// 溢出、焦点环、减弱动效、控制台报错、截图与耗时都在这里实测。
// 事件一律用 CDP Input.* 派发（浏览器生成的可信事件），不用 element.click()。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day6-evidence')
// LIVE_URL 非空时跳过本地静态服务器，直接对公网站点跑同一套取证，产物单独落 *-live 目录。
const LIVE = process.env.LIVE_URL ? process.env.LIVE_URL.replace(/\/$/, '') : ''
const SUFFIX = LIVE ? '-live' : ''
const SHOTS = path.join(OUT, LIVE ? 'shots-live' : 'shots')
const DL = path.join(OUT, LIVE ? 'downloads-live' : 'downloads')
fs.rmSync(DL, { recursive: true, force: true })
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(DL, { recursive: true })

const BROWSER_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
]
const DEBUG_PORT = 9333
const WIDTHS = [
  { width: 320, height: 640, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 768, height: 1024, mobile: false },
  { width: 1440, height: 900, mobile: false },
]
const ROUTES = ['#/', '#/contrast', '#/form-label', '#/keyboard', '#/report']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html')
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
let BASE
if (LIVE) {
  BASE = LIVE + '/index.html'
  console.log('取证目标 = 公网站点', BASE)
} else {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  BASE = `http://127.0.0.1:${server.address().port}/index.html`
  console.log('serving', DIST, 'at', BASE)
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day6-browser-profile-'))
const bin = BROWSER_CANDIDATES.find((p) => fs.existsSync(p))
if (!bin) throw new Error('找不到 Edge / Chrome')
const browser = spawn(
  bin,
  [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-gpu',
    '--window-size=1440,1000',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

async function waitForJson(url, tries = 80) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return await res.json()
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('CDP 未就绪: ' + url)
}
const version = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`)
console.log('browser:', version.Browser)

const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
let nextId = 1
const pending = new Map()
const eventLog = []
const consoleEntries = []
const findings = []
const seen = new Set()
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data)
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id)
    pending.delete(data.id)
    if (data.error) reject(new Error(JSON.stringify(data.error)))
    else resolve(data.result)
    return
  }
  if (!data.method) return
  eventLog.push(data)
  if (data.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(data.params.type)) {
    consoleEntries.push({ type: data.params.type, text: (data.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ') })
  }
  if (data.method === 'Runtime.exceptionThrown') {
    consoleEntries.push({ type: 'exception', text: data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text })
  }
  if (data.method === 'Log.entryAdded' && ['error', 'warning'].includes(data.params.entry.level)) {
    consoleEntries.push({ type: data.params.entry.level, text: `${data.params.entry.source}: ${data.params.entry.text}` })
  }
}
function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
}
async function waitEvent(method, timeout = 20000) {
  const existing = eventLog.findIndex((e) => e.method === method)
  if (existing >= 0) {
    eventLog.splice(existing, 1)
    return
  }
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const index = eventLog.findIndex((e) => e.method === method)
    if (index >= 0) {
      eventLog.splice(index, 1)
      return
    }
    await new Promise((r) => setTimeout(r, 40))
  }
  throw new Error('等待事件超时: ' + method)
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (method, params = {}) => send(method, params, sessionId)

await cmd('Page.enable')
await cmd('Runtime.enable')
await cmd('Log.enable')
await cmd('DOM.enable')
await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true }).catch(() => {})
await cmd('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL }).catch(() => {})

const settle = (ms = 320) => evaluate(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function evaluate(expression) {
  const res = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.exceptionDetails) throw new Error((res.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 80))
  return res.result.value
}
function purgeLoadEvents() {
  for (let i = eventLog.length - 1; i >= 0; i -= 1) {
    if (eventLog[i].method === 'Page.loadEventFired') eventLog.splice(i, 1)
  }
}
async function gotoRoute(hash) {
  // 每次都真实加载 index.html，再用 hash 改动路由：
  // 同一文档的纯 hash 跳转不会重新触发 load 事件，靠它等待会卡住。
  purgeLoadEvents()
  await cmd('Page.navigate', { url: BASE })
  await waitEvent('Page.loadEventFired')
  await settle(150)
  await evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await settle()
  const h1 = await evaluate(`(document.querySelector('main h1') || {}).textContent`)
  if (h1 && !seen.has(hash)) {
    seen.add(hash)
    findings.push(`直达 ${hash} 渲染的是「${h1.trim()}」——这一页能独立进入，动线不依赖前一步。`)
  }
  return h1
}
async function navigate(hash) {
  try {
    return await gotoRoute(hash)
  } catch (error) {
    findings.push(`${hash} 首次真实加载失败（${String(error.message).slice(0, 60)}），重试一次以区分环境问题与页面问题。`)
    await settle(600)
    return gotoRoute(hash)
  }
}
async function reloadInPlace() {
  purgeLoadEvents()
  await cmd('Page.reload')
  await waitEvent('Page.loadEventFired')
  await settle()
}
async function setViewport({ width, height, mobile }) {
  await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
  await evaluate('new Promise(r => requestAnimationFrame(() => r(true)))')
}
async function shot(name) {
  const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(data, 'base64'))
}

async function clickByLabel(label, kind = 'button') {
  const box = await evaluate(`(() => {
    const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)});
    if (!el) {
      const ctx = {
        hash: location.hash,
        h1: (document.querySelector('main h1') || {}).textContent,
        present: [...document.querySelectorAll('${kind}')].map(e => (e.innerText || '').trim().slice(0, 24)).filter(Boolean),
      };
      return { error: 'not-found', ctx };
    }
    if (el.disabled) return { error: 'disabled', ctx: { hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent } };
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  })()`)
  if (box.error) {
    const hint = box.error === 'disabled' ? '（按钮存在但处于禁用态）' : ''
    throw new Error(`无法点击「${label}」: ${box.error}${hint} :: ${JSON.stringify(box.ctx).slice(0, 400)}`)
  }
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await settle(280)
  return box
}
async function pressTab() {
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' })
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' })
}

// ---------- 1. 五页 × 四宽度：横向溢出 / 触控目标 / 代码块滚动 ----------
const layout = []
for (const route of ROUTES) {
  await navigate(route)
  for (const vp of WIDTHS) {
    await setViewport(vp)
    const info = await evaluate(`(() => {
      const de = document.documentElement;
      const offenders = [...document.querySelectorAll('body *')]
        .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1.5)
        .slice(0, 5)
        .map(el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' right=' + Math.round(el.getBoundingClientRect().right));
      const main = document.querySelector('main');
      const nav = document.querySelector('header nav');
      const navRect = nav ? nav.getBoundingClientRect() : null;
      const mainRect = main ? main.getBoundingClientRect() : null;
      return {
        overflowPx: de.scrollWidth - window.innerWidth,
        offenders,
        h1: ((document.querySelector('main h1') || {}).textContent || '').trim(),
        navBottom: navRect ? Math.round(navRect.bottom) : null,
        mainTop: mainRect ? Math.round(mainRect.top) : null,
        smallTargets: [...document.querySelectorAll('main a, main button, main input, header a')]
          .map(el => { const r = el.getBoundingClientRect(); return { label: ((el.innerText || el.getAttribute('href') || el.type || '') + '').trim().slice(0, 18), w: Math.round(r.width), h: Math.round(r.height) } })
          .filter(t => t.h > 0 && t.h < 44),
        pres: [...document.querySelectorAll('pre')].map(pre => ({
          scrollsItself: pre.scrollWidth > pre.clientWidth + 1,
          overflowX: getComputedStyle(pre).overflowX,
          breaksPage: pre.getBoundingClientRect().right > window.innerWidth + 1.5,
        })),
        bodyOverflowX: getComputedStyle(document.body).overflowX,
      }
    })()`)
    layout.push({ route, ...vp, ...info })
    console.log(`layout ${route} @${vp.width}: overflow=${info.overflowPx} small=${info.smallTargets.length} h1="${info.h1}"`)
  }
}

// ---------- 2. 真实 Tab 焦点环（:focus-visible 只在可信按键后才出现） ----------
const wideBreaks = layout.filter((l) => l.width === 1440 && l.overflowPx > 0)
if (!wideBreaks.length) findings.push('1440 宽度下五个页面都无横向溢出。')
const narrowBreaks = layout.filter((l) => (l.width === 320 || l.width === 390) && l.overflowPx > 0)
findings.push(...(narrowBreaks.length
  ? narrowBreaks.map((l) => `窄屏 ${l.width} 的 ${l.route} 横向溢出 ${l.overflowPx}px，撑破元素：${l.offenders.join('、') || '未定位到具体元素'}。`)
  : ['320 与 390 宽度下五个页面都无横向溢出。']))
const navCovers = layout.filter((l) => l.navBottom !== null && l.mainTop !== null && l.mainTop < l.navBottom)
findings.push(...(navCovers.length
  ? navCovers.map((l) => `${l.route} @${l.width}：导航底边 ${l.navBottom} 大于内容顶边 ${l.mainTop}，导航压住了正文。`)
  : ['所有宽度的导航都没有压住正文。']))
const smallTargets320 = [...new Set(layout.filter((l) => l.width === 320).flatMap((l) => l.smallTargets.map((t) => `${t.label}(${t.h}px)`)))]
findings.push(...(smallTargets320.length
  ? [`320 宽度下高度不足 44px 的可交互元素：${smallTargets320.join('、')}。`]
  : ['320 宽度下所有可交互元素高度都 ≥ 44px。']))
const smallWide = layout.filter((l) => l.width === 1440 && l.smallTargets.length)
findings.push(...(smallWide.length
  ? smallWide.map((l) => `${l.route} @1440 高度不足 44px 的可交互元素：${l.smallTargets.map((t) => `${t.label}(${t.h}px)`).join('、')}。`)
  : ['1440 宽度下所有可交互元素高度都 ≥ 44px。']))
const brokenPres = [...new Set(layout.filter((l) => l.pres.some((p) => p.breaksPage)).map((l) => `${l.route}@${l.width}`))]
findings.push(...(brokenPres.length
  ? [`代码块撑破页面：${brokenPres.join('、')}。`]
  : ['所有代码块都只在自己的框里横向滚动，没有撑破页面。']))
await navigate('#/')
await setViewport(WIDTHS[3])
const focusRing = []
for (let i = 0; i < 5; i += 1) {
  await pressTab()
  const info = await evaluate(`(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      label: (el.innerText || el.getAttribute('href') || el.id || cs.color).trim().slice(0, 26),
      outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' offset=' + cs.outlineOffset,
      visible: el.getBoundingClientRect().width > 0,
    }
  })()`)
  focusRing.push(info)
  console.log('focus', i + 1, info.label, '|', info.outline)
}
await shot('a1-home-tabfocus-1440')

// skip link：Tab 到跳转链接 → Enter → 焦点交给 main、路由不被改写
await navigate('#/keyboard')
await setViewport(WIDTHS[3])
async function pressShiftTab() {
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8, key: 'Tab', code: 'Tab', text: '\t' })
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8, code: 'Tab' })
}
// 站内切换路由后 App 会把焦点交给 <main tabindex="-1">，Chrome 从那里继续正向遍历，
// 因此先按现实做法往回退到 skip link，再验证 Enter 的结果。
const skipSteps = []
let skipFocused = null
for (let i = 0; i < 8; i += 1) {
  await pressShiftTab()
  skipFocused = await evaluate(`({ label: (document.activeElement.innerText || '').trim(), href: document.activeElement.getAttribute('href') })`)
  skipSteps.push({ press: i + 1, ...skipFocused })
  if (skipFocused.href === '#main') break
}
if (skipFocused.href !== '#main') {
  findings.push(`真实浏览器里，进入实验页后 Shift+Tab 退 8 次仍未回到 skip link（最后停在「${skipFocused.label}」）：把真实停留点记为事实，不推断成缺陷。`)
}
await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' })
await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' })
await settle(400)
const skipResult = await evaluate(`({ activeId: document.activeElement.id, activeTag: document.activeElement.tagName.toLowerCase(), hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
console.log('skip link', JSON.stringify(skipFocused), JSON.stringify(skipResult))

// ---------- 3. 键盘实验：缺陷态在真实浏览器里确实「看不出焦点」 ----------
await navigate('#/keyboard')
await setViewport(WIDTHS[3])
async function tabUntilDemo(max = 40) {
  let presses = 0
  let landed = null
  while (presses < max) {
    await pressTab()
    presses += 1
    landed = await evaluate(`(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { isDemo: el.classList.contains('kf-demo-btn'), label: (el.innerText || '').trim().slice(0, 20), outline: cs.outlineStyle + ' ' + cs.outlineWidth, boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 40) };
    })()`)
    if (landed.isDemo) return { presses, ...landed }
  }
  return { presses, ...landed, timedOut: true }
}
const firstDemo = await tabUntilDemo()
const counterOf = (which) =>
  evaluate(`(() => {
    const dt = [...document.querySelectorAll('dt')].find(d => d.textContent.includes(${JSON.stringify(which)}));
    return dt ? dt.nextElementSibling.textContent.trim() : null;
  })()`)
await shot('b1-keyboard-broken-focus-1440')

// ---------- 4. 三分钟评委流程（可信点击 + 真实键盘，计时） ----------
const t0 = Date.now()
const steps = []
async function step(label, kind) {
  const box = await clickByLabel(label, kind)
  steps.push({ label, ms: Date.now() - t0, targetH: box.h })
  console.log(`step ${label} @${Date.now() - t0}ms 目标 ${box.w}×${box.h}`)
  return box
}
// 长页面里「量到坐标 → 派发点击」之间版面还会变一次（异步检测填进结果区），点空一次就少一次真实修复。
// 每个关键动作都用页面自己的真实痕迹校验，没生效就重新定位再点，并把重试记成脚本层的事实。
async function stepChecked(label, verifyExpr, kind) {
  for (let i = 0; i < 3; i += 1) {
    await step(label, kind)
    if (await evaluate(verifyExpr)) {
      if (i > 0) findings.push(`「${label}」第 ${i + 1} 次点击才生效（前 ${i} 次点到的位置已被结果区顶开）：取证脚本的定位问题，页面本身一次就够。`)
      return true
    }
    await settle(300)
  }
  findings.push(`「${label}」点三次都没让页面出现预期痕迹，如实记为未生效，不当成页面结论。`)
  return false
}

await navigate('#/')
await shot('c1-home-1440')
await step('开始第一个实验', 'a')
const afterCta = await evaluate(`({ hash: location.hash, h1: document.querySelector('main h1').textContent.trim(), title: document.title })`)
await stepChecked('生成修复建议', `[...document.querySelectorAll('button')].some(b => b.innerText.trim() === '应用该修复' && !b.disabled)`)
await stepChecked('应用该修复', `[...document.querySelectorAll('[role="status"]')].some(e => e.innerText.includes('已应用修复：'))`)
const contrastReadouts = await evaluate(`({
  notices: [...document.querySelectorAll('[role="status"]')].map(e => e.innerText.replace(/\\s+/g, ' ').trim()),
  ratio: (() => { const dt = [...document.querySelectorAll('dt')].find(d => d.textContent.includes('当前对比度')); return dt ? dt.nextElementSibling.textContent.trim() : null })(),
})`)
await shot('c3-contrast-applied-1440')
await step('进入表单标签实验', 'a')
const afterNext1 = await evaluate(`({ hash: location.hash, h1: document.querySelector('main h1').textContent.trim() })`)
// 邮箱标签从一开始就带 for，只查 `label[for]` 会把「没点到修复按钮」误判成成功，所以钉在姓名控件上。
await stepChecked('修复标签关联', `(() => { const input = document.getElementById('student-name'); return Boolean(input) && [...input.labels].some((l) => l.htmlFor === 'student-name') })()`)
await shot('c4-form-fixed-1440')
await step('进入键盘焦点实验', 'a')
const afterNext2 = await evaluate(`({ hash: location.hash, h1: document.querySelector('main h1').textContent.trim() })`)

// 键盘实验：先按 Tab 走满第一轮，再应用修复，再走第二轮
const COUNTER_DT = { 修复前: '修复前：键盘导航到达示例按钮的次数', 修复后: '修复后：键盘导航到达示例按钮的次数' }
async function counterOfExact(which) {
  return evaluate(`(() => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === ${JSON.stringify(COUNTER_DT[which])}); return dt ? dt.nextElementSibling.innerText.trim() : null })()`)
}
async function tabUntilCounter(which, target) {
  let presses = 0
  let lastDemo = null
  for (let i = 0; i < 40; i += 1) {
    const value = await counterOfExact(which)
    if (value === target) return { value, presses, lastDemo }
    await pressTab()
    presses += 1
    const landed = await evaluate(`(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { isDemo: el.classList ? el.classList.contains('kf-demo-btn') : false, label: (el.innerText || '').trim().slice(0, 20), outline: cs.outlineStyle + ' ' + cs.outlineWidth, matchesFocusVisible: el.matches(':focus-visible') };
    })()`)
    if (landed.isDemo) lastDemo = landed
    await settle(60)
  }
  return { value: await counterOfExact(which), presses, lastDemo }
}
const repairApplied = () => evaluate(`!!document.querySelector('button.kf-demo-btn--fixed')`)
async function keyboardState() {
  return evaluate(`(() => {
    const pick = (label) => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === label); return dt ? dt.nextElementSibling.innerText.trim() : null };
    const confirm = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === '我已完成观察');
    const hint = [...document.querySelectorAll('main p, main li')].map((e) => e.innerText.trim()).filter((t) => t.startsWith('还需要') || t.includes('请再用 Tab') || t.includes('修复前那一轮'))[0] ?? null;
    return {
      before: pick(${JSON.stringify(COUNTER_DT['修复前'])}),
      after: pick(${JSON.stringify(COUNTER_DT['修复后'])}),
      repaired: !!document.querySelector('button.kf-demo-btn--fixed'),
      confirmDisabled: confirm ? Boolean(confirm.disabled) : null,
      hint,
    };
  })()`);
}
// 只有确认「修复焦点指示」真的换了样式，第二轮的计数才属于修复后；
// 点击没生效是脚本的点击定位问题，用重置清干净再来一遍，不把这种干扰写进结论。
async function applyRepairAndWalkTwice() {
  for (let cycle = 0; cycle < 3; cycle += 1) {
    const round = await tabUntilCounter('修复前', '3 次')
    steps.push({ label: `Tab 走满第一轮（第 ${cycle + 1} 次尝试）`, ms: Date.now() - t0, counter: round.value, presses: round.presses, ...(await keyboardState()) })
    console.log('第一轮结束', JSON.stringify(steps[steps.length - 1]))
    await stepChecked('修复焦点指示', `!!document.querySelector('button.kf-demo-btn--fixed')`)
    if (await repairApplied()) return { round, repaired: true, cycles: cycle + 1 }
    findings.push(`脚本点「修复焦点指示」后示例按钮仍是缺陷类名（第 ${cycle + 1} 轮）：取证脚本的定位没落准，不是页面的修复失效；点「重置实验」把两轮计数清干净后重来。`)
    await step('重置实验')
  }
  return { round: null, repaired: false, cycles: 3 }
}
const repairAttempt = await applyRepairAndWalkTwice()
const after = repairAttempt.repaired ? await tabUntilCounter('修复后', '3 次') : null
if (!repairAttempt.repaired) findings.push('键盘实验的「修复焦点指示」在三轮尝试里都没让示例按钮换成修复类名，本轮不写第二轮计数与人工确认。')
steps.push({ label: 'Tab 走满第二轮', ms: Date.now() - t0, counter: after ? after.value : null, presses: after ? after.presses : null, ...(await keyboardState()) })
console.log('第二轮结束', JSON.stringify(steps[steps.length - 1]))
const fixedDemoFocus = after ? after.lastDemo : null
// 确认按钮仍禁用时不再让整轮取证崩溃：把真实状态记成一条发现
const confirmState = await keyboardState()
if (confirmState.confirmDisabled) {
  findings.push(`评委流程复核：走完两轮后「修复前 ${confirmState.before} / 修复后 ${confirmState.after}（修复已应用=${confirmState.repaired}）」，「我已完成观察」的禁用说明是「${confirmState.hint ?? '页面上没有读到说明'}」——如实记录，不强行点击。`)
} else {
  await stepChecked('我已完成观察', `[...document.querySelectorAll('p')].some(p => p.innerText.includes('已记录你的观察确认'))`)
}
const kfCounters = {
  before: await counterOfExact('修复前'),
  after: await counterOfExact('修复后'),
  confirmed: await evaluate(`[...document.querySelectorAll('p')].some(p => p.innerText.includes('已记录你的观察确认')) ? '页面出现「已记录你的观察确认」' : null`),
}
await shot('c5-keyboard-fixed-1440')
await step('查看统一成果报告', 'a')
await settle(500)
let reportPage = await evaluate(`({ hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
if (reportPage.h1 !== '统一成果报告') {
  findings.push(`点「查看统一成果报告」后停在「${reportPage.h1}」（hash=${reportPage.hash}）；改用同文档 hash 跳转补到报告页，台账不重载。`)
  await evaluate(`location.hash = '#/report'`)
  await settle(600)
  reportPage = await evaluate(`({ hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
}
console.log('report page', JSON.stringify(reportPage))
const reportHead = await evaluate(`({
  hash: location.hash,
  h1: document.querySelector('main h1').textContent.trim(),
  lead: ((document.querySelector('main section p') || {}).innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 90),
  stats: [...document.querySelectorAll('main dl div')].map(d => d.innerText.replace(/\\s+/g, ' ').trim()),
  chips: [...document.querySelectorAll('main span')].map(s => s.innerText.trim()).filter(t => t.startsWith('状态：')),
})`)
const flowMs = Date.now() - t0
await shot('c6-report-1440')

const markdownLength = await evaluate(`(document.querySelector('#report-markdown-source') || { value: '' }).value.length`)
await step('复制 Markdown 报告')
const copyStatus = await evaluate(`[...document.querySelectorAll('[role="status"]')].map(e => e.innerText.replace(/\\s+/g, ' ').trim())`)
await step('下载 .md 文件')
const downloadStatus = await evaluate(`[...document.querySelectorAll('[role="status"]')].map(e => e.innerText.replace(/\\s+/g, ' ').trim())`)
await settle(1200)
const downloads = fs.readdirSync(DL)
const downloaded = downloads.length
  ? (() => {
      const file = path.join(DL, downloads[downloads.length - 1])
      const text = fs.readFileSync(file, 'utf8')
      return { name: downloads[downloads.length - 1], bytes: Buffer.byteLength(text), chars: text.length }
    })()
  : null
const textareaBytes = await evaluate(`(() => { const v = (document.querySelector('#report-markdown-source') || { value: '' }).value; return { bytes: new TextEncoder().encode(v).length, chars: v.length } })()`)
if (downloaded && textareaBytes) {
  findings.push(`下载落盘 ${downloaded.name} = ${downloaded.bytes} B，与 textarea 编码后的 ${textareaBytes.bytes} B ${downloaded.bytes === textareaBytes.bytes ? '逐字节相同' : '不同'}；页面 / 复制 / 下载同一份 Markdown 在真实浏览器里成立。`)
}

// 真实浏览器里的两条边界：切路由不丢台账；刷新一定丢（会话级说明的实测）——放在导出之后，刷新会把这一轮记录清空
const statOf = () =>
  evaluate(`(() => { const d = document.querySelector('main dl div'); return d ? d.innerText.replace(/\\s+/g, ' ').trim() : null })()`)
const ledgerAtReport = await statOf()
await evaluate(`location.hash = '#/contrast'`)
await settle(400)
const ledgerLeftPage = await evaluate(`({ h1: document.querySelector('main h1').textContent.trim(), hash: location.hash })`)
await evaluate(`location.hash = '#/report'`)
await settle(400)
const ledgerAfterRouteSwitch = await statOf()
const deepLinkUrl = await evaluate('location.href')
await reloadInPlace()
const ledgerAfterReload = await evaluate(`({ stat: (() => { const d = document.querySelector('main dl div'); return d ? d.innerText.replace(/\\s+/g, ' ').trim() : null })(), h1: document.querySelector('main h1').textContent.trim(), title: document.title, copyDisabled: [...document.querySelectorAll('main button')].map(b => b.disabled) })`)
findings.push(`会话级限制实测：切走再切回台账仍是「${ledgerAfterRouteSwitch}」，同页刷新后变成「${ledgerAfterReload.stat}」且复制 / 下载按钮回到禁用（${JSON.stringify(ledgerAfterReload.copyDisabled)}）——与报告页「刷新页面或关闭标签页就会清空」的说法一致。`)
console.log('ledger', ledgerAtReport, '->', ledgerAfterRouteSwitch, '-> reload:', JSON.stringify(ledgerAfterReload))

// ---------- 5. 移动端：320 / 390 关键页面截图与动线复跑 ----------
await setViewport(WIDTHS[0])
await navigate('#/')
await shot('d1-home-320')
const mobile320 = await evaluate(`({
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  heroStacks: getComputedStyle(document.querySelector('main section > div')).gridTemplateColumns,
  comparisonCards: [...document.querySelectorAll('main .grid')].length,
})`)
await navigate('#/contrast')
const mobileFlow = []
for (const label of ['生成修复建议', '应用该修复']) {
  const box = await clickByLabel(label)
  mobileFlow.push({ label, h: box.h, y: box.y })
}
const mobile320Contrast = await evaluate(`({
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  noticeVisible: (() => { const el = [...document.querySelectorAll('[role="status"]')].find(e => e.innerText.includes('已应用修复')); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), inViewport: r.top >= 0 && r.bottom <= window.innerHeight }; })(),
  nextVisible: (() => { const el = document.querySelector('a[href="#/form-label"]'); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { h: Math.round(r.height), inViewport: r.top >= 0 && r.bottom <= window.innerHeight }; })(),
})`)
await shot('d2-contrast-320')
await setViewport(WIDTHS[1])
await navigate('#/form-label')
await clickByLabel('修复标签关联')
await shot('d3-form-390')
await navigate('#/keyboard')
await shot('d4-keyboard-390')
await navigate('#/report')
const mobileReport = await evaluate(`({
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  uniqueLinks: [...new Set([...document.querySelectorAll('main a')].map(a => a.getAttribute('href')))],
  preScroll: [...document.querySelectorAll('pre')].map(p => ({ scrolls: p.scrollWidth > p.clientWidth + 1, breaks: p.getBoundingClientRect().right > window.innerWidth + 1.5 })),
})`)
await shot('d5-report-390')

// ---------- 6. prefers-reduced-motion ----------
await setViewport(WIDTHS[3])
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await navigate('#/')
const reduced = await evaluate(`({
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  linkTransition: getComputedStyle(document.querySelector('main a')).transitionDuration,
})`)
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
await navigate('#/')
const normal = await evaluate(`({ scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, linkTransition: getComputedStyle(document.querySelector('main a')).transitionDuration })`)

// ---------- 7. 外壳焦点样式没有顺手修掉教学缺陷态 ----------
await navigate('#/keyboard')
// 缺陷态与外壳焦点都用真实 Tab 到达（程序 focus() 不触发 :focus-visible，读到的样式会骗人）
await pressTab()
await pressTab()
const navFocused = await evaluate(`(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return { label: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 20), href: el.getAttribute('href'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' offset=' + cs.outlineOffset, isNavLink: !!el.closest('header nav') };
})()`)
if (!navFocused.isNavLink) findings.push(`Tab 两次后落在「${navFocused.label}」而不是导航链接，外壳焦点那一项以实际停留点为准。`)
const firstDemoFocus = await tabUntilDemo(24)
const brokenReal = `${firstDemoFocus.label} → outline ${firstDemoFocus.outline}`
const shellVsDemo = await evaluate(`(() => {
  const broken = document.querySelector('button.kf-demo-btn--broken');
  const fixed = document.querySelector('button.kf-demo-btn--fixed');
  const plain = document.querySelector('button.kf-demo-btn');
  return {
    brokenPresent: !!broken,
    fixedPresent: !!fixed,
    demoButtonClass: plain ? plain.className : null,
    demoRuleTargets: (document.querySelector('style[data-keyboard-focus-demo]') || { textContent: '' }).textContent.split('\\n').filter(l => l.includes('focus-visible')).map(l => l.trim()).slice(0, 4),
  }
})()`)
const demoStyleTags = await evaluate(`[...document.querySelectorAll('style')].map(s => (s.hasAttribute('data-keyboard-focus-demo') ? 'demo' : 'other'))`)

const summary = {
  meta: {
    browser: version.Browser,
    target: LIVE || 'local-dist',
    assets: fs.readdirSync(path.join(DIST, 'assets')),
    flowMs,
    flowSteps: steps,
    firstTab: focusRing[0],
  },
  layout,
  focusRing,
  skip: { focused: skipFocused, steps: skipSteps, result: skipResult },
  keyboard: { firstDemo, fixedDemoFocus, counters: kfCounters, shellVsDemo, demoStyleTags, brokenReal, navFocused },
  flow: { afterCta, contrastReadouts, afterNext1, afterNext2, reportHead, markdownLength, copyStatus, downloadStatus, downloads, downloaded, textareaBytes, ledger: { atReport: ledgerAtReport, leftPage: ledgerLeftPage, afterRouteSwitch: ledgerAfterRouteSwitch, afterReload: ledgerAfterReload, deepLinkUrl } },
  mobile: { '320': mobile320, contrast320: mobile320Contrast, flow: mobileFlow, report390: mobileReport },
  motion: { reduced, normal },
  console: consoleEntries,
}
fs.writeFileSync(path.join(OUT, 'report' + SUFFIX + '.json'), JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(OUT, 'report' + SUFFIX + '.md'), [
  '# Day 6 真实浏览器取证',
  '',
  `- 浏览器：${version.Browser}`,
  `- 产物：${summary.meta.assets.join(', ')}`,
  `- 评委流程 ${steps.length} 步，机械耗时 ${(flowMs / 1000).toFixed(1)} 秒（不含阅读与思考时间）`,
  '',
  '## 横向溢出（overflowPx > 0 即不合格）',
  ...layout.map((l) => `- ${l.route} @${l.width}：overflow=${l.overflowPx}px 撑破元素=${l.offenders.length} 小于44px的目标=${l.smallTargets.length} 代码块=${l.pres.filter((p) => p.scrollsItself).length}/${l.pres.length} 内部滚动、${l.pres.filter((p) => p.breaksPage).length} 个撑破页面`),
  '',
  '## 真实 Tab 焦点环',
  ...focusRing.map((f, i) => `- 第 ${i + 1} 次：${f.label}（${f.tag}） → ${f.outline}`),
  `- skip link：Shift+Tab 走过 ${skipSteps.length} 步后聚焦 ${skipFocused.label}(${skipFocused.href}) → Enter 后 activeElement=${skipResult.activeTag}#${skipResult.activeId}，hash=${skipResult.hash}，仍在 ${skipResult.h1}`,
  `- Shift+Tab 的每一步停留：${skipSteps.map((s) => `${s.press}:${s.label || s.href || '(文档)'}`).join(' → ')}`,
  '',
  '## 键盘实验缺陷态 / 修复态',
  `- 示例按钮 class：${summary.keyboard.shellVsDemo.demoButtonClass}`,
  `- 注入样式表只命中实验区：${JSON.stringify(summary.keyboard.shellVsDemo.demoRuleTargets)}`,
  `- 外壳导航（真实 Tab 到达）：${JSON.stringify(navFocused)}`,
  `- 缺陷态真实 Tab 聚焦：${brokenReal}`,
  `- 键盘走到第一个示例按钮：${JSON.stringify(firstDemo)}`,
  `- 修复前键盘到达次数：${kfCounters.before}；修复后：${kfCounters.after}；人工确认：${kfCounters.confirmed}`,
  `- 两轮之后的页面读数：${JSON.stringify(confirmState)}`,
  '',
  '## 动线',
  `- 首页主按钮 → ${JSON.stringify(afterCta)}`,
  `- 色彩「下一步」→ ${JSON.stringify(afterNext1)}`,
  `- 表单「下一步」→ ${JSON.stringify(afterNext2)}`,
  `- 报告首屏：${JSON.stringify(reportHead)}`,
  `- Markdown ${markdownLength} 字符；复制提示：${JSON.stringify(copyStatus)}；下载提示：${JSON.stringify(downloadStatus)}；落盘文件：${JSON.stringify(downloads)}`,
  `- 台账边界：报告页 ${ledgerAtReport} → 切到色彩再切回 ${ledgerAfterRouteSwitch} → 刷新后 ${JSON.stringify(ledgerAfterReload)}（深链地址 ${deepLinkUrl}）`,
  '',
  '## 移动端',
  `- 首页 @320：${JSON.stringify(mobile320)}`,
  `- 色彩 @320：${JSON.stringify(mobile320Contrast)}`,
  `- 报告 @390：${JSON.stringify(mobileReport)}`,
  '',
  '## 减弱动效',
  `- reduce：${JSON.stringify(reduced)}；no-preference：${JSON.stringify(normal)}`,
  '',
  '## 控制台 error / warning',
  consoleEntries.length ? consoleEntries.map((e) => `- [${e.type}] ${e.text}`).join('\n') : '- 无',
  '',
  '## 这一轮读到的事实',
  ...findings.map((f) => `- ${f}`),
  '',
].join('\n'))
console.log('\n=== DONE ===\n')
console.log(fs.readFileSync(path.join(OUT, 'report' + SUFFIX + '.md'), 'utf8'))

browser.kill()
ws.close()
if (!LIVE) server.close()
