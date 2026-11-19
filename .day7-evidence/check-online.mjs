// D3 只读核对：线上站点当前发布的是哪一版构建，资源是否可取、体积多少。不写任何数据。
import https from 'node:https'
import crypto from 'node:crypto'

const HOST = 'accessibility-lab-3g6uvbn5duq.qoder.zone'

function get(path) {
  return new Promise((resolve, reject) => {
    https.get({ host: HOST, path, headers: { 'User-Agent': 'day7-readonly-check', 'Accept-Encoding': 'gzip, deflate, br' } }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    }).on('error', reject)
  })
}

const html = await get('/')
console.log('status', html.status, 'cache-control', html.headers['cache-control'], 'content-type', html.headers['content-type'])
const text = html.body.toString('utf8')
console.log('index.html bytes', html.body.length, 'sha256', crypto.createHash('sha256').update(html.body).digest('hex'))
const assets = [...text.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
console.log('title', /<title>([\s\S]*?)<\/title>/.exec(text)?.[1])
console.log('assets', assets)
for (const a of assets) {
  const r = await get(a)
  console.log(' ', a, 'status', r.status, 'bytes', r.body.length, 'sha256', crypto.createHash('sha256').update(r.body).digest('hex').slice(0, 16), 'gzip', r.headers['content-encoding'] || 'none')
}
const favicon = await get('/favicon.svg')
console.log('/favicon.svg', favicon.status, favicon.body.length)
const missing = await get('/definitely-not-here.js')
console.log('404 行为', missing.status, missing.body.length, 'bytes (是否回退到 index.html:', missing.body.includes('<div id="root">'), ')')
