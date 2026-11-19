// Day 7 验收取证 part 3：真实键盘操作（Enter / Space）、撤销与重置、非法输入、清空确认的焦点处理。
// 与 part1/part2 同一台无头 Edge + 原始 CDP；Tab / Enter / Space 都是可信输入事件。
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
const PORT = 9339
const DESKTOP = { width: 1440, height: 900, mobile: false }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
const BASE = await (async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return `http://127.0.0.1:${server.address().port}/index.html`
})()
console.log('target', BASE)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day7-verify3-'))
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
await cmd('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'], origin: new URL(BASE).origin }).catch(() => {})
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function ev(expression) { const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 70)); return r.result.value }
async function setViewport(v) { await cmd('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile }); await ev('new Promise(r => requestAnimationFrame(() => r(true)))') }
async function load(hash) { for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1); await cmd('Page.navigate', { url: BASE }); await waitEvent('Page.loadEventFired'); await settle(200); if (hash) { await ev(`location.hash = ${JSON.stringify(hash)}`); await settle() } }
async function shot(name) { const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(data, 'base64')) }
async function tab() { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function shiftTab() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', modifiers: 8 }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', modifiers: 8 }) }
// 可信按键：Enter 走 keyDown+text，Space 的激活发生在 keyUp
async function pressEnter() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }); await cmd('Input.dispatchKeyEvent', { type: 'char', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter', text: '\r' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }) }
async function pressSpace() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, key: ' ', code: 'Space' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, key: ' ', code: 'Space', text: ' ' }) }
async function typeInto(idAttr, value) {
  await ev(`(() => { const el = document.getElementById(${JSON.stringify(idAttr)}); el.focus(); el.select && el.select(); return document.activeElement === el })()`)
  for (const ch of value) await cmd('Input.dispatchKeyEvent', { type: 'char', text: ch })
  await ev(`document.getElementById(${JSON.stringify(idAttr)}).dispatchEvent(new Event('input', { bubbles: true }))`)
  await settle(260)
}
const LIVE_TEXTS = `[...document.querySelectorAll('[role="status"],[aria-live]')].map(e => (e.innerText || '').replace(/\\s+/g, ' ').trim()).filter(t => t.length)`

/** 真实 Tab 走到目标控件；走到就返回 presses，走不到退回 el.focus() 并如实标记 */
async function tabTo(label, kind = 'button', max = 80) {
  await ev(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`)
  for (let i = 1; i <= max; i += 1) {
    await tab()
    const s = await ev(`(() => { const el = document.activeElement; if (!el) return null; return { tag: el.tagName.toLowerCase(), label: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 28), disabled: !!el.disabled, outline: getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth + ' ' + getComputedStyle(el).outlineColor, ring: getComputedStyle(el).boxShadow.slice(0, 40) } })()`)
    if (s && s.label === label) return { label, via: 'Tab', presses: i, ...s }
  }
  await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); el.scrollIntoView({ block: 'center', behavior: 'instant' }); el.focus(); return true })()`)
  return { label, via: 'focus()', presses: null }
}
async function keyActivate(label, keyName = 'Enter') {
  const before = await ev(`(() => { const el = document.activeElement; return { tag: el.tagName.toLowerCase(), label: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 28) } })()`)
  await setViewport(DESKTOP)
  if (keyName === 'Enter') await pressEnter(); else await pressSpace()
  await settle(420)
  return { before, live: await ev(LIVE_TEXTS) }
}
async function clickText(label, kind = 'button') {
  const found = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); if (!el) return { error: 'not-found' }; if (el.disabled) return { error: 'disabled', reason: String((el.parentElement || {}).innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120) }; el.setAttribute('data-day7-t', '1'); return { ok: true } })()`)
  if (found.error) throw new Error(`点不到「${label}」: ${found.error} ${found.reason || ''}`)
  let box = null
  for (let attempt = 1; attempt <= 5 && !box; attempt += 1) {
    await ev(`document.querySelector('[data-day7-t]').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await settle(80)
    box = await ev(`(() => { const el = document.querySelector('[data-day7-t]'); const r = el.getBoundingClientRect(); const x = Math.round(r.x + r.width / 2), y = Math.round(r.y + r.height / 2); const hit = document.elementFromPoint(x, y); return { x, y, ok: !!hit && (hit === el || el.contains(hit) || hit.contains(el)) } })()`)
    if (!box.ok) { box = null; await settle(200) }
  }
  if (!box) { await ev(`document.querySelector('[data-day7-t]')?.removeAttribute('data-day7-t')`); throw new Error(`「${label}」命中测试失败`) }
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await ev(`document.querySelector('[data-day7-t]')?.removeAttribute('data-day7-t')`)
  await settle(340)
}
const state = () => ev(`(() => {
  const sample = document.getElementById('contrast-sample-text') || [...document.querySelectorAll('main p')].find(p => p.innerText.trim().length > 4 && getComputedStyle(p).color !== 'rgb(15, 23, 42)');
  const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null };
  return { color: sample ? getComputedStyle(sample).color : null, ratio: pick('当前对比度（未取整真实值）'), verdict: pick('AA 判定'), live: ${LIVE_TEXTS} };
})()`)

