// Day 8 参赛材料配图：在同一次真实会话里跑完「首页 → 色彩 → 表单 → 键盘 → 报告」，
// 沿途截取干净的页面截图与读数。所有数值都由页面真实产生，本脚本不写入任何断言性结论。
// 用法：node .day8-evidence/capture-shots.mjs        （默认 Edge，找不到则 Chrome）
//       LIVE_URL=https://<站点> node .day8-evidence/capture-shots.mjs   （改拍公网）
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day8-evidence')
const SHOTS = path.join(OUT, 'shots-post')
fs.mkdirSync(SHOTS, { recursive: true })

const LIVE_TARGET = process.env.LIVE_URL ? process.env.LIVE_URL.replace(/\/$/, '') : ''
const SUFFIX = LIVE_TARGET ? '-live' : ''
const BROWSER = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p))
if (!BROWSER) throw new Error('找不到 Edge / Chrome')
const PORT = Number(process.env.DEBUG_PORT || 9361)
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
const BASE = LIVE_TARGET ? `${LIVE_TARGET}/index.html` : await (async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return `http://127.0.0.1:${server.address().port}/index.html`
})()
console.log('browser', BROWSER)
console.log('target', BASE)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day8-postshots-'))
const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })

async function json(url, tries = 100) {
  for (let i = 0; i < tries; i += 1) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('CDP 未就绪')
}
const version = await json(`http://127.0.0.1:${PORT}/json/version`)
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
const events = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(new Error(JSON.stringify(d.error))) : p.resolve(d.result); return }
  if (!d.method) return
  events.push(d)
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
await cmd('Page.enable'); await cmd('Runtime.enable')
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function ev(expression) {
  const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 70))
  return r.result.value
}
async function setViewport(v) {
  await cmd('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile })
  await ev('new Promise(r => requestAnimationFrame(() => r(true)))')
}
async function load(hash) {
  for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1)
  await cmd('Page.navigate', { url: BASE })
  await waitEvent('Page.loadEventFired'); await settle(200)
  if (hash) { await ev(`location.hash = ${JSON.stringify(hash)}`); await settle(450) }
}
async function shot(name) {
  const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const file = path.join(SHOTS, name + '.png')
  fs.writeFileSync(file, Buffer.from(data, 'base64'))
  console.log('SHOT', name + '.png', fs.statSync(file).size, 'B')
}
async function tab() {
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' })
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' })
  await settle(120)
}
async function clickText(label, kind = 'button') {
  const box = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); if (!el) return { error: 'not-found', present: [...document.querySelectorAll('${kind}')].map(e => (e.innerText || '').trim().slice(0, 22)).filter(Boolean) }; if (el.disabled) return { error: 'disabled' }; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
  if (box.error) throw new Error(`点不到「${label}」: ${box.error} ${JSON.stringify(box.present || '').slice(0, 220)}`)
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await settle(400)
  return box
}
// 把「此刻真正获得焦点的元素」居中，保证键盘截图拍的是可聚焦的实验区，
// 而不是页面上那组标注为「静态示意图 · 不能聚焦」的对照卡片
async function centerActive() {
  await ev(`(() => { const el = document.activeElement; if (!el || el === document.body) return false; el.scrollIntoView({ block: 'center', behavior: 'instant' }); return true })()`)
  await settle(250)
}
// 把包含指定文字的最内层元素滚到视口中间，用于取景
async function center(text) {
  const ok = await ev(`(() => { const all = [...document.querySelectorAll('main *')].filter(e => (e.innerText || '').includes(${JSON.stringify(text)})); const el = all.reverse().find(e => e.children.length === 0) || all[0]; if (!el) return false; const host = el.closest('section, h2, h3, div'); (host || el).scrollIntoView({ block: 'center', behavior: 'instant' }); return true })()`)
  await settle(250)
  if (!ok) console.log('  !! 未找到文字：', text)
  return ok
}
// 色彩页的读数不是 dt/dd 结构，直接读页面上「当前对比度 X:1 未达/达到 AA」这句
const contrastReading = () => ev(`(() => { const m = document.querySelector('main').innerText.replace(/\\s+/g, ' ').match(/当前对比度\\s*([\\d.]+:1)\\s*(未达 AA|达到 AA)/); return m ? { ratio: m[1], verdict: m[2] } : null })()`)

const R = { ua: version.Browser, target: BASE, readings: {} }

// ---------- 首页 ----------
await setViewport({ width: 1440, height: 900, mobile: false })
await load('#/')
R.readings.homeH1 = await ev(`document.querySelector('main h1').innerText.replace(/\\s+/g, ' ').trim()`)
await shot('01-home-1440')
await ev(`(() => { const s = document.getElementById('experiments'); if (s) s.scrollIntoView({ block: 'start', behavior: 'instant' }); return new Promise(r => setTimeout(() => r(true), 250)) })()`)
await shot('02-home-contrastcase-1440')

