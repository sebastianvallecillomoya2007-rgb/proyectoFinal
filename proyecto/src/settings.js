export const DEFAULT_SETTINGS = {
  glowEffects: true,
  reduceMotion: false,
  highContrast: false,
  soundEffects: true,
  currency: 'USD',
  highlightRequirements: true,
  catalogNotices: true,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem('nexus_settings')
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export function applySettings(settings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (settings.glowEffects) {
    root.classList.remove('settings-dim-glow')
  } else {
    root.classList.add('settings-dim-glow')
  }

  if (settings.reduceMotion) {
    root.classList.add('settings-reduce-motion')
  } else {
    root.classList.remove('settings-reduce-motion')
  }

  if (settings.highContrast) {
    root.classList.add('settings-high-contrast')
  } else {
    root.classList.remove('settings-high-contrast')
  }
}
