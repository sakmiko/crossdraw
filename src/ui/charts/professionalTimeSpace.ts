/**
 * High-resolution textbook-style time–space diagram for arterial green-band.
 * Distance on X (m), cycle time on Y (s). Same model as InteractiveTimeSpace.
 * Refs: 《交通管理与控制》干道协调时距图; Little MAXBAND bandwidth (engineering ribbon).
 */
import type { BandCorridor, BandResult } from '@/domain/types'
import { fmtNum, timeTicks as engTimeTicks } from './chartStandards'

const METHOD_LABEL: Record<string, string> = {
  classic: '经典数解（双向）',
  'optimized-scan': '优化扫描（MAXBAND 启发）',
  'one-way': '单向协调',
  'two-way-equal': '双向等带宽',
  graphical: '图解法（半周期）',
  'maxband-discrete': 'MAXBAND 离散搜索',
}

function wrap(t: number, C: number): number {
  return ((t % C) + C) % C
}

function greenSegments(start: number, len: number, C: number): [number, number][] {
  if (len <= 0) return []
  if (len >= C) return [[0, C]]
  const s = wrap(start, C)
  if (s + len <= C) return [[s, s + len]]
  return [
    [s, C],
    [0, s + len - C],
  ]
}

function distanceTicks(maxD: number): number[] {
  if (maxD <= 0) return [0]
  const raw = maxD / 6
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const n = raw / pow
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
  const ticks: number[] = []
  for (let d = 0; d <= maxD + 1e-6; d += step) ticks.push(Math.round(d * 10) / 10)
  if (ticks[ticks.length - 1] !== maxD) ticks.push(maxD)
  return ticks
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export type TimeSpaceModel = ReturnType<typeof buildTimeSpaceModel>

export function buildTimeSpaceModel(corridor: BandCorridor, result?: BandResult | null) {
  const nodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)
  const C = nodes[0]?.cycleSec || 90
  const v = (corridor.speedKmh * 1000) / 3600
  const maxD = Math.max(...nodes.map((n) => n.distanceM), 1)
  const enriched = nodes.map((n) => ({
    ...n,
    cycleSec: n.cycleSec || C,
    greenSec: Math.max(0, n.greenRatio * (n.cycleSec || C)),
  }))
  const segments: {
    fromName: string
    toName: string
    fromD: number
    toD: number
    lengthM: number
    travelSec: number
  }[] = []
  for (let i = 1; i < enriched.length; i++) {
    const lengthM = enriched[i].distanceM - enriched[i - 1].distanceM
    segments.push({
      fromName: enriched[i - 1].name,
      toName: enriched[i].name,
      fromD: enriched[i - 1].distanceM,
      toD: enriched[i].distanceM,
      lengthM,
      travelSec: lengthM / Math.max(0.1, v),
    })
  }

  const fwdPath: { d: number; t: number }[] = []
  let t = wrap(enriched[0]?.offsetSec ?? 0, C)
  for (let i = 0; i < enriched.length; i++) {
    if (i > 0) {
      const travel = (enriched[i].distanceM - enriched[i - 1].distanceM) / Math.max(0.1, v)
      t = wrap(t + travel, C)
    }
    fwdPath.push({ d: enriched[i].distanceM, t })
  }
  const bwdPath: { d: number; t: number }[] = []
  t = wrap(enriched[enriched.length - 1]?.offsetSec ?? 0, C)
  for (let i = enriched.length - 1; i >= 0; i--) {
    if (i < enriched.length - 1) {
      const travel = (enriched[i + 1].distanceM - enriched[i].distanceM) / Math.max(0.1, v)
      t = wrap(t + travel, C)
    }
    bwdPath.push({ d: enriched[i].distanceM, t })
  }

  const forwardSec = result?.forwardBandwidthSec ?? result?.bandwidthSec ?? 0
  const backwardSec = result?.backwardBandwidthSec ?? 0
  const halfFwd = Math.max(0, forwardSec / 2)
  const halfBwd = Math.max(0, backwardSec / 2)

  function ribbonPts(path: { d: number; t: number }[], half: number): { d: number; t: number }[] | null {
    if (path.length < 2 || half <= 0) return null
    const top = path.map((p) => ({ d: p.d, t: p.t - half }))
    const bot = path
      .slice()
      .reverse()
      .map((p) => ({ d: p.d, t: p.t + half }))
    return [...top, ...bot]
  }

  return {
    nodes: enriched,
    segments,
    maxD,
    C,
    vMps: v,
    speedKmh: corridor.speedKmh,
    method: corridor.method,
    methodLabel: METHOD_LABEL[corridor.method] ?? corridor.method,
    fwdPath,
    bwdPath,
    fwdRibbonPts: ribbonPts(fwdPath, halfFwd),
    bwdRibbonPts: ribbonPts(bwdPath, halfBwd),
    ratio: result?.bandwidthRatio ?? 0,
    bandSec: result?.bandwidthSec ?? 0,
    forwardSec,
    backwardSec,
    halfA: result?.halfCycleDistanceM ?? (v * C) / 2,
    stdV: result?.standardSpeedKmh ?? corridor.speedKmh,
  }
}

