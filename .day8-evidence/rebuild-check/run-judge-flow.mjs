// Day 7 验收取证 part 2：实时区域播报、完整评委动线、报告三态、复制/下载、会话性、性能。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, '.day8-evidence')
const SHOTS = path.join(OUT, 'shots')
const DL = path.join(OUT, process.env.DL_DIR ?? 'downloads')
fs.rmSync(DL, { recursive: true, force: true })
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(DL, { recursive: true })

const LIVE_TARGET = process.env.LIVE_URL ? process.env.LIVE_URL.replace(/\/$/, '') : ''
const SUFFIX = process.env.OUT_SUFFIX ?? (LIVE_TARGET ? '-live' : '')
const BROWSER = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const PORT = 9358
const DESKTOP = { width: 1440, height: 900, mobile: false }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})
const BASE = LIVE_TARGET ? LIVE_TARGET + '/index.html' : await (async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return `http://127.0.0.1:${server.address().port}/index.html`
})()
console.log('target', BASE)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'day8-judge-'))
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
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) consoleMsgs.push({ type: d.params.type, text: (d.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 180) })
  if (d.method === 'Runtime.exceptionThrown') consoleMsgs.push({ type: 'exception', text: String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 180) })
  if (d.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.params.entry.level)) consoleMsgs.push({ type: d.params.entry.level, text: `${d.params.entry.source}: ${d.params.entry.text}`.slice(0, 180) })
  if (d.method === 'Network.responseReceived') requests.push({ url: d.params.response.url, status: d.params.response.status, encoded: d.params.response.encodedDataLength })
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = id++; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })
async function waitEvent(method, timeout = 20000) { const cut = () => { const i = events.findIndex((e) => e.method === method); if (i >= 0) { events.splice(i, 1); return true } return false }; if (cut()) return; const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (cut()) return; await new Promise((r) => setTimeout(r, 40)) } throw new Error('超时 ' + method) }
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const cmd = (m, p = {}) => send(m, p, sessionId)
await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Log.enable'); await cmd('Network.enable')
await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true }).catch(() => {})
await cmd('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL }).catch(() => {})
const origin = new URL(BASE).origin
await cmd('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'], origin }).catch((e) => console.log('剪贴板授权失败：', String(e.message).slice(0, 60)))
const settle = (ms = 300) => ev(`new Promise(r => setTimeout(() => r(true), ${ms}))`)
async function ev(expression) { const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'evaluate 失败') + ' :: ' + expression.slice(0, 70)); return r.result.value }
async function setViewport(v) { await cmd('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile }); await ev('new Promise(r => requestAnimationFrame(() => r(true)))') }
async function load(hash) { for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1); await cmd('Page.navigate', { url: BASE }); await waitEvent('Page.loadEventFired'); await settle(150); if (hash) { await ev(`location.hash = ${JSON.stringify(hash)}`); await settle() } }
async function shot(name) { const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(data, 'base64')) }
async function tab() { await cmd('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, key: 'Tab', code: 'Tab', text: '\t' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, code: 'Tab' }) }
async function pressEnter() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }); await cmd('Input.dispatchKeyEvent', { type: 'char', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter', text: '\r' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }) }
async function pressSpace() { await cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, key: ' ', code: 'Space' }); await cmd('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, key: ' ', code: 'Space', text: ' ' }) }
async function clickText(label, kind = 'button') {
  const mark = await ev(`(() => {
    const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)});
    if (!el) return { error: 'not-found', present: [...document.querySelectorAll('${kind}')].map(e => (e.innerText || '').trim().slice(0, 22)).filter(Boolean) };
    if (el.disabled) return { error: 'disabled', reason: (el.parentElement || {}).innerText ? String(el.parentElement.innerText).replace(/\\s+/g, ' ').trim().slice(0, 120) : null };
    el.setAttribute('data-day7-target', '1');
    return { ok: true };
  })()`)
  if (mark.error) throw new Error(`点不到「${label}」: ${mark.error} ${JSON.stringify(mark.present || mark.reason || '').slice(0, 240)}`)
  let box = null
  for (let attempt = 1; attempt <= 5 && !box; attempt += 1) {
    await ev(`document.querySelector('[data-day7-target]').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await settle(80)
    box = await ev(`(() => {
      const el = document.querySelector('[data-day7-target]');
      const r = el.getBoundingClientRect();
      const x = Math.round(r.x + r.width / 2), y = Math.round(r.y + r.height / 2);
      const hit = document.elementFromPoint(x, y);
      return { x, y, ok: !!hit && (hit === el || el.contains(hit) || hit.contains(el)), hitLabel: hit ? hit.tagName + '|' + String(hit.className).slice(0, 40) + '|' + (hit.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 20) : 'none' };
    })()`)
    if (!box.ok) { console.log(`  重试 ${attempt} 「${label}」 @${box.x},${box.y} hit=${box.hitLabel}`); box = null; await settle(200) }
    else console.log(`CLICK ${label} @${box.x},${box.y} hit=${box.hitLabel}`)
  }
  if (!box) { await ev(`document.querySelector('[data-day7-target]')?.removeAttribute('data-day7-target')`); throw new Error(`「${label}」命中测试连续失败`) }
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await ev(`document.querySelector('[data-day7-target]')?.removeAttribute('data-day7-target')`)
  await settle(320)
}
async function focusAndActivate(label, kind = 'button', useSpace = false) {
  const ok = await ev(`(() => { const el = [...document.querySelectorAll('${kind}')].find(e => (e.innerText || '').trim() === ${JSON.stringify(label)}); if (!el) return 'not-found'; if (el.disabled) return 'disabled'; el.focus(); return 'focused' })()`)
  if (ok !== 'focused') return ok
  if (useSpace) await pressSpace(); else await pressEnter()
  await settle(320)
  return 'activated'
}
const LIVES = `[...document.querySelectorAll('[role="status"],[aria-live]')].map(e => ({ role: e.getAttribute('role'), live: e.getAttribute('aria-live'), text: (e.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 90) }))`

const R = { ua: version.Browser, target: BASE, liveChurn: [], flow: {}, report: {}, export: {}, session: {}, console: {}, network: {} }
const save = () => fs.writeFileSync(path.join(OUT, `judge-flow${SUFFIX}.json`), JSON.stringify(R, null, 2))

// ---------- 1. 每个关键操作后，哪些实时区域变了（重复 / 矛盾播报取证） ----------
async function churn(route, actions) {
  await load(route)
  await setViewport(DESKTOP)
  for (const label of actions) {
    const before = await ev(LIVES)
    await clickText(label)
    const after = await ev(LIVES)
    const changed = after.map((a, i) => (before[i] && before[i].text === a.text ? null : { at: i, was: before[i] ? before[i].text : '(新增)', now: a.text, role: a.role, live: a.live })).filter(Boolean)
    R.liveChurn.push({ route, action: label, regions: after.length, changedCount: changed.length, changed, all: after.map((a) => a.text) })
    console.log(`LIVE ${route} 「${label}」: 区域 ${after.length} 个，本轮变化 ${changed.length} 个`)
  }
}
await churn('#/contrast', ['生成修复建议', '应用该修复'])
await churn('#/form-label', ['修复标签关联'])
await churn('#/keyboard', ['修复焦点指示'])

// ---------- 1b. 真实键盘激活示例按钮：Enter 与 Space 都要能用，且激活不额外计入到达次数 ----------
R.kbActivate = []
for (const keyName of ['Enter', 'Space']) {
  await load('#/keyboard')
  await setViewport(DESKTOP)
  const counts0 = await ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); return (t.match(/修复前键盘到达 (\\d+) 次/) || [])[1] || '0' })()`)
  await ev(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`)
  let landed = null
  let presses = 0
  while (!landed && presses < 24) {
    presses += 1
    await tab()
    landed = await ev(`(() => { const a = document.activeElement; if (!String(a.className).includes('kf-demo-btn')) return null; const cs = getComputedStyle(a); return { label: (a.innerText || '').trim(), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, offset: cs.outlineOffset } })()`)
  }
  if (!landed) { R.kbActivate.push({ keyName, error: '24 次 Tab 内没走到示例按钮' }); continue }
  const countsAfterTab = await ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); return (t.match(/修复前键盘到达 (\\d+) 次/) || [])[1] || '0' })()`)
  if (keyName === 'Enter') await pressEnter(); else await pressSpace()
  await settle(420)
  R.kbActivate.push({
    keyName, landed, presses,
    counts: { beforeTab: counts0, afterTab: countsAfterTab, afterActivate: await ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); return (t.match(/修复前键盘到达 (\\d+) 次/) || [])[1] || '0' })()`) },
    live: await ev(LIVES),
    focusAfter: await ev(`(() => { const a = document.activeElement; return { tag: a.tagName.toLowerCase(), label: (a.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 24), isBody: a === document.body } })()`)
  })
  console.log('KB-ACTIVATE', keyName, JSON.stringify(R.kbActivate[R.kbActivate.length - 1]).slice(0, 420))
}
await clickText('重置实验').catch(() => {})
save()

// ---------- 2. 完整评委动线（真实 Tab 计数 + 人工确认） ----------
const t0 = Date.now()
await load('#/')
await setViewport(DESKTOP)
await clickText('开始第一个实验', 'a')
R.flow.afterCta = await ev(`({ hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
await clickText('生成修复建议')
await clickText('应用该修复')
R.flow.contrast = await ev(`(() => { const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null }; return { before: pick('当前对比度（未取整真实值）'), hash: location.hash } })()`)
await clickText('进入表单标签实验', 'a')
R.flow.afterFormStep = await ev(`({ hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
await clickText('修复标签关联')
R.flow.form = await ev(`(() => { const rows = [...document.querySelectorAll('main dl div')].map(d => (d.innerText || '').replace(/\\s+/g, ' ').trim()); return { issueLine: rows.find(t => t.includes('个问题') || t.includes('问题')) || null, hash: location.hash } })()`)
await clickText('进入键盘焦点实验', 'a')
R.flow.afterKbStep = await ev(`({ hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)

async function tabDemoTimes(n, max = 60) {
  let hits = 0
  let presses = 0
  const seen = []
  await ev(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`)
  while (hits < n && presses < max) {
    presses += 1
    await tab()
    const s = await ev(`(() => { const el = document.activeElement; return { cls: String(el.className || ''), label: (el.innerText || '').trim().slice(0, 12) } })()`)
    if (s.cls.includes('kf-demo-btn')) { hits += 1; seen.push(s.label) }
  }
  const counters = await ev(`(() => { const t = document.querySelector('main').innerText.replace(/\\s+/g, ' '); return { before: (t.match(/修复前键盘到达 (\\d+) 次/) || [])[1] || null, after: (t.match(/修复后键盘到达 (\\d+) 次/) || [])[1] || null } })()`)
  return { hits, presses, seen, counters }
}
const round1 = await tabDemoTimes(3)
console.log('R1', JSON.stringify(round1))
await clickText('修复焦点指示')
console.log('repaired =', await ev(`!!document.querySelector('.kf-demo-btn--fixed')`))
const round2 = await tabDemoTimes(3)
console.log('R2', JSON.stringify(round2))
await clickText('我已完成观察')
R.flow.keyboard = { round1, round2, confirmed: await ev(`[...document.querySelectorAll('p')].some(p => p.innerText.includes('已记录你的观察确认'))`) }
console.log('KEYBOARD', JSON.stringify(R.flow.keyboard))
await shot('c1-keyboard-fixed-1440' + SUFFIX)

await clickText('查看统一成果报告', 'a').catch(async () => { await ev(`location.hash = '#/report'`); await settle(500) })
R.flow.reportH1 = await ev(`({ hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim() })`)
R.flow.elapsedMs = Date.now() - t0

// ---------- 3. 报告三态在真实浏览器里的读数 ----------
R.report = await ev(`(() => {
  const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null };
  const groups = [...document.querySelectorAll('main h4')].filter(h => /（\\d+ 项）/.test(h.innerText)).map(h => { const li = h.closest('li'); const items = [...li.querySelectorAll(':scope > ul > li')].map(x => x.innerText.replace(/\\s+/g, ' ').trim()); return { heading: h.innerText.replace(/\\s+/g, ' ').trim(), items } });
  const body = document.querySelector('main').innerText.replace(/\\s+/g, ' ');
  return {
    stats: { 已记录: pick('已记录 / 总实验数'), 已修复: pick('已实际执行修复的实验数'), 复核: pick('已进行修复后复核（含人工键盘体验）的实验数'), 待观察: pick('实验内仍待你本人完成的观察'), 额外验证: pick('建议额外进行的辅助技术验证') },
    groups: groups.map(g => ({ heading: g.heading, count: g.items.length })),
    groupTexts: groups,
    stillSaysKeyboardPending: body.includes('你还没有点「我已完成观察」'),
    keyboardConfirmedLine: body.includes('实验内已确认：键盘焦点实验'),
    claimLine: (body.match(/人工确认：[^。]*。/) || [null])[0],
    lead: (body.match(/这次会话登记了[^。]*。/) || [null])[0],
    nonCert: body.includes('不是网站 WCAG 合规认证'),
  }
})()`)
R.report.countsMatch = R.report.groups.every((g, i) => Number(g.heading.match(/（(\d+) 项）/)[1]) === g.count)
console.log('REPORT', JSON.stringify(R.report.stats), 'countsMatch=', R.report.countsMatch, 'stillPending=', R.report.stillSaysKeyboardPending, 'confirmedLine=', R.report.keyboardConfirmedLine)
save()
await shot('c2-report-1440' + SUFFIX)

// ---------- 4. 复制与下载 ----------
await ev(`(() => { window.__day7Copy = null; const orig = navigator.clipboard && navigator.clipboard.writeText; if (orig) navigator.clipboard.writeText = function (t) { window.__day7Copy = { len: t.length, sameAsTextarea: t === document.querySelector('textarea#report-markdown-source').value }; return orig.call(this, t) }; return !!orig })()`)
const statusCopy = () => ev(`(() => { const els = [...document.querySelectorAll('[role="status"],[aria-live]')].map(e => (e.innerText || '').replace(/\\s+/g, ' ').trim()).filter(t => t.length); return { all: els, copy: els.find(t => t.includes('复制')) || null } })()`)
// 4a 真实鼠标点击复制
await clickText('复制 Markdown 报告')
R.export.copyByMouse = { hook: await ev(`window.__day7Copy`), status: await statusCopy() }
R.export.clipboardReadAfterMouseCopy = await ev(`navigator.clipboard.readText().then(t => ({ chars: t.length, sameAsReport: t === document.querySelector('textarea#report-markdown-source').value })).catch(e => 'read-failed: ' + e.name)`)
await ev(`window.__day7Copy = null`)
// 4b 键盘 Enter 激活同一个按钮
const kbFocus = await ev(`(() => { const el = [...document.querySelectorAll('button')].find(e => (e.innerText || '').trim() === '复制 Markdown 报告'); el.scrollIntoView({ block: 'center', behavior: 'instant' }); el.focus(); const a = document.activeElement; return { same: a === el, tag: a && a.tagName, label: a && (a.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 24) } })()`)
await pressEnter()
await settle(420)
R.export.copyByKeyboard = { focusBeforeEnter: kbFocus, hook: await ev(`window.__day7Copy`), status: await statusCopy() }
console.log('COPY', JSON.stringify(R.export.copyByMouse), JSON.stringify(R.export.copyByKeyboard))
R.export.mdLen = await ev(`document.querySelector('textarea#report-markdown-source').value.length`)
R.export.mdHasThreeState = await ev(`(() => { const v = document.querySelector('textarea#report-markdown-source').value; return { pending: v.includes('实验内仍待你本人完成的观察'), done: v.includes('实验内已由你确认完成的观察'), extra: v.includes('建议额外进行的辅助技术与真实场景验证'), noFalsePending: !v.includes('你还没有点「我已完成观察」') } })()`)
const before = fs.readdirSync(DL)
await clickText('下载 .md 文件')
for (let i = 0; i < 40; i += 1) { await new Promise((r) => setTimeout(r, 250)); if (fs.readdirSync(DL).some((f) => !f.endsWith('.crdownload') && !before.includes(f))) break }
const files = fs.readdirSync(DL).filter((f) => f.endsWith('.md'))
const mdBytes = Buffer.byteLength(await ev(`document.querySelector('textarea#report-markdown-source').value`), 'utf8')
R.export.download = files.length ? { file: files[0], bytes: fs.statSync(path.join(DL, files[0])).size, textareaBytes: mdBytes, identical: fs.statSync(path.join(DL, files[0])).size === mdBytes } : { file: null, textareaBytes: mdBytes }
console.log('EXPORT', JSON.stringify(R.export))
save()

// ---------- 5. 会话性：切路由保留 / 刷新清空 / 重进键盘实验不覆盖他项 ----------
R.session.afterRouteSwitch = await ev(`(async () => { location.hash = '#/keyboard'; await new Promise(r => setTimeout(r, 400)); location.hash = '#/report'; await new Promise(r => setTimeout(r, 500)); const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === '已记录 / 总实验数'); return dt ? dt.nextElementSibling.innerText.trim() : null })()`)
R.session.afterReenterKeyboard = await ev(`(async () => { location.hash = '#/keyboard'; await new Promise(r => setTimeout(r, 900)); const rows = [...document.querySelectorAll('main dt')].map(d => d.innerText.trim()); return { hash: location.hash, hasCounters: rows.filter(t => t.includes('键盘导航到达')) } })()`)
R.session.ledgerAfterReenter = await ev(`(async () => { location.hash = '#/report'; await new Promise(r => setTimeout(r, 600)); const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === '已记录 / 总实验数'); return dt ? dt.nextElementSibling.innerText.trim() : null })()`)
const kbRecordAfterReenter = await ev(`(() => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === '修复后键盘导航到达次数'); return dt ? dt.nextElementSibling.innerText.trim() : null })()`)
R.session.keyboardAfterReenter = kbRecordAfterReenter
for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1)
await cmd('Page.reload'); await waitEvent('Page.loadEventFired'); await settle(600)
R.session.afterReload = await ev(`(() => { const pick = l => { const dt = [...document.querySelectorAll('dt')].find(d => d.innerText.trim() === l); return dt ? dt.nextElementSibling.innerText.trim() : null }; return { stat: pick('已记录 / 总实验数'), copyDisabled: document.querySelector('button') ? [...document.querySelectorAll('main button')].filter(b => /复制|下载|清空/.test(b.innerText)).map(b => b.disabled) : null } })()`)
console.log('SESSION', JSON.stringify(R.session))
save()

// ---------- 6. 前进后退与深链 ----------
R.compatNav = await ev(`(async () => { const out = []; location.hash = '#/contrast'; await new Promise(r => setTimeout(r, 300)); out.push(location.hash); location.hash = '#/report'; await new Promise(r => setTimeout(r, 300)); out.push(location.hash); history.back(); await new Promise(r => setTimeout(r, 400)); out.push('back→' + location.hash + ':' + (document.querySelector('main h1') || {}).textContent.trim()); history.forward(); await new Promise(r => setTimeout(r, 400)); out.push('fwd→' + location.hash + ':' + (document.querySelector('main h1') || {}).textContent.trim()); return out })()`)
const deepLink = (LIVE_TARGET ? LIVE_TARGET : BASE.replace(/index\.html$/, 'index.html')) + '?day7=deep' + '#/keyboard'
for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].method === 'Page.loadEventFired') events.splice(i, 1)
await cmd('Page.navigate', { url: deepLink }); await waitEvent('Page.loadEventFired'); await settle(600)
R.compatNav.deepLink = await ev(`({ url: location.href.slice(-40), hash: location.hash, h1: (document.querySelector('main h1') || {}).textContent.trim(), title: document.title })`)
console.log('NAV', JSON.stringify(R.compatNav))
save()

// ---------- 7. 网络与性能 ----------
R.network.total = requests.length
R.network.non2xx = requests.filter((r) => r.status >= 400 || r.status === 0).map((r) => `${r.status} ${r.url.slice(-70)}`)
R.network.kBytes = Math.round(requests.reduce((s, r) => s + (r.encoded || 0), 0) / 1024)
R.network.byHost = Object.entries(requests.reduce((a, r) => { const h = new URL(r.url).host; a[h] = (a[h] || 0) + 1; return a }, {}))
R.console.errors = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'exception')
R.console.warnings = consoleMsgs.filter((m) => m.type === 'warning')
R.console.sample = consoleMsgs.slice(0, 8)
R.perf = await ev(`(() => { const e = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource'); return { domContentLoadedMs: e ? Math.round(e.domContentLoadedEventEnd - e.startTime) : null, loadMs: e ? Math.round(e.loadEventEnd - e.startTime) : null, resourceCount: res.length, slowest: res.map(r => ({ name: r.name.split('/').pop().slice(0, 28), ms: Math.round(r.duration) })).sort((a, b) => b.ms - a.ms).slice(0, 3), transferBytes: res.reduce((s, r) => s + (r.transferSize || 0), 0) } })()`)
console.log('NETWORK', R.network.total, 'requests, non2xx=', R.network.non2xx.length, 'console errors=', R.console.errors.length, 'warnings=', R.console.warnings.length)
console.log('PERF', JSON.stringify(R.perf))

console.log('PART2 DONE, elapsed', R.flow.elapsedMs, 'ms')
browser.kill(); ws.close(); server.close()