await setViewport({ width: 320, height: 568, mobile: true })
await load('#/')
R.readings.home320cta = await ev(`(() => { const a = [...document.querySelectorAll('a')].find(e => (e.innerText || '').trim() === '开始第一个实验'); if (!a) return null; const r = a.getBoundingClientRect(); return { top: Math.round(r.top), inFold: r.top >= 0 && r.top < innerHeight, innerHeight } })()`)
await shot('03-home-320-fold')
await setViewport({ width: 1440, height: 900, mobile: false })

// ---------- 色彩实验 ----------
await load('#/contrast')
R.readings.contrastBefore = await contrastReading()
await center('3. 检测结果')
await shot('04-contrast-before-1440')
await clickText('生成修复建议')
R.readings.contrastSuggest = await ev(`(() => { const t = [...document.querySelectorAll('h3,h4,p,strong')].map(e => e.innerText.trim()).filter(Boolean); return t.filter(x => /4\\.5\\d|建议|#767676/.test(x)).slice(0, 6) })()`)
await center('建议')
await shot('05-contrast-suggestion-1440')
await clickText('应用该修复')
R.readings.contrastAfter = await contrastReading()
await center('2. 实时预览')
await shot('06-contrast-applied-1440')
await clickText('进入表单标签实验', 'a')

// ---------- 表单实验 ----------
await settle(500)
R.readings.formBefore = await ev(`(() => { const t = document.querySelector('main').innerText; return { hasMissingLabel: t.includes('缺少关联的可见标签'), passEmail: /电子邮箱[\\s\\S]{0,160}(通过|没有发现)/.test(t) } })()`)
await center('检测结果')
await shot('07-form-before-1440')
await clickText('修复标签关联')
R.readings.formAfter = await ev(`(() => { const i = document.getElementById('student-name'); const l = i ? i.labels.length : -1; const t = document.querySelector('main').innerText; return { inputLabels: l, zeroIssue: t.includes('没有发现问题') || t.includes('0 个问题') } })()`)
await center('修复前')
await shot('08-form-after-1440')
await clickText('进入键盘焦点实验', 'a')

// ---------- 键盘实验 ----------
await settle(500)
await ev(`document.querySelector('main').scrollIntoView({ block: 'start', behavior: 'instant' })`)
await ev('document.activeElement.blur()')
let brokenFocused = null
for (let i = 0; i < 24 && !brokenFocused; i += 1) {
  await tab()
  brokenFocused = await ev(`(() => { const el = document.activeElement; if (!el.classList || !el.classList.contains('kf-demo-btn--broken')) return null; const cs = getComputedStyle(el); return { label: el.innerText.trim(), outline: cs.outlineStyle + ' ' + cs.outlineWidth, focusVisible: el.matches(':focus-visible') } })()`)
}
R.readings.keyboardBrokenFocus = brokenFocused
await centerActive()
await shot('09-keyboard-broken-focus-1440')
await clickText('修复焦点指示')
await ev('document.activeElement.blur()')
let fixedFocused = null
for (let i = 0; i < 30 && !fixedFocused; i += 1) {
  await tab()
  fixedFocused = await ev(`(() => { const el = document.activeElement; if (!el.classList || !el.classList.contains('kf-demo-btn--fixed')) return null; const cs = getComputedStyle(el); return { label: el.innerText.trim(), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' offset ' + cs.outlineOffset, focusVisible: el.matches(':focus-visible') } })()`)
}
R.readings.keyboardFixedFocus = fixedFocused
await centerActive()
await shot('10-keyboard-fixed-focus-1440')
await clickText('我已完成观察')
await shot('11-keyboard-confirmed-1440')
await clickText('查看统一成果报告', 'a')

// ---------- 报告 ----------
await settle(600)
R.readings.reportStats = await ev(`(() => { const want = ['已记录 / 总实验数', '已实际执行修复的实验数', '已进行修复后复核（含人工键盘体验）的实验数', '实验内仍待你本人完成的观察', '建议额外进行的辅助技术验证']; const out = {}; for (const label of want) { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === label); out[label] = dt ? dt.nextElementSibling.innerText.trim().replace(/\\s+/g, ' ') : null } return out })()`)
R.readings.reportGroups = await ev(`[...document.querySelectorAll('main h4')].map(h => h.innerText.trim()).filter(t => t.includes('项）'))`)
await center('已记录 / 总实验数')
await shot('12-report-1440')
const g = await ev(`(() => { const h = [...document.querySelectorAll('main h4')].find(x => x.innerText.includes('仍待你本人完成') || x.innerText.includes('已由你确认完成')); if (!h) return null; h.scrollIntoView({ block: 'start', behavior: 'instant' }); return window.scrollY })()`)
await settle(300)
await shot('13-report-manual-groups-1440')
R.readings.reportScrollY = g
await center('本报告仅针对 AccessLab 内置示例')
await shot('14-report-disclaimer-1440')

fs.writeFileSync(path.join(OUT, `post-readings${SUFFIX}.json`), JSON.stringify(R, null, 2))
console.log('READINGS', JSON.stringify(R.readings, null, 1))
console.log('DONE')
browser.kill(); ws.close(); server.close()
