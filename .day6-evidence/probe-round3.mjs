// 探针 3：走完色彩 + 表单实验后进入键盘页，读 dl 里的 dt/dd 配对与「还需要…」提示，弄清计数与按钮门控
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const DIST = path.join(process.cwd(), 'dist')
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day6-probe3-'))
const bin = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const browser = spawn(bin, ['--headless=new', '--remote-debugging-port=9337', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' })
async function json(url) {
  for (let i = 0; i < 80; i += 1) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('no cdp')
}
const version = await json('http://127.0.0.1:9337/json/version')
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const waiting = new Map()
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { const w = waiting.get(d.id); waiting.delete(d.id); w.resolve(d.result) }
}
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const i = id++; waiting.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable')
const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value }
const settle = (ms = 320) => ev(`new Promise(r=>setTimeout(()=>r(true),${ms}))`)
const tab = async () => { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function clickLabel(label, kind = 'button') {
  const box = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText||'').trim() === ${JSON.stringify(label)}); if (!el) return null; el.scrollIntoView({block:'center',behavior:'instant'}); const r = el.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), disabled: !!el.disabled } })()`)
  if (!box) throw new Error('找不到: ' + label)
  if (box.disabled) throw new Error('禁用中: ' + label)
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await settle(400)
}
const state = () => ev(`(() => {
  const pairs = [...document.querySelectorAll('main dl div')].map(d => { const dt = d.querySelector('dt'), dd = d.querySelector('dd'); return dt ? dt.innerText.trim() + ' => ' + (dd ? dd.innerText.trim() : '') : null }).filter(x => x && /修复前|修复后|到达次数/.test(x));
  const btn = [...document.querySelectorAll('button')].find(x => x.innerText.includes('我已完成观察'));
  const hint = [...document.querySelectorAll('main p, main li')].map(e => e.innerText.trim()).filter(t => t.startsWith('还需要'))[0] ?? null;
  return { hash: location.hash, pairs, disabled: btn ? !!btn.disabled : null, hint: hint ? hint.slice(0, 120) : null };
})()`)
const active = () => ev(`(() => { const el = document.activeElement; return { isDemo: el.classList ? el.classList.contains('kf-demo-btn') : false, label: (el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,14), o: getComputedStyle(el).outlineStyle } })()`)
async function walkToDemo(tag) {
  for (let i = 0; i < 40; i += 1) {
    await tab()
    const f = await active()
    if (f.isDemo) return `${tag}#${i + 1} ${f.label}(${f.o}) ${JSON.stringify((await state()).pairs)}`
  }
  return tag + ' 没走到示例按钮'
}

await cmd('Page.navigate', { url: ORIGIN + '/index.html#/contrast' })
await settle(900)
await clickLabel('生成修复建议')
await clickLabel('应用该修复')
await clickLabel('进入表单标签实验', 'a')
await clickLabel('修复标签关联')
await clickLabel('进入键盘焦点实验', 'a')
console.log('进键盘页：', JSON.stringify(await state()))
for (let i = 0; i < 3; i += 1) console.log(' 第一轮', await walkToDemo('落点'))
await clickLabel('修复焦点指示')
console.log('点修复后：', JSON.stringify(await state()))
for (let i = 0; i < 3; i += 1) console.log(' 第二轮', await walkToDemo('落点'))
console.log('最终：', JSON.stringify(await state()))
browser.kill()
ws.close()
server.close()
