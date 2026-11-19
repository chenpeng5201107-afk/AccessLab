// Day 7 验收取证 part 5：第二台浏览器（Chrome）端到端 + 可访问性树角色 + :focus-visible 真实判定。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day7-evidence')
const SHOTS = path.join(OUT, 'shots')
const DL = path.join(OUT, 'downloads-chrome')
fs.rmSync(DL, { recursive: true, force: true })
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(DL, { recursive: true })

const BROWSER = process.env.BROWSER_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = Number(process.env.DEBUG_PORT || 9341)
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
console.log('browser', BROWSER)
console.log('target', BASE)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day7-chrome-'))
const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' })
async function json(u, tries = 100) { for (let i = 0; i < tries; i += 1) { try { const r = await fetch(u); if (r.ok) return await r.json() } catch {} await new Promise((r) => setTimeout(r, 200)) } throw new Error('CDP 未就绪') }
const version = await json(`http://127.0.0.1:${PORT}/json/version`)
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
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) consoleMsgs.push({ type: d.params.type, text: (d.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 160) })
  if (d.method === 'Runtime.exceptionThrown') consoleMsgs.push({ type: 'exception', text: String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 160) })
  if (d.method === 'Network.responseReceived') requests.push({ url: d.params.response.url, status: d.params.response.status })
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
async function waitEvent(method, timeout = 20000) { const cut = () => { const i = events.findIndex((e) => e.method === method); if (i >= 0) { events.splice(i, 1); return true } return false }; if (cut()) return; const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (cut()) return; await new Promise((r) => setTimeout(r, 40)) } throw new Error('超时 ' + method) }
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Log.enable'); await cmd('Network.enable')
await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true }).catch(() => {})
await cmd('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL }).catch(() => {})
await cmd('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'], origin: new URL(BASE).origin }).catch((e) => console.log('剪贴板授权失败', String(e.message).slice(0, 50)))
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function ev(expression) { const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 70)); return r.result.value }
async function setViewport(v) { await cmd('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile }); await ev('new Promise(r => requestAnimationFrame(() => r(true)))') }
async function load(url) { for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1); await cmd('Page.navigate', { url }); await waitEvent('Page.loadEventFired'); await settle(400) }
async function tab() { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function pressEnter() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }); await cmd('Input.dispatchKeyEvent', { type: 'char', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter', text: String.fromCharCode(13) }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }) }
async function clickText(label, kind = 'button') {
  const found = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); if (!el) return { error: 'not-found' }; if (el.disabled) return { error: 'disabled' }; el.setAttribute('data-d7', '1'); return { ok: true } })()`)
  if (found.error) throw new Error(`点不到「${label}」: ${found.error}`)
  let box = null
  for (let a = 1; a <= 5 && !box; a += 1) {
    await ev(`document.querySelector('[data-d7]').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await settle(90)
    box = await ev(`(() => { const el = document.querySelector('[data-d7]'); const r = el.getBoundingClientRect(); const x = Math.round(r.x + r.width / 2), y = Math.round(r.y + r.height / 2); const hit = document.elementFromPoint(x, y); return { x, y, ok: !!hit && (hit === el || el.contains(hit) || hit.contains(el)) } })()`)
    if (!box.ok) { box = null; await settle(200) }
  }
  if (!box) throw new Error('命中失败 ' + label)
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await ev(`document.querySelector('[data-d7]')?.removeAttribute('data-d7')`)
  await settle(340)
}
const ring = () => ev(`(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { label: (a.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 20), cls: String(a.className).slice(0, 44), matchesFocusVisible: typeof a.matches === 'function' ? a.matches(':focus-visible') : null, outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, boxShadow: cs.boxShadow.slice(0, 40) } })()`)
// 用真机 Tab 把演示按钮走完，读步骤清单里的「键盘到达 N 次」
async function tabCount(prefix) {
  let hit = '0'
  for (let i = 0; i < 45; i += 1) {
    hit = await ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); return (t.match(/${prefix}键盘到达 (\\d+) 次/) || [])[1] || '0' })()`)
    if (hit === '3') break
    await tab()
  }
  return hit
}
const liveText = (kw) => ev(`(() => { const els = [...document.querySelectorAll('[role="status"],[aria-live]')].map(e => (e.innerText || '').replace(/\\s+/g, ' ').trim()).filter(Boolean); return els.find(t => t.includes(${JSON.stringify(kw)})) || els })()`)
// 当前视口下的可点击目标尺寸、横向溢出与主按钮位置
async function readTargets() {
  return ev(`(() => {
    const px = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } };
    const label = (el) => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.type || el.tagName).replace(/\\s+/g, ' ').trim().slice(0, 26);
    const all = [...document.querySelectorAll('main a, main button, main input, header nav a, footer a')];
    const boxes = all.map((el) => Object.assign({ label: label(el), tag: el.tagName }, px(el)));
    const cta = all.find((el) => el.tagName === 'A' && el.innerText.trim() === '开始第一个实验');
    const navs = [...document.querySelectorAll('header nav a')].map((el) => px(el).h);
    return {
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ctaTop: cta ? Math.round(cta.getBoundingClientRect().top) : -1,
      ctaSize: cta ? px(cta) : null,
      navHeights: navs,
      under24: boxes.filter((b) => b.w > 0 && b.h > 0 && Math.min(b.w, b.h) < 24),
      countUnder44: boxes.filter((b) => b.w > 0 && b.h > 0 && Math.min(b.w, b.h) < 44).length,
      targetsMeasured: boxes.filter((b) => b.w > 0 && b.h > 0).length,
    };
  })()`)
}

const R = { ua: version.Browser, target: BASE, roles: [], focusVisible: {}, compat: {}, download: null, network: {}, console: [] }
const save = () => fs.writeFileSync(path.join(OUT, process.env.OUT_NAME || 'part5-chrome.json'), JSON.stringify(R, null, 2))

// ---------- 1. 可访问性树里的地标角色（回答「DOM 里有第二个 <header>，它是不是 banner」） ----------
await load(BASE); await setViewport(DESKTOP)
for (const hash of ['#/', '#/contrast', '#/form-label', '#/keyboard', '#/report']) {
  await ev(`location.hash = ${JSON.stringify(hash)}`)
  await settle(500)
  const tree = await cmd('Accessibility.getFullAXTree', {})
  const count = (role) => tree.nodes.filter((n) => (n.role && n.role.value) === role).length
  R.roles.push({
    hash,
    banner: count('banner'),
    navigation: count('navigation'),
    main: count('main'),
    contentinfo: count('contentinfo'),
    region: count('region'),
    status: count('status'),
    heading: count('heading'),
    button: count('button'),
    textbox: count('textbox'),
    domHeaders: await ev(`document.querySelectorAll('header').length`),
    unnamed: tree.nodes.filter((n) => ['button', 'textbox', 'link'].includes(n.role && n.role.value) && (!n.name || !n.name.value)).length,
  })
  console.log('AX', hash, JSON.stringify(R.roles[R.roles.length - 1]))
}
save()

// ---------- 2. :focus-visible 的真实表现：Tab 有环、鼠标点击无环（修复态示例按钮） ----------
// 真机 Tab：键盘走到修复态示例按钮上，看焦点环是否出现
await load(BASE); await setViewport(DESKTOP)
await ev(`location.hash = '#/keyboard'`); await settle(500)
await clickText('修复焦点指示')
await ev(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`)
let reached = false
for (let i = 0; i < 40 && !reached; i += 1) {
  await tab()
  reached = !!(await ev(`String(document.activeElement.className).includes('kf-demo-btn--fixed')`))
}
R.focusVisible.byTab = { reached, sample: await ring() }
console.log('RING-TAB', JSON.stringify(R.focusVisible.byTab))
// 同一颗按钮改用鼠标点击：按 :focus-visible 的语义，不该出现键盘焦点环
await ev(`document.activeElement.blur()`)
const box = await ev(`(() => { const b = [...document.querySelectorAll('.kf-demo-btn--fixed')][1]; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = b.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
await settle(350)
R.focusVisible.byMouse = await ring()
console.log('RING-MOUSE', JSON.stringify(R.focusVisible.byMouse))
save()

// ---------- 3. 完整评委动线 + 剪贴板 + 下载 + 深链 + 前进后退 ----------
await load(BASE)
await ev(`location.hash = '#/contrast'`); await settle(400)
await clickText('生成修复建议')
await clickText('应用该修复')
await ev(`location.hash = '#/form-label'`); await settle(400)
await clickText('修复标签关联')
await ev(`location.hash = '#/keyboard'`); await settle(400)
const beforeRound = await tabCount('修复前')
await clickText('修复焦点指示')
const afterRound = await tabCount('修复后')
R.compat.tabCounts = { beforeRound, afterRound }
await clickText('我已完成观察')
await ev(`location.hash = '#/report'`); await settle(700)
R.compat.reportStat = await ev(`(() => { const out = {}; for (const dt of document.querySelectorAll('dt')) { const key = dt.innerText.trim(); if (['已记录 / 总实验数', '已实际执行修复的实验数', '已进行修复后复核（含人工键盘体验）的实验数', '实验内仍待你本人完成的观察', '建议额外进行的辅助技术验证'].includes(key)) out[key] = (dt.nextElementSibling || { innerText: '' }).innerText.trim() } return out })()`)
R.compat.manualHeadings = await ev(`[...document.querySelectorAll('main h4')].map(h => h.innerText.replace(/\\s+/g, ' ').trim()).filter(t => t.includes('项）'))`)
R.compat.manualListItems = await ev(`[...document.querySelectorAll('main h4')].filter(h => h.innerText.includes('项）')).map(h => { const ul = h.parentElement.querySelector('ul'); return ul ? ul.querySelectorAll(':scope > li').length : 0 })`)
R.compat.pendingLine = await ev(`document.querySelector('main').innerText.includes('你还没有点「我已完成观察」')`)
await ev(`(() => { window.__copy = null; const o = navigator.clipboard.writeText; navigator.clipboard.writeText = function (t) { window.__copy = { len: t.length, same: t === document.querySelector('textarea#report-markdown-source').value }; return o.call(this, t) }; return true })()`)
// 鼠标点复制
await clickText('复制 Markdown 报告')
R.compat.copyByMouse = { hook: await ev(`window.__copy`), status: await liveText('复制') }
// 键盘 Enter 激活同一颗复制按钮
await ev(`window.__copy = null`)
const focusOnCopy = await ev(`(() => { const el = [...document.querySelectorAll('button')].find(b => (b.innerText || '').trim() === '复制 Markdown 报告'); el.scrollIntoView({ block: 'center', behavior: 'instant' }); el.focus(); return document.activeElement === el })()`)
await pressEnter()
await settle(420)
R.compat.copyByKeyboard = { focused: focusOnCopy, hook: await ev(`window.__copy`), status: await liveText('复制') }
// OS 剪贴板回读（无头环境常拿不到，只如实记录）
R.compat.osClipboard = await ev(`navigator.clipboard.readText().then(t => ({ chars: t.length, sameAsReport: t === document.querySelector('textarea#report-markdown-source').value })).catch(e => ({ error: String(e).slice(0, 90) }))`)
const before = fs.readdirSync(DL)
await clickText('下载 .md 文件')
for (let i = 0; i < 40; i += 1) { await new Promise((r) => setTimeout(r, 250)); if (fs.readdirSync(DL).some((f) => f.endsWith('.md') && !before.includes(f))) break }
const files = fs.readdirSync(DL).filter((f) => f.endsWith('.md'))
const mdBytes = Buffer.byteLength(await ev(`document.querySelector('textarea#report-markdown-source').value`), 'utf8')
R.download = files.length ? { file: files[0], bytes: fs.statSync(path.join(DL, files[0])).size, textareaBytes: mdBytes, identical: fs.statSync(path.join(DL, files[0])).size === mdBytes, firstLines: fs.readFileSync(path.join(DL, files[0]), 'utf8').split('\n').slice(0, 3) } : { file: null, textareaBytes: mdBytes }
console.log('CHROME DOWNLOAD', JSON.stringify(R.download).slice(0, 260))
save()

R.compat.history = await ev(`(async () => { const h1 = () => (document.querySelector('main h1') || { textContent: 'none' }).textContent.trim(); const out = []; location.hash = '#/contrast'; await new Promise(r => setTimeout(r, 300)); out.push(location.hash); location.hash = '#/report'; await new Promise(r => setTimeout(r, 300)); out.push(location.hash); history.back(); await new Promise(r => setTimeout(r, 500)); out.push('back=' + location.hash + '/' + h1()); history.forward(); await new Promise(r => setTimeout(r, 500)); out.push('fwd=' + location.hash + '/' + h1()); return out })()`)
await load(BASE + '?d7=deep#/form-label')
R.compat.deepLink = await ev(`({ hash: location.hash, h1: (document.querySelector('main h1') || { textContent: 'none' }).textContent.trim(), title: document.title })`)
console.log('CHROME COMPAT', JSON.stringify(R.compat).slice(0, 900))
save()

R.network.total = requests.length
R.network.non2xx = requests.filter((r) => r.status >= 400 || r.status === 0).map((r) => `${r.status} ${r.url.slice(-60)}`)
R.console = consoleMsgs
// 桌面 1440 与窄屏 320 的目标尺寸、首屏主按钮位置对照
await setViewport(DESKTOP)
await load(BASE)
await settle(400)
R.compat.chrome1440 = await readTargets()
await setViewport({ width: 320, height: 568, mobile: true })
await load(BASE)
await settle(400)
R.compat.chrome320 = await readTargets()
await fs.promises.writeFile(path.join(SHOTS, 'chrome-e2e-320.png'), Buffer.from((await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'))
console.log('CHROME 1440', JSON.stringify(R.compat.chrome1440))
console.log('CHROME 320', JSON.stringify(R.compat.chrome320))
save()
console.log('CONSOLE', consoleMsgs.length, 'errors', consoleMsgs.filter((m) => m.type === 'error' || m.type === 'exception').length, 'non2xx', R.network.non2xx.length)
console.log('PART5 DONE')
browser.kill(); ws.close(); server.close()