export function professionalTimeSpaceSvg(
  corridor: BandCorridor,
  result?: BandResult | null,
  opts: { width?: number; height?: number; theme?: 'dark' | 'light' } = {},
): string {
  const model = buildTimeSpaceModel(corridor, result)
  const W = opts.width ?? 1280
  const H = opts.height ?? 720
  const dark = opts.theme === 'dark'
  const pad = { t: 64, r: 36, b: 72, l: 72 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const bg = dark ? '#0b1018' : '#fafafa'
  const panel = dark ? '#111827' : '#ffffff'
  const grid = dark ? '#1e293b' : '#e2e8f0'
  const axis = dark ? '#94a3b8' : '#475569'
  const text = dark ? '#e2e8f0' : '#0f172a'
  const green = dark ? '#22c55e' : '#16a34a'
  const fwd = dark ? '#38bdf8' : '#0284c7'
  const bwd = dark ? '#f472b6' : '#db2777'

  if (model.nodes.length < 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" text-anchor="middle" fill="${axis}">至少 2 个路口</text></svg>`
  }

  const xOf = (d: number) => pad.l + (d / model.maxD) * innerW
  const yOf = (tt: number) => pad.t + (1 - tt / model.C) * innerH

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="${bg}"/>`
  g += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="12" fill="${panel}" stroke="${grid}"/>`
  g += `<text x="28" y="36" fill="${text}" font-size="16" font-weight="700" font-family="system-ui,sans-serif">干道绿波时距图 · ${escapeXml(corridor.name)}</text>`
  g += `<text x="28" y="54" fill="${axis}" font-size="11" font-family="system-ui,sans-serif">${escapeXml(model.methodLabel)} · V=${fmtNum(model.speedKmh, 'flow')} km/h · C=${fmtNum(model.C, 'int')} s · b↑=${fmtNum(model.forwardSec, 'sec')}s · b↓=${fmtNum(model.backwardSec, 'sec')}s · 带宽比 ${(model.ratio * 100).toFixed(1)}%</text>`
  g += `<text x="${W - 28}" y="36" text-anchor="end" fill="${axis}" font-size="10">${W}×${H} · 矢量导出</text>`

  // grid + time axis
  for (const tt of engTimeTicks(model.C)) {
    const y = yOf(tt)
    g += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="${grid}" stroke-width="1"/>`
    g += `<text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" fill="${axis}" font-size="11">${fmtNum(tt, 'int')}</text>`
  }
  g += `<text x="22" y="${pad.t + innerH / 2}" text-anchor="middle" fill="${axis}" font-size="11" transform="rotate(-90 22 ${pad.t + innerH / 2})">周期时间 t (s)</text>`

  // distance ticks
  for (const d of distanceTicks(model.maxD)) {
    const x = xOf(d)
    g += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + innerH}" stroke="${grid}" stroke-dasharray="3 4" opacity="0.7"/>`
    g += `<text x="${x}" y="${H - pad.b + 28}" text-anchor="middle" fill="${axis}" font-size="10">${fmtNum(d, 'int')}</text>`
  }
  g += `<text x="${pad.l + innerW / 2}" y="${H - 16}" text-anchor="middle" fill="${axis}" font-size="11">距离 / 桩号 d (m)</text>`

  // ribbons
  if (model.fwdRibbonPts) {
    const pts = model.fwdRibbonPts.map((p) => `${xOf(p.d).toFixed(1)},${yOf(wrap(p.t, model.C)).toFixed(1)}`).join(' ')
    g += `<polygon points="${pts}" fill="${fwd}" opacity="0.14"/>`
  }
  if (model.bwdRibbonPts && corridor.method !== 'one-way') {
    const pts = model.bwdRibbonPts.map((p) => `${xOf(p.d).toFixed(1)},${yOf(wrap(p.t, model.C)).toFixed(1)}`).join(' ')
    g += `<polygon points="${pts}" fill="${bwd}" opacity="0.12"/>`
  }

  // node greens
  for (const n of model.nodes) {
    const x = xOf(n.distanceM)
    g += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${pad.t + innerH}" stroke="${grid}" stroke-width="1.2"/>`
    const g0 = wrap(n.offsetSec, model.C)
    for (const seg of greenSegments(g0, n.greenSec, model.C)) {
      const y0 = yOf(seg[0])
      const y1 = yOf(seg[1])
      const top = Math.min(y0, y1)
      const h = Math.max(4, Math.abs(y0 - y1))
      g += `<rect x="${x - 14}" y="${top}" width="28" height="${h}" fill="${green}" opacity="0.92" rx="3"/>`
    }
    g += `<circle cx="${x}" cy="${pad.t - 10}" r="5" fill="${fwd}" stroke="${panel}" stroke-width="2"/>`
    g += `<text x="${x}" y="${H - pad.b + 44}" text-anchor="middle" fill="${text}" font-size="12" font-weight="700">${escapeXml(n.name)}</text>`
    g += `<text x="${x}" y="${H - pad.b + 58}" text-anchor="middle" fill="${axis}" font-size="10">d=${fmtNum(n.distanceM, 'int')}m · λ=${n.greenRatio.toFixed(2)} · o=${fmtNum(n.offsetSec, 'sec')}s${n.lockedOffset ? ' 锁' : ''}</text>`
  }

  // trajectories
  const fwdPts = model.fwdPath.map((p) => `${xOf(p.d).toFixed(1)},${yOf(p.t).toFixed(1)}`).join(' ')
  g += `<polyline fill="none" stroke="${fwd}" stroke-width="3" stroke-linejoin="round" points="${fwdPts}"/>`
  if (corridor.method !== 'one-way') {
    const bwdPts = model.bwdPath.map((p) => `${xOf(p.d).toFixed(1)},${yOf(p.t).toFixed(1)}`).join(' ')
    g += `<polyline fill="none" stroke="${bwd}" stroke-width="2.6" stroke-dasharray="8 4" stroke-linejoin="round" points="${bwdPts}"/>`
  }

  // segment travel labels
  for (const s of model.segments) {
    const mx = (xOf(s.fromD) + xOf(s.toD)) / 2
    g += `<text x="${mx}" y="${pad.t + 18}" text-anchor="middle" fill="${axis}" font-size="10">L=${fmtNum(s.lengthM, 'int')}m · t=${fmtNum(s.travelSec, 'sec')}s</text>`
  }

  // legend box
  const lx = W - pad.r - 200
  const ly = pad.t + 8
  g += `<rect x="${lx}" y="${ly}" width="188" height="78" rx="8" fill="${panel}" stroke="${grid}"/>`
  g += `<rect x="${lx + 10}" y="${ly + 12}" width="18" height="10" rx="2" fill="${green}"/><text x="${lx + 36}" y="${ly + 21}" fill="${text}" font-size="11">绿灯窗口</text>`
  g += `<line x1="${lx + 10}" y1="${ly + 36}" x2="${lx + 28}" y2="${ly + 36}" stroke="${fwd}" stroke-width="3"/><text x="${lx + 36}" y="${ly + 40}" fill="${text}" font-size="11">上行轨迹 · b↑</text>`
  g += `<line x1="${lx + 10}" y1="${ly + 54}" x2="${lx + 28}" y2="${ly + 54}" stroke="${bwd}" stroke-width="2.5" stroke-dasharray="6 3"/><text x="${lx + 36}" y="${ly + 58}" fill="${text}" font-size="11">下行轨迹 · b↓</text>`
  g += `<text x="${lx + 10}" y="${ly + 72}" fill="${axis}" font-size="9">色带=半带宽示意</text>`

  g += `<text x="28" y="${H - 28}" fill="${fwd}" font-size="12" font-weight="700">上行 b↑=${fmtNum(model.forwardSec, 'sec')}s · 带宽比 ${(model.ratio * 100).toFixed(1)}%</text>`
  g += `<text x="28" y="${H - 12}" fill="${bwd}" font-size="12" font-weight="700">下行 b↓=${fmtNum(model.backwardSec, 'sec')}s · 带速 ${fmtNum(model.stdV, 'flow')} km/h · a=${fmtNum(model.halfA, 'int')} m</text>`
  g += `<text x="${W - 28}" y="${H - 12}" text-anchor="end" fill="${axis}" font-size="9">与 measureCorridor / scoreOffsets 同源 · 教材时距图风格 · 非 GIS</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function timeSpaceReportMarkdown(
  projectName: string,
  corridor: BandCorridor,
  result?: BandResult | null,
): string {
  const m = buildTimeSpaceModel(corridor, result)
  return [
    `# ${projectName} · 绿波时距图简报 · ${corridor.name}`,
    '',
    `- 方法：${m.methodLabel}`,
    `- 设计速度 V=${m.speedKmh} km/h · 公共周期 C=${m.C} s · 半周期距离 a≈${m.halfA.toFixed(0)} m`,
    `- 上行带宽 b↑=${m.forwardSec.toFixed(1)} s · 下行 b↓=${m.backwardSec.toFixed(1)} s · 带宽比 ${(m.ratio * 100).toFixed(1)}% · 带速 ${m.stdV.toFixed(1)} km/h`,
    `- 依据：干道协调时距图（教材）；带宽为圆环弧/离散搜索工程近似（非商业 MAXBAND-MIP）`,
    '',
    '## 路口',
    '',
    '| # | 名称 | 桩号 m | λ | C s | 相位差 o s | 锁 |',
    '|--:|------|-------:|---:|----:|----------:|:--:|',
    ...m.nodes.map(
      (n, i) =>
        `| ${i + 1} | ${n.name} | ${n.distanceM.toFixed(0)} | ${n.greenRatio.toFixed(3)} | ${n.cycleSec} | ${n.offsetSec.toFixed(1)} | ${n.lockedOffset ? 'Y' : ''} |`,
    ),
    '',
    '## 路段',
    '',
    '| 自 | 至 | 长度 m | 行程时间 s |',
    '|----|----|-------:|----------:|',
    ...m.segments.map(
      (s) => `| ${s.fromName} | ${s.toName} | ${s.lengthM.toFixed(0)} | ${s.travelSec.toFixed(1)} |`,
    ),
  ].join('\n')
}

export function timeSpaceReportCsv(corridor: BandCorridor, result?: BandResult | null): string {
  const m = buildTimeSpaceModel(corridor, result)
  const head = 'index,name,distanceM,greenRatio,cycleSec,offsetSec,locked'
  const rows = m.nodes.map(
    (n, i) =>
      `${i + 1},${JSON.stringify(n.name)},${n.distanceM},${n.greenRatio},${n.cycleSec},${n.offsetSec},${n.lockedOffset ? 1 : 0}`,
  )
  const meta = [
    `# method=${m.method} V=${m.speedKmh} C=${m.C}`,
    `# bUp=${m.forwardSec} bDown=${m.backwardSec} ratio=${m.ratio} a=${m.halfA}`,
  ]
  const segHead = 'from,to,lengthM,travelSec'
  const segs = m.segments.map(
    (s) => `${JSON.stringify(s.fromName)},${JSON.stringify(s.toName)},${s.lengthM},${s.travelSec}`,
  )
  return [...meta, head, ...rows, '', segHead, ...segs].join('\n')
}
