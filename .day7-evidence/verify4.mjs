// Day 7 验收取证 part 4：键盘激活后焦点落点（三个实验页）、非法输入、旧建议过期、复制入口是否随之失效。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day7-evidence')
const SHOTS = path.join(OUT, 'shots')
fs.mkdirSync(SHOTS, { recursive: true })
const BROWSER = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const PORT = 9340
const DESKTOP = { width: 1440, height: 900, mobile: false }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
const BASE = await (async () => { await new Promise((r) => server.listen(0, '127.0.0.1', r)); return `http://127.0.0.1:${server.address().port}/index.html` })()
console.log('target', BASE)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day7-verify4-'))
const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' })
async function json(u, tries = 100) { for (let i = 0; i < tries; i += 1) { try { const r = await fetch(u); if (r.ok) return await r.json() } catch {} await new Promise((r) => setTimeout(r, 200)) } throw new Error('CDP 未就绪') }
const version = await json(`http://127.0.0.1:${PORT}/json/version`)
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
const events = []
const consoleMsgs = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(new Error(JSON.stringify(d.error))) : p.resolve(d.result); return }
  if (!d.method) return
  events.push(d)
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) consoleMsgs.push({ type: d.params.type, text: (d.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 160) })
  if (d.method === 'Runtime.exceptionThrown') consoleMsgs.push({ type: 'exception', text: String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 160) })
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
async function waitEvent(method, timeout = 20000) { const cut = () => { const i = events.findIndex((e) => e.method === method); if (i >= 0) { events.splice(i, 1); return true } return false }; if (cut()) return; const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (cut()) return; await new Promise((r) => setTimeout(r, 40)) } throw new Error('超时 ' + method) }
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Log.enable')
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function ev(expression) { const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 70)); return r.result.value }
async function setViewport(v) { await cmd('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile }); await ev('new Promise(r => requestAnimationFrame(() => r(true)))') }
async function load(hash) { for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1); await cmd('Page.navigate', { url: BASE }); await waitEvent('Page.loadEventFired'); await settle(200); if (hash) { await ev(`location.hash = ${JSON.stringify(hash)}`); await settle() } }
async function shot(n) { const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(SHOTS, n + '.png'), Buffer.from(data, 'base64')) }
async function tab() { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function pressEnter() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }); await cmd('Input.dispatchKeyEvent', { type: 'char', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter', text: '\r' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }) }
const LIVE = `[...document.querySelectorAll('[role="status"],[aria-live]')].map(e => (e.innerText || '').replace(/\\s+/g, ' ').trim()).filter(t => t.length)`
const ACTIVE = `(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName.toLowerCase(), id: a.id || null, isBody: a === document.body, label: (a === document.body ? '' : (a.innerText || a.getAttribute('aria-label') || a.value || '')).replace(/\\s+/g, ' ').trim().slice(0, 26), section: (() => { const h = a.closest && a.closest('section') && a.closest('section').querySelector('h2'); return h ? h.innerText.replace(/\\s+/g, ' ').trim().slice(0, 20) : null })(), outline: cs.outlineStyle + ' ' + cs.outlineWidth } })()`
async function tabTo(label, max = 90) {
  for (let i = 1; i <= max; i += 1) {
    await tab()
    const s = await ev(`(() => { const a = document.activeElement; return (a.innerText || a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 26) })()`)
    if (s === label) return i
  }
  throw new Error('Tab 走不到 ' + label)
}
/** 键盘激活一个按钮，并记录：激活前焦点、激活后焦点、再按一次 Tab 的落点 */
async function keyActivateAndProbe(label) {
  const presses = await tabTo(label)
  const before = await ev(ACTIVE)
  await pressEnter()
  await settle(420)
  const after = await ev(ACTIVE)
  await tab()
  const nextTab = await ev(ACTIVE)
  const live = await ev(LIVE)
  console.log('KEY', label, JSON.stringify({ presses, before: before.label, afterTag: after.tag, afterLabel: after.label, nextTab: nextTab.tag + ':' + nextTab.label, live }))
  return { label, presses, before, after, nextTab, live }
}
async function typeHex(value) {
  const inputId = await ev(`(() => { const l = [...document.querySelectorAll('main label')].find(x => x.innerText.trim() === '文字颜色'); return document.getElementById(l.htmlFor).id })()`)
  await ev(`(() => { const el = document.getElementById(${JSON.stringify(inputId)}); el.scrollIntoView({ block: 'center', behavior: 'instant' }); el.focus(); el.select(); return true })()`)
  for (const ch of value) await cmd('Input.dispatchKeyEvent', { type: 'char', text: ch })
  await settle(360)
  return { inputId, value: await ev(`document.getElementById(${JSON.stringify(inputId)}).value`) }
}
const repairBlock = () => ev(`String(document.querySelector('#repair-heading').closest('section').innerText).replace(/\\s+/g, ' ').slice(0, 260)`)

const R = { ua: version.Browser, keyActivation: {}, invalid: [], stale: [], console: [] }
const save = () => fs.writeFileSync(path.join(OUT, 'part4.json'), JSON.stringify(R, null, 2))

// ---------- 1. 三个实验页的主操作全部用键盘完成，看焦点落在哪 ----------
await load('#/contrast'); await setViewport(DESKTOP)
R.keyActivation.contrast = []
for (const label of ['生成修复建议', '应用该修复', '撤销本次修复']) R.keyActivation.contrast.push(await keyActivateAndProbe(label))
await shot('e1-contrast-keyboard-undo')
save()

await load('#/form-label'); await setViewport(DESKTOP)
R.keyActivation.formLabelsBefore = await ev(`[...document.querySelectorAll('main input')].map(e => ({ id: e.id, labels: e.labels.length }))`)
R.keyActivation.form = []
R.keyActivation.form.push(await keyActivateAndProbe('修复标签关联'))
R.keyActivation.formLabelsAfter = await ev(`[...document.querySelectorAll('main input')].map(e => ({ id: e.id, labels: e.labels.length, text: [...e.labels].map(l => l.innerText.trim()).join('|') }))`)
R.keyActivation.form.push(await keyActivateAndProbe('重置实验'))
R.keyActivation.formLabelsReset = await ev(`[...document.querySelectorAll('main input')].map(e => ({ id: e.id, labels: e.labels.length }))`)
save()

await load('#/keyboard'); await setViewport(DESKTOP)
R.keyActivation.keyboard = []
R.keyActivation.keyboard.push(await keyActivateAndProbe('修复焦点指示'))
R.keyActivation.fixedClass = await ev(`[...document.querySelectorAll('.kf-demo-btn')].map(b => String(b.className).replace('kf-demo-btn', '').trim())`)
save()

// ---------- 2. 非法输入：错误提示、修复暂停、读数过期 ----------
await load('#/contrast'); await setViewport(DESKTOP)
const bad = await typeHex('#12zz')
R.invalid.push({ step: '输入非法值', typed: bad, input: await ev(`(() => { const el = document.getElementById(${JSON.stringify(bad.inputId)}); const ids = (el.getAttribute('aria-describedby') || '').split(/\\s+/).filter(Boolean); return { value: el.value, invalid: el.getAttribute('aria-invalid'), describedby: ids.map(i => { const n = document.getElementById(i); return n ? n.innerText.replace(/\\s+/g, ' ').trim() : null }) } })()`), live: await ev(LIVE), repair: await repairBlock(), generate: await ev(`(() => { const b = [...document.querySelectorAll('main button')].find(x => (x.innerText || '').trim() === '生成修复建议'); return b ? { present: true, disabled: b.disabled } : { present: false } })()`) })
console.log('INVALID', JSON.stringify(R.invalid[0]).slice(0, 700))

// ---------- 3. 有效但未达标 → 生成建议 → 改色后旧建议是否过期、复制入口是否还在 ----------
await typeHex('#777777')
await ev(`document.activeElement.blur()`)
await settle(200)
R.stale.push({ step: '恢复 #777777', live: await ev(LIVE), repair: await repairBlock() })
const genPresses = await tabTo('生成修复建议')
await pressEnter()
await settle(360)
R.stale.push({ step: '键盘生成建议', genPresses, focus: await ev(ACTIVE), live: await ev(LIVE), repair: await repairBlock(), cssSection: await ev(`(() => { const s = document.querySelector('#css-heading'); return { present: !!s, text: s ? String(s.closest('section').innerText).replace(/\\s+/g, ' ').slice(0, 120) : null } })()`) })
await typeHex('#7b7b7b')
await settle(320)
R.stale.push({ step: '改色为 #7b7b7b（仍未达 AA）', live: await ev(LIVE), repair: await repairBlock(), copyButton: await ev(`(() => { const b = [...document.querySelectorAll('main button')].find(x => (x.innerText || '').trim() === '复制修复后的 CSS'); return b ? { present: true, disabled: b.disabled } : { present: false } })()`) })
console.log('STALE', JSON.stringify(R.stale[2]).slice(0, 500))
await shot('e2-contrast-stale')
R.console = consoleMsgs
save()
console.log('CONSOLE msgs =', consoleMsgs.length, 'errors =', consoleMsgs.filter((m) => m.type === 'error' || m.type === 'exception').length)
console.log('PART4 DONE')
browser.kill(); ws.close(); server.close()
