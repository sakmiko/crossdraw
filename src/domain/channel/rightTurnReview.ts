/**
 * Right-turn channelization review board — params table + checklist.
 * Homology: approach.rightTurn / safetyIsland only. Schematic, not full CAD QC.
 */
import type { Approach, ChannelizationScheme } from '@/domain/types'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export type RightTurnRow = {
  approachId: string
  approachName: string
  enabled: boolean
  style: string
  widthM: number
  radiusM: number
  channelWidthM: number
  islandOffsetM: number
  islandEnabled: boolean
  islandRadiusM: number
  islandSetbackM: number
  showYield: boolean
  notes: string[]
}

export function collectRightTurnRows(channel: ChannelizationScheme): RightTurnRow[] {
  return channel.approaches.map((a) => {
    const rt = a.rightTurn
    const si = rt.safetyIsland
    const notes: string[] = []
    if (rt.enabled && rt.radiusM < 8) notes.push('R偏小')
    if (rt.enabled && rt.channelWidthM < 3.25) notes.push('道宽偏窄')
    if (rt.enabled && si.enabled && si.radiusM < 1.5) notes.push('岛半径偏小')
    if (rt.enabled && !si.enabled) notes.push('无安全岛')
    if (!rt.enabled) notes.push('未启用')
    return {
      approachId: a.id,
      approachName: a.name,
      enabled: rt.enabled,
      style: rt.style,
      widthM: rt.widthM,
      radiusM: rt.radiusM,
      channelWidthM: rt.channelWidthM ?? rt.widthM,
      islandOffsetM: rt.islandOffsetM ?? 0,
      islandEnabled: !!si?.enabled,
      islandRadiusM: si?.radiusM ?? 0,
      islandSetbackM: si?.setbackM ?? 0,
      showYield: !!si?.showYield,
      notes,
    }
  })
}

export function professionalRightTurnBoardSvg(
  channel: ChannelizationScheme,
  opts: { width?: number; projectName?: string } = {},
): string {
  const rows = collectRightTurnRows(channel)
  const W = opts.width ?? 920
  const headH = 56
  const rowH = 30
  const H = headH + 40 + Math.max(1, rows.length) * rowH + 44
  const xs = [28, 110, 160, 230, 290, 360, 430, 510, 590, 670]

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="36" fill="#0f172a" font-size="15" font-weight="700" font-family="system-ui,sans-serif">右转渠化 / 安全岛审查</text>`
  g += `<text x="28" y="52" fill="#64748b" font-size="11">${esc(opts.projectName ?? '')} · ${esc(channel.name)} · 与 rightTurn 同源</text>`

  const enabledN = rows.filter((r) => r.enabled).length
  const islandN = rows.filter((r) => r.islandEnabled).length
  g += `<text x="${W - 28}" y="36" text-anchor="end" fill="#0369a1" font-size="12" font-weight="700">启用 ${enabledN}/${rows.length} · 安全岛 ${islandN}</text>`

  const heads = ['进口', '启用', '样式', 'R(m)', '道宽', '岛偏', '安全岛', '岛R', '退距', '备注']
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${headH + 24}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  g += `<line x1="24" y1="${headH + 30}" x2="${W - 24}" y2="${headH + 30}" stroke="#e2e8f0"/>`

  rows.forEach((r, i) => {
    const y = headH + 52 + i * rowH
    const bg = i % 2 === 0 ? '#f8fafc' : '#fff'
    g += `<rect x="16" y="${y - 16}" width="${W - 32}" height="${rowH}" fill="${bg}"/>`
    const vals = [
      r.approachName.replace('进口', ''),
      r.enabled ? '是' : '否',
      r.style,
      r.radiusM.toFixed(1),
      r.channelWidthM.toFixed(2),
      r.islandOffsetM.toFixed(1),
      r.islandEnabled ? '是' : '—',
      r.islandEnabled ? r.islandRadiusM.toFixed(1) : '—',
      r.islandEnabled ? r.islandSetbackM.toFixed(1) : '—',
      r.notes.join('·') || '—',
    ]
    vals.forEach((v, j) => {
      const fill = j === 1 && r.enabled ? '#16a34a' : j === 9 && r.notes.length ? '#c2410c' : '#0f172a'
      g += `<text x="${xs[j]}" y="${y}" fill="${fill}" font-size="11" font-weight="${j === 0 ? 600 : 400}">${esc(v)}</text>`
    })
  })

  g += `<text x="28" y="${H - 16}" fill="#94a3b8" font-size="10">示意审查表 · 非设计规范自动校核 · 几何以 mesh 重建为准</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function rightTurnBoardMarkdown(projectName: string, channel: ChannelizationScheme): string {
  const rows = collectRightTurnRows(channel)
  return [
    `# ${projectName} · 右转渠化审查 · ${channel.name}`,
    '',
    '| 进口 | 启用 | 样式 | R | 道宽 | 岛 | 岛R | 备注 |',
    '|------|:----:|------|--:|-----:|:--:|----:|------|',
    ...rows.map(
      (r) =>
        `| ${r.approachName} | ${r.enabled ? 'Y' : 'N'} | ${r.style} | ${r.radiusM} | ${r.channelWidthM} | ${r.islandEnabled ? 'Y' : 'N'} | ${r.islandRadiusM} | ${r.notes.join(';')} |`,
    ),
    '',
    '- 与 `approach.rightTurn` / `safetyIsland` 同源',
  ].join('\n')
}

export function rightTurnBoardCsv(channel: ChannelizationScheme): string {
  const rows = collectRightTurnRows(channel)
  const head =
    'approach,enabled,style,radiusM,channelWidthM,islandOffsetM,islandEnabled,islandRadiusM,islandSetbackM,notes'
  return [
    head,
    ...rows.map((r) =>
      [
        JSON.stringify(r.approachName),
        r.enabled,
        r.style,
        r.radiusM,
        r.channelWidthM,
        r.islandOffsetM,
        r.islandEnabled,
        r.islandRadiusM,
        r.islandSetbackM,
        JSON.stringify(r.notes.join(';')),
      ].join(','),
    ),
  ].join('\n')
}
