// Day 7 验收取证（不入库）：真实 Chromium 内核浏览器 + 原生 CDP。
// 覆盖任务 B（键盘导航 / 语义 / 实时区域）、C（三实验与报告回归）、D（四档视口 / 兼容 / 性能）。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day8-evidence')
const SHOTS = path.join(OUT, 'shots')
const DL = path.join(OUT, process.env.DL_DIR ?? 'downloads')
fs.rmSync(DL, { recursive: true, force: true })
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(DL, { recursive: true })

const LIVE = process.env.LIVE_URL ? process.env.LIVE_URL.replace(/\/$/, '') : ''
const SUFFIX = process.env.OUT_SUFFIX ?? (LIVE ? '-live' : '')
const BROWSER = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
if (!BROWSER) throw new Error('找不到 Edge / Chrome')
const PORT = Number(process.env.DEBUG_PORT || 9357)
const VIEWPORTS = [
  { width: 320, height: 568, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 768, height: 1024, mobile: false },
  { width: 1440, height: 900, mobile: false },
]
const ROUTES = ['#/', '#/contrast', '#/form-label', '#/keyboard', '#/report']
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
const BASE = LIVE ? LIVE + '/index.html' : await (async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return `http://127.0.0.1:${server.address().port}/index.html`
})()
console.log('target', BASE)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day8-viewport-'))
const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' })

async function json(url, tries = 100) {
  for (let i = 0; i < tries; i += 1) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('CDP 未就绪')
}
const version = await json(`http://127.0.0.1:${PORT}/json/version`)
const ua = version.Browser
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
const events = []
const consoleMsgs = []
const requests = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(new Error(JSON.stringify(d.error))) : p.resolve(d.result); return }
  if (!d.method) return
  events.push(d)
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) consoleMsgs.push({ type: d.params.type, text: (d.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 200) })
  if (d.method === 'Runtime.exceptionThrown') consoleMsgs.push({ type: 'exception', text: String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 200) })
  if (d.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.params.entry.level)) consoleMsgs.push({ type: d.params.entry.level, text: `${d.params.entry.source}: ${d.params.entry.text}`.slice(0, 200) })
  if (d.method === 'Network.responseReceived') requests.push({ url: d.params.response.url, status: d.params.response.status, mime: d.params.response.mimeType, encoded: d.params.response.encodedDataLength })
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
async function waitEvent(method, timeout = 20000) {
  const cut = () => { const i = events.findIndex((e) => e.method === method); if (i >= 0) { events.splice(i, 1); return true } return false }
  if (cut()) return
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) { if (cut()) return; await new Promise((r) => setTimeout(r, 40)) }
  throw new Error('超时 ' + method)
}
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Log.enable'); await cmd('Network.enable')
await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true }).catch(() => {})
await cmd('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL }).catch(() => {})
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function ev(expression) {
  const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 70))
  return r.result.value
}
async function setViewport(v) { await cmd('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile }); await ev('new Promise(r => requestAnimationFrame(() => r(true)))') }
async function load(hash) {
  for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1)
  await cmd('Page.navigate', { url: BASE })
  await waitEvent('Page.loadEventFired'); await settle(150)
  if (hash) { await ev(`location.hash = ${JSON.stringify(hash)}`); await settle() }
}
async function shot(name) { const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(data, 'base64')) }
async function tab(shift = false) {
  const mods = shift ? 8 : 0
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: mods, key: 'Tab', code: 'Tab', text: '\t' })
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: mods, code: 'Tab' })
}
async function key(k, vk) {
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, key: k, code: k })
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, key: k, code: k })
}
async function clickText(label, kind = 'button') {
  const box = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); if (!el) return { error: 'not-found', present: [...document.querySelectorAll('${kind}')].map(e => (e.innerText || '').trim().slice(0, 20)).filter(Boolean) }; if (el.disabled) return { error: 'disabled' }; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
  if (box.error) throw new Error(`点不到「${label}」: ${box.error} ${JSON.stringify(box.present || '').slice(0, 200)}`)
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await settle(300)
  return box
}
const ACTIVE = `(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { tag: el.tagName.toLowerCase(), label: (el.innerText || el.value || el.getAttribute('href') || el.id || '').replace(/\\s+/g, ' ').trim().slice(0, 30), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineOffset, cls: el.className && el.className.baseVal === undefined ? String(el.className).slice(0, 40) : '' } })()`

