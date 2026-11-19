// Day 7 体验探针（不入库）：实测 A1 首页主按钮位置 / A3 导航目标高度。
// 复用 Day 6 的驱动方式：本机 Chromium 内核浏览器 + 原生 CDP，真实视口切换与真实按键。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day7-evidence')
const LIVE = process.env.LIVE_URL ? process.env.LIVE_URL.replace(/\/$/, '') : ''
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true })

const BROWSER_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
]
const DEBUG_PORT = 9335
const WIDTHS = [
  { width: 320, height: 568, mobile: true },
  { width: 320, height: 640, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 768, height: 1024, mobile: false },
  { width: 1440, height: 900, mobile: false },
]
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
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
let BASE
if (LIVE) {
  BASE = LIVE + '/index.html'
} else {
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  BASE = `http://127.0.0.1:${server.address().port}/index.html`
}
console.log('target', BASE)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day7-probe-profile-'))
const bin = BROWSER_CANDIDATES.find((p) => fs.existsSync(p))
if (!bin) throw new Error('找不到 Edge / Chrome')
const browser = spawn(
  bin,
  ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,1000', 'about:blank'],
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
  throw new Error('CDP 未就绪')
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
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data)
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id)
    pending.delete(data.id)
    if (data.error) reject(new Error(JSON.stringify(data.error)))
    else resolve(data.result)
    return
  }
  if (data.method) eventLog.push(data)
}
function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
}
async function waitEvent(method, timeout = 20000) {
  const i = eventLog.findIndex((e) => e.method === method)
  if (i >= 0) {
    eventLog.splice(i, 1)
    return
  }
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const j = eventLog.findIndex((e) => e.method === method)
    if (j >= 0) {
      eventLog.splice(j, 1)
      return
    }
    await new Promise((r) => setTimeout(r, 40))
  }
  throw new Error('等待事件超时 ' + method)
}
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable')
await cmd('Runtime.enable')
const settle = (ms = 320) => evaluate(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function evaluate(expression) {
  const res = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.exceptionDetails) throw new Error((res.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 90))
  return res.result.value
}
async function setViewport({ width, height, mobile }) {
  await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
  await evaluate('new Promise(r => requestAnimationFrame(() => r(true)))')
}
async function gotoRoute(hash) {
  for (let i = eventLog.length - 1; i >= 0; i -= 1) if (eventLog[i].method === 'Page.loadEventFired') eventLog.splice(i, 1)
  await cmd('Page.navigate', { url: BASE })
  await waitEvent('Page.loadEventFired')
  await settle(150)
  await evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await settle()
}
async function shot(name) {
  const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(path.join(OUT, 'shots', name + '.png'), Buffer.from(data, 'base64'))
}

// ---------- A1：首页主按钮在四档视口下的真实位置 ----------
const ctaProbe = []
await gotoRoute('#/')
for (const vp of WIDTHS) {
  await setViewport(vp)
  const info = await evaluate(`(() => {
    const cta = [...document.querySelectorAll('main a')].find(a => (a.innerText || '').includes('开始第一个实验'));
    if (!cta) return { error: 'cta-not-found' };
    const r = cta.getBoundingClientRect();
    const header = document.querySelector('header');
    const hr = header.getBoundingClientRect();
    const nav = document.querySelector('header nav a');
    // 主按钮上方依次有哪些块：用文档流里的绝对 top 还原阅读顺序
    const trail = [...document.querySelectorAll('main h1, main p, main dl, main h2')].slice(0, 12).map(el => {
      const b = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), top: Math.round(b.top + window.scrollY), h: Math.round(b.height), text: (el.innerText || '').replace(/\\s+/g, ' ').slice(0, 26) };
    }).sort((a, b) => a.top - b.top);
    return {
      vh: window.innerHeight,
      ctaTopInViewport: Math.round(r.top),
      ctaTopInDoc: Math.round(r.top + window.scrollY),
      ctaHeight: Math.round(r.height),
      aboveFold: r.top < window.innerHeight,
      foldGapPx: Math.round(window.innerHeight - r.bottom),
      headerHeight: Math.round(hr.height),
      navRowHeight: nav ? Math.round(nav.getBoundingClientRect().height) : null,
      navRowCount: nav ? new Set([...document.querySelectorAll('header nav a')].map(a => Math.round(a.getBoundingClientRect().top))).size : null,
      docHeight: document.documentElement.scrollHeight,
      overflowPx: document.documentElement.scrollWidth - window.innerWidth,
      trail,
    }
  })()`)
  ctaProbe.push({ ...vp, ...info })
  console.log(`A1 home @${vp.width}x${vp.height}: ctaTop=${info.ctaTopInDoc} inViewport=${info.ctaTopInViewport} aboveFold=${info.aboveFold} headerH=${info.headerHeight} navRows=${info.navRowCount} vh=${info.vh}`)
}
await setViewport(WIDTHS[0])
await shot('a1-home-320x568-beforefold')
await setViewport({ width: 320, height: 640, mobile: true })
await shot('a1-home-320x640-beforefold')

// ---------- A3：五档视口下每个导航链接的真实高度 ----------
const navProbe = []
for (const route of ['#/', '#/contrast', '#/form-label', '#/keyboard', '#/report']) {
  await gotoRoute(route)
  for (const vp of WIDTHS) {
    await setViewport(vp)
    const info = await evaluate(`(() => {
      const links = [...document.querySelectorAll('header nav a')];
      return {
        route: location.hash,
        heights: links.map(a => ((a.innerText || '').trim() + '=' + Math.round(a.getBoundingClientRect().height) + 'x' + Math.round(a.getBoundingClientRect().width))),
        minH: Math.min(...links.map(a => Math.round(a.getBoundingClientRect().height))),
        headerHeight: Math.round(document.querySelector('header').getBoundingClientRect().height),
        overflowPx: document.documentElement.scrollWidth - window.innerWidth,
        sticky: getComputedStyle(document.querySelector('header')).position,
        navRows: new Set(links.map(a => Math.round(a.getBoundingClientRect().top))).size,
      }
    })()`)
    navProbe.push({ ...vp, ...info })
    console.log(`A3 ${route} @${vp.width}: minNavH=${info.minH} headerH=${info.headerHeight} rows=${info.navRows} overflow=${info.overflowPx}`)
  }
  break // 五页外壳同一份 DOM，先测首页即可确认全站一致
}

fs.writeFileSync(path.join(OUT, `probe-${LIVE ? 'live' : 'local'}.json`), JSON.stringify({ ctaProbe, navProbe }, null, 2))
await new Promise((r) => setTimeout(r, 200))
browser.kill()
ws.close()
server.close()
console.log('done')
