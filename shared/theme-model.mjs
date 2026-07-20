export const PALETTE_KEYS = ['ink', 'lacquer', 'jade', 'gold', 'paper'];
export const MOTIF_KEYS = ['yakshaSet', 'fangedCyanStaff'];

const MOTIF_CSS_NAMES = {
  yakshaSet: 'yaksha-set',
  fangedCyanStaff: 'fanged-cyan-staff'
};

export const DEFAULT_THEME = {
  schemaVersion: 2,
  id: 'great-sage-scroll',
  name: '大圣归来 · 玄锋双境',
  palette: {
    ink: '#e2ddd3',
    lacquer: '#9d3029',
    jade: '#69777b',
    gold: '#bd914d',
    paper: '#181a19'
  },
  background: {
    mode: 'gallery',
    source: 'managed-cinematic-gallery',
    asset: 'assets/great-sage-return.jpg',
    position: 'right center',
    landingPosition: 'right center',
    dim: 0.3,
    taskIntensity: 0.7,
    landingIntensity: 0.84,
    primarySceneCount: 3,
    gallery: [
      { id: 'erlang-ink-duel', asset: 'assets/erlang-ink-duel.jpg', position: 'center center', mode: 'battle-primary' },
      { id: 'great-sage', asset: 'assets/great-sage-return.jpg', position: 'right center', mode: 'battle-primary' },
      { id: 'great-sage-staff', asset: 'assets/great-sage-staff.jpg', position: 'center center', mode: 'battle-primary' },
      { id: 'yaksha-king-rift', asset: 'assets/yaksha-king-rift.jpg', position: 'center center', mode: 'battle-secondary' },
      { id: 'storm-bearer', asset: 'assets/storm-bearer.jpg', position: 'center center', mode: 'battle-secondary' },
      { id: 'shadow-confrontation', asset: 'assets/shadow-confrontation.jpg', position: 'center center', mode: 'battle-secondary' },
      { id: 'ridge-gate', asset: 'assets/ridge-gate.jpg', position: 'center center', mode: 'scenery' },
      { id: 'forest-shrine', asset: 'assets/forest-shrine.jpg', position: 'center center', mode: 'scenery' },
      { id: 'mountain-path', asset: 'assets/mountain-path.jpg', position: 'center center', mode: 'scenery' },
      { id: 'stone-buddhas', asset: 'assets/stone-buddhas.jpg', position: 'center center', mode: 'scenery' },
      { id: 'sunset-ravine', asset: 'assets/sunset-ravine.jpg', position: 'center center', mode: 'scenery' }
    ]
  },
  motifs: {
    yakshaSet: 'motifs/yaksha-set.png',
    fangedCyanStaff: 'motifs/fanged-cyan-staff.png'
  },
  accessibility: {
    preset: 'workbench',
    reducedMotion: false
  },
  companion: {
    enabled: false,
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
  if (b.gallery !== undefined) {
    if (!Array.isArray(b.gallery) || b.gallery.length < 1 || b.gallery.length > 12) {
      throw Error('Invalid background.gallery');
    }
    const ids = new Set();
    for (const entry of b.gallery) {
      if (
        !entry ||
        typeof entry !== 'object' ||
        !/^[a-z0-9-]{3,64}$/.test(entry.id) ||
        typeof entry.asset !== 'string' ||
        !entry.asset ||
        !POSITIONS.includes(entry.position) ||
        !['scenery', 'battle-primary', 'battle-secondary'].includes(entry.mode) ||
        ids.has(entry.id)
      ) throw Error('Invalid background.gallery entry');
      ids.add(entry.id);
    }
  }
  if (
    b.primarySceneCount !== undefined &&
    (!Number.isInteger(b.primarySceneCount) || b.primarySceneCount < 1 || b.primarySceneCount >= (b.gallery?.length || 1))
  ) throw Error('Invalid background.primarySceneCount');
  if (value.motifs !== undefined) {
    if (!value.motifs || typeof value.motifs !== 'object' || Array.isArray(value.motifs)) {
      throw Error('Invalid motifs');
    }
    for (const key of MOTIF_KEYS) {
      if (typeof value.motifs[key] !== 'string' || !value.motifs[key]) throw Error('Invalid motifs.' + key);
    }
  }
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

export function cssFor(theme, assetInput = '', motifInput = {}) {
  validateTheme(theme);
  const { background: b, companion: c, accessibility: a, palette: p } = theme;
  const requestedAssets = Array.isArray(assetInput)
    ? assetInput
    : assetInput
      ? [{ id: 'primary', url: assetInput, position: b.position }]
      : [];
  const visibleAssets = b.mode !== 'solid' && a.preset !== 'high-read'
    ? requestedAssets.filter(entry => entry && typeof entry.url === 'string' && entry.url)
    : [];
  const visible = visibleAssets.length > 0;
  const taskWash = visible ? clamp(b.dim + (1 - b.taskIntensity) * 0.16) : 1;
  const landingWash = visible ? clamp(Math.max(0.2, b.dim - b.landingIntensity * 0.34)) : 1;
  const assets = visible ? visibleAssets : [{ id: 'solid', url: '', position: b.position }];
  const threadSceneCount = Math.max(0, assets.length - 1);
  const primarySceneCount = threadSceneCount
    ? Math.min(b.primarySceneCount ?? Math.min(2, threadSceneCount), threadSceneCount)
    : 0;
  const assetVariables = assets.map((entry, index) => (
    `--forge-bg-${index}:${entry.url ? cssEscapeUrl(entry.url) : 'none'};` +
    `--forge-art-${entry.id}:${entry.url ? cssEscapeUrl(entry.url) : 'none'};` +
    `--forge-position-${index}:${POSITIONS.includes(entry.position) ? entry.position : b.position};`
  )).join('');
  const motifVariables = MOTIF_KEYS.map(key => (
    `--forge-motif-${MOTIF_CSS_NAMES[key]}:${motifInput[key] ? cssEscapeUrl(motifInput[key]) : 'none'};`
  )).join('');
  const sceneList = mode => assets
    .map((entry, index) => entry.mode === mode ? index : null)
    .filter(index => index !== null)
    .join(' ');
  const sceneryScenes = sceneList('scenery') || '0';
  const primaryBattleScenes = sceneList('battle-primary') || (assets.length > 1 ? '1' : '0');
  const secondaryBattleScenes = sceneList('battle-secondary');
  const sceneRules = assets.map((entry, index) => (
    `:root.forge-ink-mountain[data-forge-scene="${index}"]{` +
    `--forge-scene-bg:var(--forge-bg-${index});--forge-scene-position:var(--forge-position-${index})}`
  )).join('');
  return `:root.forge-ink-mountain{` +
    `--forge-ink:${p.ink};--forge-lacquer:${p.lacquer};--forge-jade:${p.jade};` +
    `--forge-gold:${p.gold};--forge-paper:${p.paper};` +
    assetVariables +
    motifVariables +
    `--forge-scene-count:${assets.length};--forge-primary-scene-count:${primarySceneCount};` +
    `--forge-scenery-scenes:${sceneryScenes};--forge-battle-primary-scenes:${primaryBattleScenes};` +
    `--forge-battle-secondary-scenes:${secondaryBattleScenes || 'none'};` +
    `--forge-scene-bg:var(--forge-bg-0);` +
    `--forge-scene-position:var(--forge-position-0);--forge-bg:var(--forge-bg-0);` +
    `--forge-position:${b.position};--forge-landing-position:${b.landingPosition};` +
    `--forge-task-wash:${rgba(p.paper, taskWash)};--forge-landing-wash:${rgba(p.paper, landingWash)};` +
    `--forge-backdrop-dim:${b.dim};--forge-art-intensity:${b.taskIntensity};` +
    `--forge-landing-intensity:${b.landingIntensity};--forge-companion-size:${c.size}px;` +
    `--forge-motion:${a.reducedMotion || c.motion === 'still' ? '0ms' : '5200ms'}}` +
    sceneRules;
}
