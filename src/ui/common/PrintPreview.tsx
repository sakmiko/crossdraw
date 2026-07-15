import { useMemo } from 'react'
import { buildA4PrintSheet, printSheetHtml, type PrintPanel } from '@/io/printSheet'

export function PrintPreviewModal({
  open,
  onClose,
  panels,
  projectName,
  schemeName,
  onExportSvg,
  onExportHtml,
  paper,
  onPaperChange,
}: {
  open: boolean
  onClose: () => void
  panels: PrintPanel[]
  projectName: string
  schemeName: string
  onExportSvg: (svg: string) => void
  onExportHtml: (html: string) => void
  paper: 'A4' | 'A4-landscape'
  onPaperChange: (p: 'A4' | 'A4-landscape') => void
}) {
  const svg = useMemo(
    () =>
      buildA4PrintSheet(panels, {
        projectName,
        schemeName,
        paper,
      }),
    [panels, projectName, schemeName, paper],
  )

  if (!open) return null

  return (
    <div className="export-overlay print-overlay" role="dialog" aria-modal aria-label="打印拼版预览" onClick={onClose}>
      <div className="print-preview card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <h2 style={{ margin: 0 }}>打印拼版预览</h2>
            <p className="hint" style={{ margin: '4px 0 0' }}>
              A4 矢量拼版 · 最多 4 图 · 与当前方案数据同源
            </p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="toolbar" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <label>
            纸张
            <select value={paper} onChange={(e) => onPaperChange(e.target.value as 'A4' | 'A4-landscape')}>
              <option value="A4">A4 纵向</option>
              <option value="A4-landscape">A4 横向</option>
            </select>
          </label>
          <button type="button" className="primary" onClick={() => onExportSvg(svg)}>
            导出拼版 SVG
          </button>
          <button
            type="button"
            onClick={() => onExportHtml(printSheetHtml(svg, `${projectName}-print`))}
          >
            导出打印 HTML
          </button>
          <span className="hint">{panels.length} 个图块已入版</span>
        </div>
        <div className="print-stage">
          <div
            className="print-sheet-host"
            dangerouslySetInnerHTML={{ __html: svg.replace(/^<\?xml[^>]*>/, '') }}
          />
        </div>
      </div>
    </div>
  )
}
