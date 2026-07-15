import { writeFileSync } from 'node:fs'
import { createCrossTemplate } from '../src/domain/templates/cross'
import { serializeRtp, wrapProject } from '../src/domain/rtp'
import { newId } from '../src/shared/id'

const samples: [string, string, (p: ReturnType<typeof createCrossTemplate>) => void][] = [
  ['standard-cross', '标准十字', () => {}],
  [
    'wide-entry',
    '宽进口示例',
    (p) => {
      for (const ap of p.channelizationSchemes[0].approaches) {
        ap.entryLanes.push({ id: newId(), widthM: 3.5, movements: ['T'] })
      }
    },
  ],
  [
    'compact',
    '紧凑十字',
    (p) => {
      for (const ap of p.channelizationSchemes[0].approaches) {
        ap.entryLanes = ap.entryLanes.slice(0, 2)
        ap.widen.entryWidenLengthM = 40
      }
    },
  ],
]

for (const [file, name, mut] of samples) {
  const p = createCrossTemplate(name)
  mut(p)
  writeFileSync(`examples/${file}.rtp`, serializeRtp(wrapProject(p)))
  console.log('wrote', file)
}