const R = { ua: version.Browser, target: BASE, contrast: {}, form: {}, keyboard: {}, reportClear: {}, console: [] }
const save = () => fs.writeFileSync(path.join(OUT, 'part3.json'), JSON.stringify(R, null, 2))

// ---------- 1. 色彩实验：只用键盘完成 建议 → 应用 → 撤销，再加非法输入 ----------
await load('#/contrast')
await setViewport(DESKTOP)
R.contrast.start = await state()
R.contrast.suggest = { ...(await tabTo('生成修复建议')), ...(await keyActivate('生成修复建议', 'Enter')) }
R.contrast.afterSuggest = await state()
R.contrast.apply = { ...(await tabTo('应用该修复')), ...(await keyActivate('应用该修复', 'Space')) }
R.contrast.afterApply = await state()
await shot('d1-contrast-applied-keyboard')
R.contrast.undo = { ...(await tabTo('撤销本次修复')), ...(await keyActivate('撤销本次修复', 'Enter')) }
R.contrast.afterUndo = await state()
R.contrast.invalid = await (async () => {
  const inputId = await ev(`(() => { const el = [...document.querySelectorAll('main input')][0]; return el ? el.id : null })()`)
  await typeInto(inputId, '#12')
  const after = await state()
  const hint = await ev(`(() => { const el = document.getElementById(${JSON.stringify(inputId)}); const ids = (el.getAttribute('aria-describedby') || '').split(/\\s+/).filter(Boolean); return { id: el.id, value: el.value, invalid: el.getAttribute('aria-invalid'), describedby: ids.map(i => { const n = document.getElementById(i); return n ? n.innerText.replace(/\\s+/g, ' ').trim().slice(0, 60) : null }) } })()`)
  return { inputId, hint, state: after }
})()
save()
console.log('CONTRAST', JSON.stringify({ start: R.contrast.start, suggestVia: R.contrast.suggest.via, suggestLive: R.contrast.suggest.live, afterSuggest: R.contrast.afterSuggest.ratio, applyLive: R.contrast.apply.live, afterApplyColor: R.contrast.afterApply.color, undoLive: R.contrast.undo.live, afterUndoColor: R.contrast.afterUndo.color, invalid: R.contrast.invalid.hint }))

