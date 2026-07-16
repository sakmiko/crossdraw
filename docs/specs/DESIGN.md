# Crossdraw System Design System (DESIGN.md)

This document defines the visual layout, typography, UI components, responsive breakpoints, design tokens, and color system for Crossdraw. Developers and AI agents must strictly adhere to this specification to maintain pixel-perfect UI consistency across themes.

Source of truth for shell CSS: `src/ui/styles.css` tokens block (keep in sync).

---

## 1. Design Tokens & Color Variables

All colors are controlled via CSS custom properties mapped to semantic variables. **No hard-coded hex colors are allowed in workspace layouts.**

### 1.1 Dark Theme (Default)
```css
html[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0b0f19;
  --bg-elevated: #111524;
  --panel: #161c2e;
  --panel-2: #1e253c;
  --panel-hover: #262e4a;
  --border: rgba(148, 163, 184, 0.1);
  --border-strong: rgba(148, 163, 184, 0.2);
  --text: #f8fafc;
  --text-secondary: #cbd5e1;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --accent-soft: rgba(56, 189, 248, 0.12);
  --accent-2: #818cf8;
  --ok: #34d399;
  --ok-soft: rgba(52, 211, 153, 0.1);
  --warn: #fbbf24;
  --warn-soft: rgba(251, 191, 36, 0.1);
  --block: #f87171;
  --block-soft: rgba(248, 113, 113, 0.1);
  --input-bg: #0d1222;
  --canvas-stage: #0c1118;
  --btn-bg: linear-gradient(180deg, #1e253c, #161c2e);
  --btn-primary-bg: linear-gradient(180deg, #38bdf8, #0284c7);
  --btn-primary-border: #38bdf8;
  --shadow: 0 10px 36px rgba(0, 0, 0, 0.45);
  --topbar-bg: rgba(17, 21, 36, 0.92);
  --status-bg: #080c12;
}
```

### 1.2 Light Theme
```css
html[data-theme='light'] {
  color-scheme: light;
  --bg: #f8fafc;
  --bg-elevated: #f1f5f9;
  --panel: #ffffff;
  --panel-2: #f1f5f9;
  --panel-hover: #e2e8f0;
  --border: rgba(15, 23, 42, 0.08);
  --border-strong: rgba(15, 23, 42, 0.16);
  --text: #0f172a;
  --text-secondary: #475569;
  --muted: #64748b;
  --accent: #0284c7;
  --accent-soft: rgba(2, 132, 199, 0.08);
  --accent-2: #4f46e5;
  --ok: #059669;
  --ok-soft: rgba(5, 150, 105, 0.1);
  --warn: #b45309;
  --warn-soft: rgba(180, 83, 9, 0.1);
  --block: #b91c1c;
  --block-soft: rgba(185, 28, 28, 0.1);
  --input-bg: #ffffff;
  --canvas-stage: #dce3ec;
  --btn-bg: linear-gradient(180deg, #ffffff, #f1f5f9);
  --btn-primary-bg: linear-gradient(180deg, #0284c7, #0369a1);
  --btn-primary-border: #0369a1;
  --shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
  --topbar-bg: rgba(255, 255, 255, 0.94);
  --status-bg: #e8ecf2;
}
```

### 1.3 Key Sizing Tokens
* `--radius-sm: 6px` · `--radius: 10px` · `--radius-lg: 12px`
* `--shell-top: 50px` · `--shell-bottom: 28px`
* `--shell-nav: 148px` · `--shell-nav-collapsed: 52px`
* `--ctrl-h: 32px` · `--ctrl-gap: 6px` · `--input-num: 5.5rem`

---

## 2. Layout Grid (Page-fill)

`100vh` nested grid; scroll only in children.

### 2.1 Main Shell
```css
.main {
  display: grid;
  grid-template-columns: var(--shell-nav) minmax(0, 1fr);
  min-height: 0;
  transition: grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.app.nav-collapsed .main {
  grid-template-columns: var(--shell-nav-collapsed) minmax(0, 1fr);
}
```

### 2.2 Stage + Params (desktop ≥ 1101px)
* Default: `minmax(0, 1fr) minmax(320px, 38%)`
* Channel: `minmax(0, 1.3fr) minmax(320px, 35%)`
* Flow: `minmax(0, 1fr) minmax(360px, 42%)`
* Signal / Analysis / XSection / Compare: `minmax(0, 1fr) minmax(340px, 40%)`
* All modes **left stage | right params** on desktop (no vertical stack).

---

## 3. Components

### 3.1 Buttons
`height: var(--ctrl-h); padding: 0 12px; font-size: 12px;` · primary / default / ghost · `active: scale(0.97)`

### 3.2 Selects
`appearance: none` · custom chevron · `padding-right: 28px`

### 3.3 Params density
Number inputs `width: 5.5rem` · table td `padding: 2px 4px` · `.rg-section` tight borders · hide long `.hint`

---

## 4. LeftNav transitions
Width transition 0.25s · brand/label opacity+translate · toggle chevron rotate 180deg when collapsed.

---

## 5. Interactive signal timing (v0.5.131+)
Center stage **相位灯态 · 配时条** is an interactive React board (`InteractiveSignalBoard`):
drag green bar edge to change `greenSec` (min 1s); click phase to focus; writes via `updatePhaseTiming` (homology with phase table).
