const KEY = 'crossdraw.autosave.v1'

export function saveDraft(json: string) {
  try {
    localStorage.setItem(KEY, json)
    localStorage.setItem(KEY + '.ts', String(Date.now()))
  } catch {
    /* quota */
  }
}

export function loadDraft(): { json: string; ts: number } | null {
  try {
    const json = localStorage.getItem(KEY)
    const ts = Number(localStorage.getItem(KEY + '.ts') || 0)
    if (!json) return null
    return { json, ts }
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(KEY + '.ts')
}
