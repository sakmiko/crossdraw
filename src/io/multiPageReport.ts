/**
 * Multi-page engineering report (HTML → browser Print / Save as PDF).
 * Page 1 cover+KPI, page 2 channel notes, page 3 signal, page 4 analysis, page 5 band.
 */
import type { AnalysisResult, BandCorridor, BandResult, ChannelizationScheme, FlowScheme, Project, SignalScheme } from '@/domain/types'
import { buildSignalTimingAlignment } from '@/domain/signal/timingAlign'
import { checkAnalysisIntegrity } from '@/domain/analysis/integrity'
import { measureCorridor } from '@/domain/analysis/corridor'
import { sumMultimodal } from '@/domain/flow/multimodal'

export type ReportContext = {
  project: Project
  channel: ChannelizationScheme
  flow: FlowScheme
  signal: SignalScheme
  analysis: AnalysisResult
  bandCorridor: BandCorridor
  band?: BandResult
  generatedAt?: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function page(title: string, body: string, pageNo: number, total: number): string {
  return `
<section class="page">
  <header class="page-head">
    <div class="brand">Crossdraw · 交叉口工程报告</div>
    <div class="ptitle">${esc(title)}</div>
    <div class="pmeta">第 ${pageNo} / ${total} 页</div>
  </header>
  <div class="page-body">${body}</div>
  <footer class="page-foot">数据与编辑器同源 · 比例示意非测绘出图 · GPLv3</footer>
</section>`
}

export function buildMultiPageReportHtml(ctx: ReportContext): string {
  const when = ctx.generatedAt ?? new Date().toISOString().slice(0, 19).replace('T', ' ')
  const al = buildSignalTimingAlignment(ctx.signal)
  const integ = checkAnalysisIntegrity(ctx.analysis)
  const band = ctx.band ?? measureCorridor(ctx.bandCorridor)
  const mm = sumMultimodal(ctx.flow, ctx.channel.approaches)
  const total = 5

  const p1 = page(
    '封面与总览',
    `
    <h1>${esc(ctx.project.name)}</h1>
    <p class="sub">渠化：${esc(ctx.channel.name)} · 流量：${esc(ctx.flow.name)} · 信号：${esc(ctx.signal.name)}</p>
    <p class="sub">生成：${esc(when)}</p>
    <div class="kpi-grid">
      <div class="kpi"><div class="k">周期 C</div><div class="v">${ctx.signal.cycleSec} s</div><div class="s">${al.closed ? '配时闭合 ✓' : '配时未闭合'}</div></div>
      <div class="kpi"><div class="k">平均 v/c</div><div class="v">${ctx.analysis.avgVc.toFixed(3)}</div></div>
      <div class="kpi"><div class="k">车均延误</div><div class="v">${ctx.analysis.avgDelay.toFixed(1)} s</div></div>
      <div class="kpi"><div class="k">LOS</div><div class="v">${esc(ctx.analysis.losFinal)}</div><div class="s">${integ.ok ? '分析同源 ✓' : '同源异常'}</div></div>
      <div class="kpi"><div class="k">绿波带宽比</div><div class="v">${(band.bandwidthRatio * 100).toFixed(1)}%</div></div>
      <div class="kpi"><div class="k">行人/非机</div><div class="v">${mm.ped}/${mm.bike}</div><div class="s">peds/h · bike/h</div></div>
    </div>
    <p class="note">本报告由 Crossdraw 自动拼装，可在浏览器中打印或「另存为 PDF」。</p>
    `,
    1,
    total,
  )

  const apRows = ctx.channel.approaches
    .map((a) => {
      const entry = a.entryLanes.map((l) => l.widthM.toFixed(2)).join('/')
      return `<tr><td>${esc(a.name)}</td><td>${a.bearingDeg}°</td><td>${a.entryLanes.length}</td><td>${a.exitLanes.length}</td><td>${entry}</td><td>${a.median.widthM.toFixed(1)}</td><td>${a.sidewalkWidthM.toFixed(1)}</td><td>${a.bikeEnabled ? a.bikeWidthM.toFixed(1) : '—'}</td><td>${a.auxRoad?.enabled ? (a.auxRoad.widthM?.toFixed(1) ?? '开') : '—'}</td></tr>`
    })
    .join('')

  const p2 = page(
    '渠化与断面参数',
    `
    <table>
      <thead><tr><th>进口</th><th>方位</th><th>进口道</th><th>出口道</th><th>进口宽串</th><th>中分</th><th>人行</th><th>非机</th><th>辅路</th></tr></thead>
      <tbody>${apRows}</tbody>
    </table>
    <p class="note">展宽/右转渠化/安全岛参数写入 .rtp，图面与表同源。</p>
    `,
    2,
    total,
  )

  const phRows = ctx.signal.phases
    .map((ph) => {
      const rel = Object.entries(ph.releases)
        .map(([id, movs]) => {
          const n = ctx.channel.approaches.find((a) => a.id === id)?.name ?? id
          return `${n}:${(movs as string[]).join('')}`
        })
        .join('；')
      const ped = (ph.pedestrian ?? []).map((p) => {
        const n = ctx.channel.approaches.find((a) => a.id === p.approachId)?.name ?? p.approachId
        return `${n}${p.exclusive ? '(独)' : ''}`
      }).join(',')
      return `<tr><td>${esc(ph.name)}</td><td>${ph.kind ?? 'mixed'}</td><td>${ph.greenSec}</td><td>${ph.yellowSec}</td><td>${ph.allRedSec}</td><td>${esc(rel || '—')}</td><td>${esc(ped || '—')}</td></tr>`
    })
    .join('')

  const p3 = page(
    '信号配时与行人',
    `
    <p>周期 <strong>${ctx.signal.cycleSec}</strong> s · 相位和 ${al.mainSumSec.toFixed(1)} s · ${al.closed ? '闭合' : '未闭合'}</p>
    <table>
      <thead><tr><th>相位</th><th>类型</th><th>G</th><th>Y</th><th>AR</th><th>放行</th><th>行人</th></tr></thead>
      <tbody>${phRows}</tbody>
    </table>
    `,
    3,
    total,
  )

  const laneRows = ctx.analysis.lanes
    .slice(0, 24)
    .map(
      (l) =>
        `<tr><td>${esc(l.approachName)}</td><td>${l.movement}</td><td>${l.volumePeak.toFixed(0)}</td><td>${l.vc.toFixed(2)}</td><td>${l.delaySec.toFixed(1)}</td><td>${l.queueM.toFixed(1)}</td></tr>`,
    )
    .join('')

  const p4 = page(
    '运行评价',
    `
    <p>平均 v/c ${ctx.analysis.avgVc.toFixed(3)} · 延误 ${ctx.analysis.avgDelay.toFixed(1)} s · 排队 ${ctx.analysis.avgQueueM.toFixed(1)} m · LOS <strong>${esc(ctx.analysis.losFinal)}</strong></p>
    <table>
      <thead><tr><th>进口</th><th>转向</th><th>高峰量</th><th>v/c</th><th>延误s</th><th>排队m</th></tr></thead>
      <tbody>${laneRows}</tbody>
    </table>
    `,
    4,
    total,
  )

  const nodeRows = ctx.bandCorridor.nodes
    .map(
      (n) =>
        `<tr><td>${esc(n.name)}</td><td>${n.distanceM.toFixed(0)}</td><td>${n.greenRatio.toFixed(2)}</td><td>${n.cycleSec}</td><td>${n.offsetSec.toFixed(1)}</td><td>${n.lockedOffset ? '锁' : '—'}</td></tr>`,
    )
    .join('')

  const p5 = page(
    '干道绿波',
    `
    <p>走廊 <strong>${esc(ctx.bandCorridor.name)}</strong> · 方法 ${esc(String(band.method))} · 速度 ${ctx.bandCorridor.speedKmh} km/h</p>
    <p>上行 b=${(band.forwardBandwidthSec ?? band.bandwidthSec).toFixed(1)} s · 下行 b=${(band.backwardBandwidthSec ?? 0).toFixed(1)} s · 带宽比 ${(band.bandwidthRatio * 100).toFixed(1)}%</p>
    <table>
      <thead><tr><th>路口</th><th>桩号m</th><th>λ</th><th>C</th><th>o(s)</th><th>锁</th></tr></thead>
      <tbody>${nodeRows}</tbody>
    </table>
    `,
    5,
    total,
  )

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<title>${esc(ctx.project.name)} — 工程报告</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif; color: #0f172a; background: #e2e8f0; }
  .page { background: #fff; width: 210mm; min-height: 297mm; margin: 12px auto; padding: 14mm 14mm 16mm; box-shadow: 0 4px 24px rgba(0,0,0,.1); page-break-after: always; position: relative; }
  .page-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; gap: 8px; }
  .brand { font-size: 11px; color: #64748b; font-weight: 600; }
  .ptitle { font-size: 16px; font-weight: 700; flex: 1; text-align: center; }
  .pmeta { font-size: 11px; color: #64748b; }
  .page-foot { position: absolute; left: 14mm; right: 14mm; bottom: 10mm; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; }
  h1 { font-size: 22px; margin: 8px 0; }
  .sub { color: #475569; font-size: 12px; margin: 4px 0; }
  .note { color: #64748b; font-size: 11px; margin-top: 12px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
  .kpi .k { font-size: 11px; color: #64748b; }
  .kpi .v { font-size: 20px; font-weight: 700; margin-top: 4px; }
  .kpi .s { font-size: 10px; color: #059669; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; width: auto; min-height: auto; page-break-after: always; }
  }
</style>
</head>
<body>
${p1}${p2}${p3}${p4}${p5}
</body>
</html>`
}
