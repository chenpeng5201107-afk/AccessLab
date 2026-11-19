// D3 真实性能与请求取证：本机静态服务 + 两台 Chromium 内核浏览器各做一次全新加载。
// 只记录浏览器自己报的数字，不引用 Lighthouse，也不把本机 loopback 时间当成公网加载时间。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = 'C:/Users/zxcvb/OneDrive/Desktop/AccessLab'
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day7-evidence')
const BROWSERS = [
  { name: 'edge', bin: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', port: 9351 },
  { name: 'chrome', bin: 'C:/Program Files/Google/Chrome/Application/chrome.exe', port: 9352 },
]
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/index.html`

const results = { servedFrom: DIST, localLoopback: true, runs: [] }
fs.writeFileSync(path.join(OUT, 'part6-perf.json'), JSON.stringify(results, null, 2))

for (const b of BROWSERS) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), `day7-perf-${b.name}-`))
  const proc = spawn(b.bin, ['--headless=new', `--remote-debugging-port=${b.port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
  const json = async (u) => { for (let i = 0; i < 100; i += 1) { try { const r = await fetch(u); if (r.ok) return await r.json() } catch {} await new Promise((r) => setTimeout(r, 200)) } throw new Error('CDP 未就绪') }
  const ver = await json(`http://127.0.0.1:${b.port}/json/version`)
  const ws = new WebSocket(ver.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 1
  const pending = new Map()
  const events = []
  const consoleMsgs = []
  const finished = []
  const received = []
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(new Error(JSON.stringify(d.error))) : p.resolve(d.result); return }
    if (!d.method) return
    events.push(d)
    if (d.method === 'Network.responseReceived') received.push({ url: d.params.response.url.replace(/^[^/]*\/\/[^/]+/, ''), status: d.params.response.status, type: d.params.response.mimeType })
    if (d.method === 'Network.loadingFinished') finished.push({ requestId: d.params.requestId, encoded: d.params.encodedDataLength })
    if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) consoleMsgs.push(d.params.type + ': ' + (d.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 120))
    if (d.method === 'Runtime.exceptionThrown') consoleMsgs.push('exception: ' + String(d.params.exceptionDetails?.exception?.description || '').slice(0, 120))
  }
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
  const waitEvent = async (method, timeout = 20000) => { const cut = () => { const i = events.findIndex((e) => e.method === method); if (i >= 0) { events.splice(i, 1); return true } return false }; if (cut()) return; const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (cut()) return; await new Promise((r) => setTimeout(r, 30)) } throw new Error('超时 ' + method) }
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const cmd = (m, p = {}) => send(m, p, sessionId)
  await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable')
  const ev = async (expression) => { const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 60)); return r.result.value }

  // 全新加载首页
  await cmd('Page.navigate', { url: BASE })
  await waitEvent('Page.loadEventFired')
  await new Promise((r) => setTimeout(r, 600))
  const perf = await ev(`(() => { const nav = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource').map(r => ({ name: r.name.replace(/^[^/]*\\/\\/[^/]+/, ''), transferSize: r.transferSize, decodedBodySize: r.decodedBodySize, duration: Math.round(r.duration) })); return {
    domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    loadMs: Math.round(nav.loadEventEnd - nav.startTime),
    ttfbMs: Math.round(nav.responseStart - nav.requestStart),
    domBytes: nav.encodedBodySize,
    resources: res,
    transferTotal: nav.transferSize + res.reduce((a, r) => a + r.transferSize, 0),
    dclRelativeHijack: Math.round(nav.domContentLoadedEventEnd),
    counts: { js: res.filter((r) => r.name.endsWith('.js')).length, css: res.filter((r) => r.name.endsWith('.css')).length },
    memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    longTasks: (performance.getEntriesByType('longtask') || []).length
  } })()`)

  // 站内路由切换不应再发请求（只统计属于本应用的路径，排除本机浏览器安全组件注入）
  const APP_PATH = /^(\/index\.html(\?[^/]*)?|\/assets\/|\/favicon\.svg)/
  const appOnly = (list) => list.filter((r) => APP_PATH.test(r.url))
  const injOnly = (list) => list.filter((r) => !APP_PATH.test(r.url))
  const reqBefore = received.length
  await ev(`location.hash = '#/report'`)
  await new Promise((r) => setTimeout(r, 500))
  const routeSwitch = received.slice(reqBefore)
  const routeSwitchRequests = { app: appOnly(routeSwitch).length, injected: injOnly(routeSwitch).map((r) => r.url.slice(0, 40)) }

  // 320 视口下重复一次全新加载，确认可交互且不缺资源
  await cmd('Emulation.setDeviceMetricsOverride', { width: 320, height: 568, deviceScaleFactor: 2, mobile: true })
  const reqBefore320 = received.length
  await cmd('Page.navigate', { url: BASE + '?p=320' })
  await waitEvent('Page.loadEventFired')
  await new Promise((r) => setTimeout(r, 500))
  const load320 = received.slice(reqBefore320)
  const at320 = {
    appRequests: appOnly(load320).map((r) => `${r.status} ${r.url}`),
    injectedRequests: injOnly(load320).length,
    h1: await ev(`(document.querySelector('main h1') || { textContent: 'none' }).textContent.replace(/\\s+/g, ' ').trim()`),
    interactiveTargets: await ev(`document.querySelectorAll('a, button, input').length`),
  }

  results.runs.push({
    browser: b.name,
    ua: ver.Browser,
    loads: {
      appRequestsFirstLoad: appOnly(received).map((r) => `${r.status} ${r.url}`),
      appCount: appOnly(received).length,
      injectedCount: injOnly(received).length,
      injectedSample: [...new Set(injOnly(received).map((r) => r.url.split('?')[0].replace(/[A-Za-z0-9_-]{20,}/g, '<id>')))],
    },
    non2xx: received.filter((r) => r.status >= 400),
    perf,
    routeSwitchRequests,
    at320,
    consoleMessages: consoleMsgs,
  })
  fs.writeFileSync(path.join(OUT, 'part6-perf.json'), JSON.stringify(results, null, 2))
  console.log(b.name, ver.Browser)
  console.log('  应用自身请求', JSON.stringify(results.runs.at(-1).loads.appRequestsFirstLoad.slice(0, 8)))
  console.log('  注入请求', results.runs.at(-1).loads.injectedCount, JSON.stringify(results.runs.at(-1).loads.injectedSample))
  console.log('  perf', JSON.stringify({ dcl: perf.domContentLoadedMs, load: perf.loadMs, ttfb: perf.ttfbMs, res: perf.resources.filter((r) => APP_PATH.test(r.name)) }))
  console.log('  路由切换', JSON.stringify(routeSwitchRequests), '320', JSON.stringify(at320), 'console', consoleMsgs.length)
  ws.close()
  proc.kill()
}

server.close()
fs.writeFileSync(path.join(OUT, 'part6-perf.json'), JSON.stringify(results, null, 2))
console.log('PART6 DONE')
