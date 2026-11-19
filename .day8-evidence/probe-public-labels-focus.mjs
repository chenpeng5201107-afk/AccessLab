// 公网发布后的补测探针：真实浏览器加载线上地址时，验证两处修复在公网上确实生效。
// 1) 表单标签修复后的真实 DOM（input.labels 与 label[for]）；2) 焦点修复后 Tab 到示例按钮的 getComputedStyle(outline)。
// 按键与点击均由本脚本经 CDP 派发给真实浏览器内核，不等同于真人手按实体键盘或读屏实测。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const OUT = path.join(ROOT, '.day8-evidence')
const LIVE = (process.env.LIVE_URL || 'https://accessibility-lab-3g6uvbn5duq.qoder.zone').replace(/\/$/, '')
const BROWSER = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const PORT = Number(process.env.DEBUG_PORT || 9377)
const BASE = `${LIVE}/index.html`

const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'day8-public-'))}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })

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
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const s = (method, params) => send(method, params, sessionId)
await s('Page.enable'); await s('Runtime.enable'); await s('DOM.enable')
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const nav = async (hash) => { await s('Page.navigate', { url: `${BASE}#/${hash}` }); await wait(1000) }
const ev = async (expression) => { const r = await s('Runtime.evaluate', { expression, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value }
const findButton = (text) => `(() => { const b = [...document.querySelectorAll('button, a')].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!b) return null; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }) })()`
const clickText = async (text) => {
  const raw = await ev(findButton(text))
  if (!raw) throw new Error('找不到按钮：' + text)
  const { x, y } = JSON.parse(raw)
  // 先移动再做命中校验，确认坐标下就是这个按钮，避免点在遮罩或错位区域上
  await s('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  const hit = await ev(`(() => { const e = document.elementFromPoint(${x}, ${y}); const b = [...document.querySelectorAll('button, a')].find(v => v.textContent.trim() === ${JSON.stringify(text)}); return JSON.stringify({ hitText: (e && (e.closest('button, a') || e).textContent || '').trim().slice(0, 24), contains: !!(b && e && b.contains(e)) }) })()`)
  await s('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
  await wait(700)
  return JSON.parse(hit)
}
const pressTab = async () => {
  await s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
  await s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
  await wait(200)
}

const LABEL_READ = `(() => { const i = document.getElementById('student-name'); if (!i) return null; const ls = [...(i.labels || [])]; return JSON.stringify({ labels: ls.length, labelText: ls[0] ? ls[0].textContent.trim() : null, htmlFor: ls[0] ? ls[0].getAttribute('for') : null, tag: ls[0] ? ls[0].tagName.toLowerCase() : null, value: i.value }) })()`
const OUTLINE_READ = `(() => { const a = document.activeElement; const cs = getComputedStyle(a); return JSON.stringify({ tag: a.tagName.toLowerCase(), label: (a.textContent || '').trim(), outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset }) })()`

const pressEnterOn = async (text) => {
  // 托管层会在页面上注入水印浮层，鼠标坐标可能被它接走；这里改用真实按键激活，绕开遮挡。
  const ok = await ev(`(() => { const b = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.scrollIntoView({block:'center'}); b.focus(); return document.activeElement === b })()`)
  if (!ok) throw new Error('无法聚焦按钮：' + text)
  for (const type of ['keyDown', 'keyUp']) await s('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' })
  await wait(700)
  return { focused: true, via: 'keyboard Enter' }
}
const result = { target: BASE, browser: version.Browser, form: {}, keyboard: {} }

await nav('form-label')
result.form.beforeRepair = JSON.parse(await ev(LABEL_READ))
await ev(`(() => { const i = document.getElementById('student-name'); i.focus(); i.value = '张三'; return true })()`)
result.form.clickRepair = await pressEnterOn('修复标签关联')
result.form.afterRepair = JSON.parse(await ev(LABEL_READ))
result.form.domSnippet = await ev(`(() => { const i = document.getElementById('student-name'); const l = i && i.labels[0]; return l ? l.outerHTML : null })()`)
result.form.detectAfter = await ev(`(() => { const t = document.body.innerText; const m = t.match(/[^\\n]*(没有发现问题|处问题|姓名)[^\\n]*/g) || []; return JSON.stringify(m.slice(0, 6)) })()`)

await nav('keyboard')
await pressTab()
const DEMO = ['查看详情', '保存选择', '返回上一步']
const walk = async (n) => {
  const hits = [], trail = []
  for (let i = 0; i < n; i += 1) {
    const cur = JSON.parse(await ev(OUTLINE_READ))
    trail.push(cur.label || cur.tag)
    if (DEMO.includes(cur.label)) hits.push(cur)
    if (hits.length === 3) break
    await pressTab()
  }
  return { hits, trail }
}
const brokenWalk = await walk(16)
result.keyboard.brokenRound = brokenWalk.hits
result.keyboard.brokenTrail = brokenWalk.trail.slice(0, 8)
result.form.clickFixFocus = await pressEnterOn('修复焦点指示')
const fixedWalk = await walk(20)
result.keyboard.fixedRound = fixedWalk.hits
result.keyboard.fixedTrail = fixedWalk.trail.slice(0, 8)

fs.writeFileSync(path.join(OUT, 'public-labels-focus.json'), JSON.stringify(result, null, 2))
console.log('FORM before', JSON.stringify(result.form.beforeRepair))
console.log('FORM click ', JSON.stringify(result.form.clickRepair))
console.log('FORM after ', JSON.stringify(result.form.afterRepair))
console.log('FORM dom   ', result.form.domSnippet)
console.log('FORM detect', result.form.detectAfter)
console.log('KB broken', JSON.stringify(result.keyboard.brokenRound.map((x) => x.outlineStyle + ' ' + x.outlineWidth + ' ' + x.outlineColor)))
console.log('KB btrail', JSON.stringify(result.keyboard.brokenTrail))
console.log('KB fixed  ', JSON.stringify(result.keyboard.fixedRound.map((x) => x.outlineStyle + ' ' + x.outlineWidth + ' ' + x.outlineColor + ' off=' + x.outlineOffset)))
console.log('KB ftrail ', JSON.stringify(result.keyboard.fixedTrail))
browser.kill()
process.exit(0)
