// D3：统计本次构建产物的体积（原始 / gzip）与 index.html 引用的资源哈希。
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const dist = path.resolve('dist')
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))

const rows = []
let total = 0
let gzTotal = 0
for (const f of walk(dist)) {
  const b = fs.readFileSync(f)
  const g = zlib.gzipSync(b, { level: 9 }).length
  total += b.length
  gzTotal += g
  rows.push({ file: path.relative(dist, f).split(path.sep).join('/'), bytes: b.length, gzip: g })
}
rows.sort((a, b) => b.bytes - a.bytes)
for (const r of rows) console.log(String(r.bytes).padStart(9), String(r.gzip).padStart(8), r.file)
console.log('TOTAL', rows.length, 'files', total, 'bytes', 'gzip', gzTotal)

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
console.log('assets:', [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]))
console.log('title:', /<title>([\s\S]*?)<\/title>/.exec(html)[1])
console.log('lang:', /<html[^>]*lang="([^"]*)"/.exec(html)?.[1])
console.log('description:', /<meta name="description" content="([^"]*)"/.exec(html)?.[1])