// ---------- 2. 表单实验：键盘修复 + 重置，并核对 input.labels ----------
await load('#/form-label')
await setViewport(DESKTOP)
R.form.before = await ev(`(() => { const els = [...document.querySelectorAll('main input')]; return els.map(e => ({ id: e.id, labels: e.labels.length, text: [...e.labels].map(l => l.innerText.trim()).join('|') })) })()`)
R.form.fix = { ...(await tabTo('修复标签关联')), ...(await keyActivate('修复标签关联', 'Enter')) }
R.form.after = await ev(`(() => { const els = [...document.querySelectorAll('main input')]; return { labels: els.map(e => ({ id: e.id, labels: e.labels.length, text: [...e.labels].map(l => l.innerText.trim()).join('|') })), realLabels: [...document.querySelectorAll('main label[for]')].length } })()`)
R.form.clickLabel = await (async () => {
  const box = await ev(`(() => { const l = [...document.querySelectorAll('main label[for]')].find(x => x.innerText.trim() === '姓名'); const r = l.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await settle(260)
  return ev(`(() => { const a = document.activeElement; return { tag: a.tagName.toLowerCase(), id: a.id || null } })()`)
})()
R.form.reset = { ...(await tabTo('重置实验')), ...(await keyActivate('重置实验', 'Enter')) }
R.form.afterReset = await ev(`(() => { const els = [...document.querySelectorAll('main input')]; return { labels: els.map(e => e.labels.length), spans: [...document.querySelectorAll('main div > span')].length } })()`)
save()
console.log('FORM', JSON.stringify({ before: R.form.before, fixVia: R.form.fix.via, fixLive: R.form.fix.live, after: R.form.after, clickLabel: R.form.clickLabel, resetLive: R.form.reset.live, afterReset: R.form.afterReset }))

// ---------- 3. 键盘实验：鼠标点按钮不该计入 + 重置清零 + Shift+Tab ----------
await load('#/keyboard')
await setViewport(DESKTOP)
const readCounts = () => ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); return { before: (t.match(/修复前键盘到达 (\\d+) 次/) || [])[1] || '0', after: (t.match(/修复后键盘到达 (\\d+) 次/) || [])[1] || null, confirmDisabled: [...document.querySelectorAll('button')].find(b => (b.innerText || '').trim() === '我已完成观察').disabled } })()`)
const beforeMouse = await readCounts()
await clickText('查看详情')
await clickText('保存选择')
R.keyboard.mouseOnly = { before: beforeMouse, after: await readCounts() }
for (let i = 0; i < 6; i += 1) await shiftTab()
R.keyboard.shiftTab = await ev(`(() => { const a = document.activeElement; return { tag: a.tagName.toLowerCase(), label: (a.innerText || a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 26), outline: getComputedStyle(a).outlineStyle + ' ' + getComputedStyle(a).outlineWidth } })()`)
for (let i = 0; i < 20 && !(await ev(`document.activeElement.className.includes('kf-demo-btn')`)); i += 1) await tab()
R.keyboard.tabLanding = await ev(`(() => { const a = document.activeElement; return { cls: String(a.className), outline: getComputedStyle(a).outlineStyle + ' ' + getComputedStyle(a).outlineWidth + ' ' + getComputedStyle(a).outlineColor, offset: getComputedStyle(a).outlineOffset } })()`)
R.keyboard.countsAfterTab = await readCounts()
await clickText('修复焦点指示')
for (let i = 0; i < 30 && (await readCounts()).after !== '3'; i += 1) await tab()
R.keyboard.afterFixRound = await readCounts()
await clickText('重置实验')
R.keyboard.afterReset = await readCounts()
await shot('d2-keyboard-reset')
save()
console.log('KEYBOARD', JSON.stringify(R.keyboard))

// ---------- 4. 报告清空：键盘确认 / 取消 / 确认，看焦点去哪 ----------
await load('#/contrast')
await setViewport(DESKTOP)
await clickText('生成修复建议')
await clickText('应用该修复')
await ev(`location.hash = '#/report'`); await settle(600)
R.reportClear.before = await ev(`(() => { const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null }; return { stat: pick('已记录 / 总实验数') } })()`)
const domNow = () => ev(`(() => { const a = document.activeElement; const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null }; return { active: { tag: a.tagName.toLowerCase(), id: a.id || null, isBody: a === document.body, cls: String(a.className).slice(0, 34) }, stat: pick('已记录 / 总实验数'), live: ${LIVE_TEXTS}, buttons: [...document.querySelectorAll('main button')].map(b => (b.innerText || '').trim()).filter(t => /清空|取消|确认/.test(t)) } })()`)
async function press(label, keyName = 'Enter') { const stop = await tabTo(label); const act = await keyActivate(label, keyName); return { stop, act } }
R.reportClear.step1EnterTrigger = { ...(await press('清空本次实验记录')), after: await domNow() }
R.reportClear.step2Cancel = { ...(await press('取消，保留记录')), after: await domNow() }
await press('清空本次实验记录')
R.reportClear.step3Focused = await domNow()
R.reportClear.step4Confirm = { ...(await press('确认清空记录')), after: await domNow() }
R.reportClear.afterConfirm = await ev(`(() => { const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null }; return { stat: pick('已记录 / 总实验数'), disabled: [...document.querySelectorAll('main button')].filter(b => /复制|下载|清空/.test(b.innerText)).map(b => b.disabled), active: { tag: document.activeElement.tagName.toLowerCase(), isBody: document.activeElement === document.body, cls: String(document.activeElement.className).slice(0, 30) } } })()`)
await shot('d3-report-cleared')
R.console = consoleMsgs
save()
console.log('CLEAR', JSON.stringify(R.reportClear, null, 1).slice(0, 1600))
console.log('CONSOLE msgs =', consoleMsgs.length)
console.log('PART3 DONE')
browser.kill(); ws.close(); server.close()
