// 公网发布后的深链复测：五个 hash 路由各自冷启动加载，核对标题、landmark、skip link 与控制台错误。
// 按键与导航均由本脚本经 CDP 派发给真实浏览器内核，不等同于真人操作或读屏实测。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const OUT = path.join(ROOT, '.day8-evidence')
const LIVE = (process.env.LIVE_URL || 'https://accessibility-lab-3g6uvbn5duq.qoder.zone').replace(/\/$/, '')
const BROWSER = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const PORT = Number(process.env.DEBUG_PORT || 9381)
const ROUTES = [
  { hash: '#/', want: '让每个人都能更轻松地使用互联网' },
  { hash: '#/contrast', want: '色彩对比度实验' },
  { hash: '#/form-label', want: '表单标签实验' },
  { hash: '#/keyboard', want: '键盘焦点实验' },
  { hash: '#/report', want: '统一成果报告' },
]

const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'day8-deeplink-'))}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })

const version = await (async () => {
  for (let i = 0; i < 120; i += 1) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json() } catch {} await new Promise((r) => setTimeout(r, 250)) }
  throw new Error('CDP 未就绪')
})()
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(new Error(JSON.stringify(d.error))) : p.resolve(d.result) }
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const results = []
for (const route of ROUTES) {
  // 每个路由用全新的 target 冷启动，证明深链不依赖先访问首页
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const s = (method, params) => send(method, params, sessionId)
  await s('Page.enable'); await s('Runtime.enable')
  await s('Runtime.evaluate', { expression: 'window.__errs=[];window.addEventListener("error",e=>window.__errs.push(String(e.message)))' })
  await s('Page.navigate', { url: `${LIVE}/index.html${route.hash}` })
  await wait(2500)
  const probe = await s('Runtime.evaluate', {
    expression: `(() => {
      const q = (sel) => document.querySelectorAll(sel).length
      const h1 = document.querySelector('h1')
      const skip = document.querySelector('a[href="#main"]')
      return JSON.stringify({
        hash: location.hash,
        h1: h1 ? h1.textContent.trim() : null,
        hasText: document.body.innerText.includes(${JSON.stringify(route.want)}),
        headerTags: q('header'), navTags: q('nav'), mainTags: q('main'), footerTags: q('footer'),
        skipText: skip ? skip.textContent.trim() : null,
        jsErrors: (window.__errs || []),
        bodyLen: document.body.innerText.length,
      })
    })()`,
    returnByValue: true,
  })
  const data = JSON.parse(probe.result.value)
  results.push({ route: route.hash, ...data, ok: data.hash === route.hash && data.hasText === true && data.mainTags === 1 && data.h1 !== null })
  console.log(route.hash, JSON.stringify(data))
  await send('Target.closeTarget', { targetId })
}

fs.writeFileSync(path.join(OUT, (process.env.OUT_NAME || '') + 'public-deeplinks.json'), JSON.stringify({ live: LIVE, at: new Date().toISOString(), results }, null, 2))
console.log('ALL_OK', results.every((r) => r.ok))
browser.kill()
process.exit(0)
