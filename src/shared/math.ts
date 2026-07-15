export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function almostEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps
}

export function degToRad(d: number): number {
  return (d * Math.PI) / 180
}

export function radToDeg(r: number): number {
  return (r * 180) / Math.PI
}

export function round(n: number, digits = 6): number {
  const p = 10 ** digits
  return Math.round(n * p) / p
}

export function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, '\n')
}
