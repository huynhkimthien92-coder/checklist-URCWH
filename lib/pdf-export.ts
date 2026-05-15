/**
 * PDF EXPORT FOR VERCEL - USING PUPPETEER
 * 
 * This implementation uses puppeteer-extra with stealth plugin
 * to render HTML to PDF on the server-side (serverless-compatible).
 * 
 * Installation:
 * npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
 * 
 * Usage: Same as before, no changes needed in the API route
 */
export const runtime = "nodejs";
import { Checklist, CheckItem } from '@/types'

import { readFileSync } from 'fs'
import { join } from 'path'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'THỨ HAI', tue: 'THỨ BA', wed: 'THỨ TƯ',
  thu: 'THỨ NĂM', fri: 'THỨ SÁU', sat: 'THỨ BẢY', sun: 'CHỦ NHẬT'
}

let browserInstance: any = null

async function getBrowser() {
  if (browserInstance) {
    return browserInstance
  }

  try {
    const puppeteer = (await import('puppeteer-core')).default
    const chromium = (await import('@sparticuz/chromium')).default

    browserInstance = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    return browserInstance
  } catch (error) {
    console.error('Failed to launch browser:', error)
    throw new Error('Browser initialization failed')
  }
}

function getLogoBase64(): string {
  try {
    const logoPath = join(process.cwd(), 'public', 'logo.png')
    const logoBuffer = readFileSync(logoPath)
    const base64 = logoBuffer.toString('base64')
    return `data:image/png;base64,${base64}`  // ← trả về full data URL
  } catch (e) {
    console.error('Logo load error:', e)
    return ''
  }
}
export async function generatePDFReport(checklists: Checklist[]): Promise<Buffer> {
  
  if (!checklists || checklists.length === 0) {
    throw new Error('No checklist data to export')
  }

  let browser
  let page

  try {
    // ✅ 1. GỘP DATA
    const mergedChecklist = mergeChecklists(checklists)
    // ✅ 2. parse items
    
    let items: CheckItem[] = mergedChecklist.items
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch {
        items = []
      }
    }

    if (!Array.isArray(items)) items = []
    
    // ✅ 3. tách nhóm
    const obsItems = items.filter(i => i.category === 'observation')
    const opItems = items.filter(i => i.category === 'operation')
    const allItems = [...obsItems, ...opItems]
    // ✅ 4. chữ ký
    const operatorSignatures = mergedChecklist.operator_signatures
    const supervisorSignatures = mergedChecklist.supervisor_signatures
    
    // Generate table 
    const tableRowsHtml = generateTableRows(allItems, obsItems.length)
    
    // ✅ 6. tạo HTML
    const htmlContent = createHtmlContent(
      mergedChecklist,
      tableRowsHtml,
      operatorSignatures,
      supervisorSignatures
    )    
    // Get or create browser instance
    browser = await getBrowser()
    page = await browser.newPage()

    // Set viewport
    await page.setViewport({ width: 1200, height: 800 })

    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '3mm',
        right: '3mm',
        bottom: '3mm',
        left: '3mm',
      },
      displayHeaderFooter: false,
    })

    console.log('PDF generated successfully')
    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    if (page) {
      await page.close().catch((err: unknown) => console.log('Page close error:', err))
    }
    // Note: Don't close browser here - keep it alive for reuse
  }
}

