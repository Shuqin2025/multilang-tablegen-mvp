// backend/routes/tablegen.js
import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// 你已有的服务函数（确保这些文件存在）
import { crawlProducts } from '../services/crawler.js'
import { translate } from '../services/translate.js'
import { genExcel } from '../services/excel.js'
import { genPdf } from '../services/pdf.js'

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

    // 抓取数据
    const products = []
    for (const u of urls) {
      const items = await crawlProducts(u)
      if (Array.isArray(items)) products.push(...items)
    }

    // 翻译表头
    const translatedHeaders = await translate(fields, lang)

    // 生成仅包含所选字段的数据 & 按需翻译描述
    const translatedProducts = await Promise.all(
      products.map(async (p) => {
        const row = {}
        for (const f of fields) {
          if (f === 'description') {
            row[f] = await translate(p[f] ?? '', lang)
          } else {
            row[f] = p[f] ?? ''
          }
        }
        // 如果需要图片链接，保证保留
        if (fields.includes('imageUrl')) row.imageUrl = p.imageUrl ?? ''
        return row
      })
    )

    // 输出目录
    const filesDir = path.join(__dirname, '..', 'files')
    if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir)

    // 生成文件
    const ts = Date.now()
    const wantExcel = format.includes('excel')
    const wantPdf = format.includes('pdf')

    let excelUrl = null, pdfUrl = null, excelSize = null, pdfSize = null

    if (wantExcel) {
      const excelPath = path.join(filesDir, `tablegen_${ts}.xlsx`)
      await genExcel(excelPath, translatedHeaders, translatedProducts)
      excelUrl = `${process.env.BASE_URL || ''}/files/${path.basename(excelPath)}`
      excelSize = `${(fs.statSync(excelPath).size / 1024).toFixed(1)} KB`
    }

    if (wantPdf) {
      const pdfPath = path.join(filesDir, `tablegen_${ts}.pdf`)
      await genPdf(pdfPath, translatedHeaders, translatedProducts)
      pdfUrl = `${process.env.BASE_URL || ''}/files/${path.basename(pdfPath)}`
      pdfSize = `${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`
    }

    return res.json({ excel: excelUrl, excelSize, pdf: pdfUrl, pdfSize })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: { message: err?.message || 'server error' } })
  }
})

export default router
