// 探针 2：用鼠标点「修复焦点指示」之后，只用真实 Tab 走第二轮，看计数是否累加
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const DIST = path.join(process.cwd(), 'dist')
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/index.html#/keyboard`

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day6-probe2-'))
const bin = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const browser = spawn(bin, ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' })
async function json(url) {
  for (let i = 0; i < 80; i += 1) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('no cdp')
}
const version = await json('http://127.0.0.1:9335/json/version')
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const waiting = new Map()
const events = []
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { const w = waiting.get(d.id); waiting.delete(d.id); w.resolve(d.result) } else events.push(d)
}
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const i = id++; waiting.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable')
const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value }
const settle = (ms = 320) => ev(`new Promise(r=>setTimeout(()=>r(true),${ms}))`)
const counters = () => ev(`(() => {
  const pick = (label) => { const dt = [...document.querySelectorAll('dt')].find(d => d.textContent.includes(label)); return dt ? dt.nextElementSibling.textContent.trim() : null }
  const btn = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '我已完成观察')
  return { before: pick('修复前'), after: pick('修复后'), confirmDisabled: btn ? btn.disabled : null, keyboardNav: document.body.dataset.kf === 'on' }
})()`)
const active = () => ev(`(() => { const el = document.activeElement; return { isDemo: el.classList ? el.classList.contains('kf-demo-btn') : false, label: (el.innerText || '').replace(/\\s+/g,' ').trim().slice(0, 16), outline: getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth } })()`)
const tab = async () => { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function clickLabel(label, kind = 'button') {
  const box = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText||'').trim() === ${JSON.stringify(label)}); if (!el) return null; el.scrollIntoView({block:'center',behavior:'instant'}); const r = el.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), disabled: el.disabled } })()`)
  if (!box || box.disabled) throw new Error('点不到: ' + label + ' ' + JSON.stringify(box))
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await settle()
}

await cmd('Page.navigate', { url: BASE })
for (let i = 0; i < 200 && !events.some((e) => e.method === 'Page.loadEventFired'); i += 1) await new Promise((r) => setTimeout(r, 100))
await settle(700)

console.log('第一轮：只按 Tab 直到修复前=3 次')
for (let i = 0; i < 20; i += 1) {
  await tab()
  const a = await active()
  const c = await counters()
  console.log(i + 1, JSON.stringify(a), JSON.stringify(c))
  if (c.before === '3 次') break
}

console.log('用鼠标点「修复焦点指示」')
await clickLabel('修复焦点指示')
console.log('点完立刻读：', JSON.stringify(await counters()))

console.log('第二轮：继续只按 Tab')
for (let i = 0; i < 24; i += 1) {
  await tab()
  const a = await active()
  const c = await counters()
  console.log(i + 1, JSON.stringify(a), JSON.stringify(c))
  if (c.after === '3 次' && c.confirmDisabled === false) break
}
browser.kill(); ws.close(); server.close()