function createHtmlContent(checklist: Checklist, tableRowsHtml: string, operatorSignatures: any, supervisorSignatures: any): string {
  const logoBase64 = getLogoBase64()
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box;
    }
    
    html, body { 
      width: 100%; 
      height: 100%;
      background: white;
    }
    
    body { 
      font-family: 'Arial', sans-serif;
      font-size: 9px;
      color: #0f172a;
      transform: scale(0.8);
      transform-origin: top left;
    }
    
    .page {
      width: 297mm;
      min-height: 210mm;
      padding: 4mm;
      background: white;
      page-break-after: always;
      overflow: visible;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
      gap: 10px;
    }
    
    .logo-box {
      width: 55px;
      background: white;
      color: white;
      padding: 4px;
      border-radius: 3px;
      text-align: center;
      font-weight: bold;
      font-size: 8px;
      line-height: 1.2;
      flex-shrink: 0;
    }
    
    .title-section {
      flex: 1;
      text-align: center;
    }
    
    .title-section h1 {
      font-size: 15px;
      color: #1a3a6b;
      margin-bottom: 3px;
      font-weight: bold;
    }
    
    .title-section p {
      font-size: 11px;
      color: #334155;
      font-style: italic;
    }
    
    .meta-box {
      width: 110px;
      font-size: 8px;
    }
    
    .meta-row {
      display: flex;
      margin-bottom: 2px;
      align-items: center;
    }
    
    .meta-label {
      font-weight: bold;
      width: 60px;
    }
    
    .meta-value {
      flex: 1;
      border-bottom: 0.5px solid #94a3b8;
      padding-bottom: 1px;
    }
    
    .info-table {
      width: 100%;
      margin-bottom: 4px;
      border-collapse: collapse;
    }
    
    .info-table td {
      padding: 3px;
      border: 0.5px solid #94a3b8;
      font-size: 8px;
    }
    
    .info-label {
      font-weight: bold;
      background: #f5f5f5;
      width: auto;
    }
    
    .instructions {
      background: #f9f9f9;
      border-left: 2px solid #1a3a6b;
      padding: 2px 6px;
      margin-bottom: 4px;
      font-size: 8px;
      line-height: 1.3;
    }
    
    .instructions strong {
      color: #166534;
    }
    
    .instructions .fail {
      color: #991b1b;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
      font-size: 7px;
      page-break-inside: auto;
    }
    
    th {
      background: #1a3a6b;
      color: white;
      padding: 2px;
      font-weight: bold;
      border: 0.5px solid #94a3b8;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }

    th.day-header {
      background: #3a72c4;
      padding: 4px 2px;
      font-size: 7px;
    }
    
    td {
      border: 0.5px solid #94a3b8;
      padding: 1px 2px;
    }
    
    .group-obs {
      background: #1a3a6b;
      color: white;
      font-weight: bold;
      text-align: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      width: 20px;
      font-size: 7px;
    }
    
    .group-op {
      background: #0f5132;
    }
    
    .item-cell {
      text-align: left;
      background: white;
      padding: 2px;
    }
    
    .item-cell.alt {
      background: #f0f5ff;
    }
    
    .item-name {
      font-weight: bold;
      font-size: 8px;
      margin-bottom: 1px;
    }
    
    .item-desc {
      font-size: 7px;
      color: #334155;
    }
    
    .status-cell {
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      width: 18px;
    }
    
    .status-pass {
      background: #f0fdf4;
      color: #166534;
    }
    
    .status-fail {
      background: #fff1f2;
      color: #991b1b;
    }
    
    .detail-cell {
      font-size: 7px;
      text-align: left;
      width: 42px;
      word-break: break-word;
    }
    
    .signature-cell {
      text-align: center;
      background: #f8fafc;
      padding: 2px 1px;
    }
    
    .notes-section {
      background: #f8fafc;
      padding: 3px;
      margin-top: 4px;
      border: 0.5px solid #e2e8f0;
      font-size: 8px;
    }
    
    .notes-section strong {
      color: #1a3a6b;
    }
    
    .footer-text {
      font-size: 7px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
      border-top: 0.5px solid #e2e8f0;
      padding-top: 2px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header-container">
      <div class="logo-box" style="width:117px; padding:4px; background:white; flex-shrink:0;">
        ${logoBase64 
          ? `<img src="${logoBase64}" style="width:100%; height:auto; object-fit:contain;" />`
          : ''
        }
      </div>
      <div class="title-section">
        <h1>BIỂU MẪU KIỂM TRA AN TOÀN HÀNG NGÀY</h1>
        <p>Operators Safety daily Checklist</p>
      </div>
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Trang:</span>
          <span class="meta-value">1/1</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Ngày:</span>
          <span class="meta-value">20/09/2025</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Mã hiệu:</span>
          <span class="meta-value">WH-SOP01-FR01</span>
        </div>
      </div>
    </div>

    <!-- Info Table 1 -->
    <table class="info-table">
      <tr>
        <td class="info-label" style="width: 50px;">Model:</td>
        <td>${escapeHtml(checklist.forklift_model || '.......................................')}</td>
        <td class="info-label" style="width: 50px;">Số Seri:</td>
        <td>${escapeHtml(checklist.forklift_serial || '.......................................')}</td>
        <td class="info-label" style="width: 50px;">Tuần thứ:</td>
        <td>${checklist.week_number}/${checklist.year}</td>
        <td class="info-label" style="width: 40px;">Ca thứ:</td>
        <td>${escapeHtml(checklist.shift || '.....')}</td>
      </tr>
    </table>

    <!-- Info Table 2 -->
    <table class="info-table">
      <tr>
        <td class="info-label" style="width: 50px;">Xe số:</td>
        <td>${escapeHtml(checklist.forklift_number || '.......................')}</td>
        <td style="font-style: italic; font-size: 7px;">
          Ghi chú: Biên bản kiểm tra này cần được thực hiện bởi tài xế bắt đầu vào ca làm việc. 
          Các mục liệt kê chỉ áp dụng cho một số loại xe. Cần phải kiểm tra hết các mục được ghi bên dưới.
        </td>
      </tr>
    </table>

    <!-- Instructions -->
    <div class="instructions">
      <strong>✓ V</strong> = tốt, đạt | 
      <strong class="fail">✗ X</strong> = không đạt | 
      <strong>Cần sửa chữa hay căn chỉnh (Ghi chi tiết cụ thể)</strong>
    </div>

    <!-- Main Table -->
    <table>
      <thead>
        <tr>
          <th colspan="2">NỘI DUNG KIỂM TRA</th>
          ${DAYS.map(day => `<th colspan="2" class="day-header">${DAY_LABELS[day]}</th>`).join('')}
        </tr>
        <tr>
          <th style="width: 20px; font-size: 7px;">NHÓM</th>
          <th style="font-size: 8px;">CHI TIẾT</th>
          ${DAYS.map(() => '<th style="width: 18px; font-size: 7px;">T.T</th><th style="width: 42px; font-size: 7px;">Ghi chú</th>').join('')}
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        <tr>
          <td colspan="2" style="text-align: center; background: #1a3a6b; color: white; font-weight: bold;">
            Tài xế xe nâng / Forklift driver
          </td>
          
          ${DAYS.map(day => {
            const sig = operatorSignatures?.[day]?.data_url
            return `
              <td colspan="2" class="signature-cell">
                ${sig
                  ? `<img src="${sig}" style="height:28px; max-width:100%; object-fit:contain;" />`
                  : '_______'
                }
              </td>
            `
          }).join('')}


        </tr>
        <tr>
          <td colspan="2" style="text-align: center; background: #1a3a6b; color: white; font-weight: bold;">
            Giám sát / Supervisor
          </td>
          
          ${DAYS.map(day => {
            const sig = supervisorSignatures?.[day]?.data_url
            return `
              <td colspan="2" class="signature-cell">
                ${sig
                  ? `<img src="${sig}" style="height:35px; max-width:100%; object-fit:contain;" />`
                  : '_______'
                }
              </td>
          `
        }).join('')}

        </tr>
      </tbody>
    </table>

    <!-- Notes -->
    <div class="notes-section">
      <strong>Ghi chú (Các mục cần sửa chữa hay căn chỉnh):</strong> 
      ${escapeHtml(checklist.notes || '')}
    </div>

    <!-- Footer -->
    <div class="footer-text">
      <strong>Chú ý:</strong> Nếu xe nâng phát hiện cần phải sửa chữa hay không an toàn cần phải dừng xe, báo cáo cho người phụ trách ngay. 
      Không được vận hành xe nâng cho tới khi đã được sửa chữa và đảm bảo an toàn. 
      Nếu trong khi hoạt động mà xe có dấu hiệu không an toàn thì cần phải báo ngay với người phụ trách và không được vận hành cho tới khi xe được sửa chữa.
      Không được tự ý sửa chữa hay căn chỉnh xe nâng trừ khi bạn được cho phép.
    </div>
  </div>
</body>
</html>`
}

/**
 * Generate table rows HTML with proper styling and data
 */
function generateTableRows(items: CheckItem[], obsCount: number): string {
  let html = ''

  items.forEach((item, index) => {
    const isObservation = index < obsCount
    const isFirstInGroup = (isObservation && index === 0) || (!isObservation && index === obsCount)
    const groupRowSpan = isObservation ? obsCount : items.length - obsCount
    const bgColor = index % 2 === 0 ? 'white' : '#f0f5ff'

    html += `<tr style="background: ${bgColor};">`

    // Group column with rowspan
    if (isFirstInGroup) {
      const groupClass = !isObservation ? 'group-op' : ''
      const groupText = isObservation ? 'Q.S' : 'V.H'
      html += `<td rowspan="${groupRowSpan}" class="group-obs ${groupClass}">${groupText}</td>`
    }

    // Item description
    const label = item.sub_label || item.label_vi
    html += `
      <td class="item-cell ${bgColor !== 'white' ? 'alt' : ''}">
        <div class="item-name">${escapeHtml(label)}</div>
        <div class="item-desc">${escapeHtml(item.label_en)}</div>
      </td>
    `

    // 7 days × (status + detail)
    DAYS.forEach(day => {
      const entry = item.days?.[day] || { status: '', detail: '' }
      const statusBg = entry.status === 'pass' ? '#f0fdf4' : entry.status === 'fail' ? '#fff1f2' : bgColor
      const statusClass = entry.status === 'pass' ? 'status-pass' : entry.status === 'fail' ? 'status-fail' : ''

      html += `
        <td class="status-cell ${statusClass}" style="background: ${statusBg};">
          ${statusText(entry.status)}
        </td>
        <td class="detail-cell" style="background: ${statusBg};">
          ${escapeHtml(entry.detail || '')}
        </td>
      `
    })

    html += '</tr>'
  })

  return html
}

/**
 * Convert status to display text
 */
function statusText(status: string): string {
  if (status === 'pass') return '✓ V'
  if (status === 'fail') return '✗ X'
  return ''
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function mergeChecklists(checklists: Checklist[]): Checklist {
  const base = { ...checklists[0] }

  const mergedItems = base.items.map(item => ({
    ...item,
    days: {} as Partial<Record<typeof DAYS[number], any>>
  }))

  checklists.forEach(cl => {
    cl.items.forEach(item => {
      const target = mergedItems.find(i => i.id === item.id)
      if (!target) return

      Object.entries(item.days || {}).forEach(([day, value]) => {
        if (!DAYS.includes(day as any)) return
        const d = day as typeof DAYS[number]
        if (value && typeof value === 'object' && 'status' in value) {
          target.days[d] = value as any
        }
      })
    })
  })

  const operator_signatures: any = {}
  const supervisor_signatures: any = {}

  checklists.forEach(cl => {
    const op = typeof cl.operator_signatures === 'string'
      ? JSON.parse(cl.operator_signatures)
      : cl.operator_signatures

    const sup = typeof cl.supervisor_signatures === 'string'
      ? JSON.parse(cl.supervisor_signatures)
      : cl.supervisor_signatures

    Object.assign(operator_signatures, op)
    Object.assign(supervisor_signatures, sup)
  })

  return {
    ...base,
    items: mergedItems,
    operator_signatures,
    supervisor_signatures
  }
}

