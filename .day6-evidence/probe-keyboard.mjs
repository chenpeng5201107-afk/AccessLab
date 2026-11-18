// 单独探针：看键盘实验页在真实浏览器里的 Tab 停靠点、计数口径与按钮可用条件
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

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day6-probe-'))
const bin = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const browser = spawn(bin, ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' })
async function json(url) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const r = await fetch(url)
      if (r.ok) return await r.json()
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('no cdp')
}
const version = await json('http://127.0.0.1:9334/json/version')
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
const settle = (ms = 300) => ev(`new Promise(r=>setTimeout(()=>r(true),${ms}))`)
await cmd('Page.navigate', { url: BASE })
for (let i = 0; i < 200 && !events.some((e) => e.method === 'Page.loadEventFired'); i += 1) await new Promise((r) => setTimeout(r, 100))
await settle(700)
console.log('h1:', await ev(`document.querySelector('main h1').textContent.trim()`))

const stop = () => ev(`(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return {
    tag: el.tagName.toLowerCase(),
    cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
    label: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 22),
    href: el.getAttribute && el.getAttribute('href'),
    isDemo: el.classList ? el.classList.contains('kf-demo-btn') : false,
    outline: cs.outlineStyle + ' ' + cs.outlineWidth,
  }
})()`)
const tab = async () => { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
const shiftTab = async () => { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 }) }

console.log('activeElement on load:', JSON.stringify(await stop()))
console.log('--- 18 次 Tab ---')
for (let i = 0; i < 18; i += 1) {
  await tab()
  console.log(i + 1, JSON.stringify(await stop()))
}
console.log('--- 计数区 ---')
console.log(await ev(`JSON.stringify([...document.querySelectorAll('dt')].map(d => [d.innerText.replace(/\\s+/g,' ').trim(), (d.nextElementSibling||{innerText:''}).innerText.replace(/\\s+/g,' ').trim()]), null, 1)`))
console.log('--- Shift+Tab 回到开头 ---')
for (let i = 0; i < 8; i += 1) {
  await shiftTab()
  const s = await stop()
  console.log(i + 1, JSON.stringify(s))
  if (s.href === '#main') {
    await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    await settle(400)
    console.log('Enter 后:', JSON.stringify(await ev(`({ activeId: document.activeElement.id, activeTag: document.activeElement.tagName.toLowerCase(), hash: location.hash, h1: document.querySelector('main h1').textContent.trim() })`)))
    break
  }
}
console.log('--- 观察按钮状态 ---')
console.log(await ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='我已完成观察'); return b ? { disabled: b.disabled, aria: b.getAttribute('aria-disabled'), hint: (b.closest('section')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,160) } : 'not found' })()`))
browser.kill(); ws.close(); server.close()
