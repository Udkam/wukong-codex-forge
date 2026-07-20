export const PALETTE_KEYS = ['ink', 'lacquer', 'jade', 'gold', 'paper'];

export const DEFAULT_THEME = {
  schemaVersion: 2,
  id: 'great-sage-scroll',
  name: '大圣归来 · 残卷入梦',
  palette: {
    ink: '#090b0a',
    lacquer: '#211713',
    jade: '#748b78',
    gold: '#d2a45d',
    paper: '#e8dec9'
  },
  background: {
    mode: 'local',
    source: 'great-sage-return.jpg',
    asset: 'assets/great-sage-return.jpg',
    position: 'right center',
    landingPosition: 'right center',
    dim: 0.72,
    taskIntensity: 0.13,
    landingIntensity: 0.72
  },
  accessibility: {
    preset: 'workbench',
    reducedMotion: false
  },
  companion: {
    enabled: true,
    side: 'right',
    size: 96,
    motion: 'quiet'
  }
};

const clone = value => JSON.parse(JSON.stringify(value));
const isHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const isUnit = value => Number.isFinite(value) && value >= 0 && value <= 1;
const POSITIONS = ['left center', 'center center', 'right center'];

export function validateTheme(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Theme must be an object');
  if (value.schemaVersion !== 2) throw Error('Unsupported schemaVersion');
  for (const key of ['id', 'name', 'palette', 'background', 'accessibility', 'companion']) {
    if (!(key in value)) throw Error('Missing ' + key);
  }
  if (!/^[a-z0-9-]{3,64}$/.test(value.id)) throw Error('Invalid theme id');
  if (typeof value.name !== 'string' || !value.name.trim()) throw Error('Invalid theme name');
  for (const key of PALETTE_KEYS) {
    if (!isHex(value.palette[key])) throw Error('Invalid palette.' + key);
  }
  const b = value.background;
  if (
    !['gallery', 'local', 'solid'].includes(b.mode) ||
    typeof b.source !== 'string' ||
    !POSITIONS.includes(b.position) ||
    !POSITIONS.includes(b.landingPosition) ||
    !isUnit(b.dim) ||
    !isUnit(b.taskIntensity) ||
    !isUnit(b.landingIntensity) ||
    (b.asset !== null && typeof b.asset !== 'string')
  ) throw Error('Invalid background');
  const a = value.accessibility;
  if (!['workbench', 'high-read'].includes(a.preset) || typeof a.reducedMotion !== 'boolean') {
    throw Error('Invalid accessibility');
  }
  const c = value.companion;
  if (
    typeof c.enabled !== 'boolean' ||
    !['left', 'right'].includes(c.side) ||
    !Number.isInteger(c.size) ||
    c.size < 48 ||
    c.size > 180 ||
    !['quiet', 'still'].includes(c.motion)
  ) throw Error('Invalid companion');
  return value;
}

export function makeTheme(overrides = {}) {
  const next = clone(DEFAULT_THEME);
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) Object.assign(next[key], value);
    else next[key] = value;
  }
  return validateTheme(next);
}

const cssEscapeUrl = url => url
  ? 'url("' + String(url).replaceAll('\\', '/').replaceAll('"', '%22') + '")'
  : 'none';

const rgba = (hex, alpha) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha.toFixed(3)})`;
};

const clamp = value => Math.max(0, Math.min(1, value));

export function cssFor(theme, assetUrl = '') {
  validateTheme(theme);
  const { background: b, companion: c, accessibility: a, palette: p } = theme;
  const visible = Boolean(assetUrl) && b.mode !== 'solid' && a.preset !== 'high-read';
  const taskWash = visible ? clamp(b.dim + (1 - b.taskIntensity) * 0.16) : 1;
  const landingWash = visible ? clamp(Math.max(0.28, b.dim - b.landingIntensity * 0.34)) : 1;
  return `:root.forge-ink-mountain{` +
    `--forge-ink:${p.ink};--forge-lacquer:${p.lacquer};--forge-jade:${p.jade};` +
    `--forge-gold:${p.gold};--forge-paper:${p.paper};` +
    `--forge-bg:${visible ? cssEscapeUrl(assetUrl) : 'none'};` +
    `--forge-position:${b.position};--forge-landing-position:${b.landingPosition};` +
    `--forge-task-wash:${rgba(p.ink, taskWash)};--forge-landing-wash:${rgba(p.ink, landingWash)};` +
    `--forge-backdrop-dim:${b.dim};--forge-art-intensity:${b.taskIntensity};` +
    `--forge-landing-intensity:${b.landingIntensity};--forge-companion-size:${c.size}px;` +
    `--forge-motion:${a.reducedMotion || c.motion === 'still' ? '0ms' : '5200ms'}}`;
}
