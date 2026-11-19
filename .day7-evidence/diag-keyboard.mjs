// 诊断：键盘实验两轮真实 Tab 计数到底落在哪一步。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const DIST = path.join(process.cwd(), 'dist')
const PORT = 9339
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let f = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/index.html`
const BROWSER = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day7-kfdbg-'))
const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
async function json(u) { for (let i = 0; i < 80; i += 1) { try { const r = await fetch(u); if (r.ok) return await r.json() } catch {} await new Promise((r) => setTimeout(r, 200)) } throw new Error('no cdp') }
const v = await json(`http://127.0.0.1:${PORT}/json/version`)
const ws = new WebSocket(v.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pend = new Map()
const evs = []
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.reject(new Error(JSON.stringify(d.error))) : p.resolve(d.result); return } if (d.method) evs.push(d) }
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pend.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
async function waitE(method) { for (let t = Date.now(); Date.now() - t < 20000;) { const i = evs.findIndex((e) => e.method === method); if (i >= 0) { evs.splice(i, 1); return } await new Promise((r) => setTimeout(r, 40)) } throw new Error('timeout') }
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable')
const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'ev fail'); return r.result.value }
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function load(h) { for (let i = evs.length - 1; i >= 0; i -= 1) if (evs[i].method === 'Page.loadEventFired') evs.splice(i, 1); await cmd('Page.navigate', { url: BASE }); await waitE('Page.loadEventFired'); await settle(200); await ev(`location.hash = ${JSON.stringify(h)}`); await settle(500) }
async function tab() { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function click(label, kind = 'button') { const b = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); if (!el) return { e: 'nf', list: [...document.querySelectorAll('${kind}')].map(x => (x.innerText || '').trim().slice(0, 18)).filter(Boolean) }; if (el.disabled) return { e: 'dis' }; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`); if (b.e) throw new Error(label + ':' + b.e + ' ' + JSON.stringify(b.list || '').slice(0, 200)); await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 }); await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 }); await settle(320) }
const state = () => ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); const c = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === '我已完成观察'); return { before: (t.match(/修复前键盘到达 (\\d+) 次/) || [])[1], after: (t.match(/修复后键盘到达 (\\d+) 次/) || [])[1], fixed: !!document.querySelector('.kf-demo-btn--fixed'), confirmDisabled: c ? c.disabled : null, hint: c && c.parentElement ? (c.parentElement.innerText || '').replace(/\\s+/g, ' ').slice(0, 120) : null, active: (() => { const a = document.activeElement; return a.tagName + '|' + String(a.className || '').slice(0, 26) + '|' + (a.innerText || '').trim().slice(0, 10) })() } })()`)

await load('#/keyboard')
console.log('fresh', JSON.stringify(await state()))
for (let i = 1; i <= 6; i += 1) { await tab(); console.log('tab' + i, JSON.stringify(await ev(`(() => { const a = document.activeElement; return a.tagName + '|' + String(a.className || '').slice(0, 22) + '|' + (a.innerText || '').trim().slice(0, 8) })()`))) }
console.log('afterR1', JSON.stringify(await state()))
await click('修复焦点指示')
console.log('afterRepair', JSON.stringify(await state()))
for (let i = 1; i <= 20; i += 1) { await tab(); const s = await state(); console.log('R2tab' + i, s.active, '| after=' + s.after, '| before=' + s.before) }
console.log('afterR2', JSON.stringify(await state()))
browser.kill(); ws.close(); server.close()