const R = { ua, target: BASE, layout: [], keyboard: [], semantics: [], flow: {}, liveRegions: {}, compat: {}, perf: {}, notes: [] }

// ================= D1：五页 × 四视口 =================
for (const route of ROUTES) {
  await load(route)
  for (const v of VIEWPORTS) {
    await setViewport(v)
    const info = await ev(`(() => {
      const de = document.documentElement;
      const header = document.querySelector('header');
      const hr = header.getBoundingClientRect();
      const h1 = document.querySelector('main h1');
      const h1r = h1 ? h1.getBoundingClientRect() : null;
      const cta = [...document.querySelectorAll('main a')].find(a => (a.innerText || '').includes('开始第一个实验'));
      return {
        overflowPx: de.scrollWidth - window.innerWidth,
        offenders: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1.5).slice(0, 4).map(el => el.tagName.toLowerCase() + '#' + (el.id || (el.className.baseVal !== undefined ? '' : String(el.className).split(' ')[0])) + '=' + Math.round(el.getBoundingClientRect().right)),
        headerH: Math.round(hr.height),
        navRows: new Set([...document.querySelectorAll('header nav a')].map(a => Math.round(a.getBoundingClientRect().top))).size,
        navMinH: Math.min(...[...document.querySelectorAll('header nav a')].map(a => Math.round(a.getBoundingClientRect().height))),
        allNavH: [...document.querySelectorAll('header nav a')].map(a => Math.round(a.getBoundingClientRect().height)),
        h1BelowHeader: h1r ? h1r.top >= hr.bottom - 1 : null,
        smallTargets: [...document.querySelectorAll('main a, main button, main input, header a, header button')].map(el => { const r = el.getBoundingClientRect(); return { t: ((el.innerText || el.getAttribute('href') || el.type || '') + '').replace(/\\s+/g, ' ').trim().slice(0, 16), h: Math.round(r.height), w: Math.round(r.width) } }).filter(x => x.h > 0 && x.h < 44),
        presBreak: [...document.querySelectorAll('pre')].filter(p => p.getBoundingClientRect().right > window.innerWidth + 1.5).length,
        presScroll: [...document.querySelectorAll('pre')].filter(p => p.scrollWidth > p.clientWidth + 1).length,
        presTotal: document.querySelectorAll('pre').length,
        ctaTop: cta ? Math.round(cta.getBoundingClientRect().top + window.scrollY) : null,
        ctaInFold: cta ? cta.getBoundingClientRect().bottom <= window.innerHeight : null,
        vh: window.innerHeight,
      }
    })()`)
    R.layout.push({ route, ...v, ...info })
    console.log(`D1 ${route} @${v.width}: overflow=${info.overflowPx} headerH=${info.headerH} navMin=${info.navMinH} small=${info.smallTargets.length} ctaTop=${info.ctaTop} ctaFold=${info.ctaInFold}`)
  }
}

