// backend/routes/tablegen.js
import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// 必需：你仓库里已存在
import { crawlProducts } from '../services/crawler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

/**
 * POST /v1/api/tablegen
 * body: { urls: string[], fields: string[], lang?: string, format?: 'excel'|'pdf'|'excel,pdf' }
 */
router.post('/tablegen', async (req, res) => {
  try {
    const { urls = [], fields = [], lang = 'zh', format = 'excel' } = req.body || {}

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: { message: 'urls 不能为空' } })
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: { message: 'fields 不能为空' } })
    }

    // 1) 抓取数据
    const products = []
    for (const u of urls) {
      const items = await crawlProducts(u)
      if (Array.isArray(items)) products.push(...items)
    }

    // 2) 尝试加载“可选模块”（不存在就跳过，不会报错）
    const translateMod = await import('../services/translate.js').catch(() => null)
    const excelMod     = await import('../services/excel.js').catch(() => null)
    const pdfMod       = await import('../services/pdf.js').catch(() => null)

    const translate = translateMod?.translate ?? (async (x) => x)
    const genExcel  = excelMod?.genExcel  ?? null
    const genPdf    = pdfMod?.genPdf      ?? null

    // 3) 翻译表头（若无 translate 模块，则原样返回）
    const translatedHeaders = await (async () => {
      if (!fields.length) return []
      try { return await translate(fields, lang) } catch { return fields }
    })()

    // 4) 生成仅包含所选字段的数据，并按需翻译 description
    const rows = await Promise.all(
      products.map(async (p) => {
        const row = {}
        for (const f of fields) {
          if (f === 'description') {
            try { row[f] = await translate(p[f] ?? '', lang) }
            catch { row[f] = p[f] ?? '' }
          } else {
            row[f] = p[f] ?? ''
          }
        }
        if (fields.includes('imageUrl')) row.imageUrl = p.imageUrl ?? ''
        return row
      })
    )

    // 5) 可选：生成 excel / pdf
    const wantExcel = format.includes('excel') && !!genExcel
    const wantPdf   = format.includes('pdf')   && !!genPdf

    const filesDir = path.join(__dirname, '..', 'files')
    if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true })

    const ts = Date.now()
    let excelUrl = null, pdfUrl = null, excelSize = null, pdfSize = null

    if (wantExcel) {
      const excelPath = path.join(filesDir, `tablegen_${ts}.xlsx`)
      await genExcel(excelPath, translatedHeaders, rows)
      excelUrl  = `${process.env.BASE_URL || ''}/files/${path.basename(excelPath)}`
      excelSize = `${(fs.statSync(excelPath).size / 1024).toFixed(1)} KB`
    }

    if (wantPdf) {
      const pdfPath = path.join(filesDir, `tablegen_${ts}.pdf`)
      await genPdf(pdfPath, translatedHeaders, rows)
      pdfUrl  = `${process.env.BASE_URL || ''}/files/${path.basename(pdfPath)}`
      pdfSize = `${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`
    }

    // 6) 返回
    return res.json({
      headers: translatedHeaders,
      count: rows.length,
      excel: excelUrl,
      excelSize,
      pdf: pdfUrl,
      pdfSize,
      note:
        (!excelMod || !pdfMod || !translateMod)
          ? '部分功能使用了可选模块：缺少的模块将被跳过（translate/excel/pdf）。'
          : undefined
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: { message: err?.message || 'server error' } })
  }
})

export default router