// ================= B1：真实键盘导航 =================
await load('#/')
await setViewport(VIEWPORTS[3])
const firstTab = await (async () => { await tab(); return ev(ACTIVE) })()
await key('Enter', 13)
await settle(300)
const afterSkipEnter = await ev(`({ id: document.activeElement.id, tag: document.activeElement.tagName.toLowerCase(), hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
R.keyboard.push({ page: '#/', firstTab, afterSkipEnter })
console.log('B1 firstTab', JSON.stringify(firstTab), '→ Enter', JSON.stringify(afterSkipEnter))

for (const route of ROUTES) {
  await load(route)
  await setViewport(VIEWPORTS[3])
  const stops = []
  for (let i = 0; i < 14; i += 1) { await tab(); stops.push(await ev(ACTIVE)) }
  const distinct = new Set(stops.map((s) => s.tag + '|' + s.label)).size
  const rings = stops.map((s) => s.outline)
  await tab(true)
  const back = await ev(ACTIVE)
  R.keyboard.push({ page: route, stops, distinct, noRing: stops.filter((s) => s.outline.startsWith('none')).length, shiftTabBack: back })
  console.log(`B1 ${route}: ${stops.length} 站 / ${distinct} 个不同焦点，outline:none 的站=${R.keyboard[R.keyboard.length - 1].noRing}`)
}

// 键盘实验：缺陷类与外壳控件的真实焦点轮廓对照
await load('#/keyboard')
await setViewport(VIEWPORTS[3])
let demoLanding = []
for (let i = 0; i < 30 && demoLanding.length < 3; i += 1) {
  await tab()
  const s = await ev(ACTIVE)
  if (s.cls.includes('kf-demo-btn')) demoLanding.push(s)
}
const shellRing = []
await load('#/keyboard')
await setViewport(VIEWPORTS[3])
for (let i = 0; i < 12; i += 1) { await tab(); const s = await ev(ACTIVE); if (!s.cls.includes('kf-demo-btn')) shellRing.push(s) }
R.keyboard.push({ page: '#/keyboard demoDefectScope', demoLanding, shellRingSample: shellRing.slice(0, 6) })
console.log('B1 键盘实验缺陷态', JSON.stringify(demoLanding))
await shot('b1-keyboard-broken-focus-1440' + SUFFIX)

// ================= B2：语义 + 实时区域清单 =================
for (const route of ROUTES) {
  await load(route)
  await setViewport(VIEWPORTS[3])
  const sem = await ev(`(() => {
    const hs = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => h.tagName + ' ' + (h.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 26));
    const h1 = document.querySelectorAll('main h1').length;
    const badOrder = hs.reduce((acc, cur, i) => { const lvl = +cur[1]; const prev = i ? +hs[i - 1][1] : lvl; if (lvl - prev > 1) acc.push(hs[i - 1] + ' → ' + cur); return acc }, []);
    return {
      h1Count: h1,
      headings: hs,
      skippedLevel: badOrder,
      landmarks: ['header', 'nav', 'main', 'footer'].map(t => t + '=' + document.querySelectorAll(t).length).join(' '),
      navName: document.querySelector('header nav')?.getAttribute('aria-label') || null,
      ariaCurrent: [...document.querySelectorAll('[aria-current]')].map(e => e.getAttribute('aria-current') + ':' + (e.innerText || '').trim()),
      inputs: [...document.querySelectorAll('main input')].map(i => ({ id: i.id, labels: i.labels ? i.labels.length : -1, ph: i.placeholder ? 1 : 0 })),
      unnamed: [...document.querySelectorAll('main a, main button')].filter(e => !(e.innerText || '').trim() && !e.getAttribute('aria-label')).length,
      statuses: [...document.querySelectorAll('[role="status"]')].length,
      liveTotal: document.querySelectorAll('[role="status"],[aria-live]').length,
    }
  })()`)
  R.semantics.push({ route, ...sem })
  console.log(`B2 ${route}: h1=${sem.h1Count} landmarks=${sem.landmarks} role=status=${sem.statuses} 无名称控件=${sem.unnamed} 跳级=${sem.skippedLevel.length}`)
}

// 一次操作后有多少实时区域同时变化（重复播报风险）
await load('#/contrast')
await setViewport(VIEWPORTS[3])
const beforeLive = await ev(`[...document.querySelectorAll('[role="status"],[aria-live]')].map(e => (e.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60))`)
await clickText('生成修复建议')
const afterLive = await ev(`[...document.querySelectorAll('[role="status"],[aria-live]')].map(e => (e.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60))`)
R.liveRegions.contrastSuggest = { count: beforeLive.length, changed: beforeLive.map((t, i) => (t === afterLive[i] ? null : { before: t, after: afterLive[i] })).filter(Boolean) }
console.log('B2 色彩一次操作变化的实时区域 =', R.liveRegions.contrastSuggest.changed.length, '/', beforeLive.length)

fs.writeFileSync(path.join(OUT, `viewport${SUFFIX}.json`), JSON.stringify(R, null, 2))
console.log('PART1 DONE')
browser.kill(); ws.close(); server.close()
