export const PALETTE_KEYS = ['ink', 'lacquer', 'jade', 'gold', 'paper'];
export const MOTIF_KEYS = ['xiangfeiGourd', 'littleWukong', 'littleBajie'];

export const SCENE_TONES = {
  'celestial-ink': {
    ink: '#f0ede7', inkSoft: '#c2c0bb', lacquer: '#59645f', jade: '#78a6a0', jadeLight: '#a7c8c3', gold: '#a99570', goldLight: '#c9bb9c', paper: '#111514',
    topbar: ['#161a18', .975], sidebar: ['#191c1b', .97], taskbar: ['#1c201e', .96], composer: ['#202422', .97], rightCard: ['#252927', .97], user: ['#292d2a', .94], code: ['#131816', .95], menu: ['#252927', .98],
    veil: ['#111514', .74, .48, .42, .56]
  },
  'sage-sepia': {
    ink: '#f1e6d7', inkSoft: '#c9bba8', lacquer: '#7f4d3d', jade: '#778b79', jadeLight: '#a1b29f', gold: '#b58b58', goldLight: '#d1ad78', paper: '#120e0b',
    topbar: ['#17120f', .97], sidebar: ['#191411', .95], taskbar: ['#201914', .95], composer: ['#241b17', .965], rightCard: ['#2b211b', .955], user: ['#30231d', .93], code: ['#17110e', .95], menu: ['#2b211b', .98],
    veil: ['#120e0b', .72, .44, .38, .54]
  },
  'staff-gold': {
    ink: '#eee7dc', inkSoft: '#c1b8aa', lacquer: '#7b4a35', jade: '#627b68', jadeLight: '#91a893', gold: '#c58b45', goldLight: '#e2b873', paper: '#0d120f',
    topbar: ['#111612', .97], sidebar: ['#141916', .95], taskbar: ['#191e1a', .95], composer: ['#1d211d', .97], rightCard: ['#242820', .96], user: ['#292b22', .93], code: ['#111611', .95], menu: ['#242820', .98],
    veil: ['#0d120f', .70, .40, .34, .60]
  },
  'yaksha-lacquer': {
    ink: '#f2e8e2', inkSoft: '#cfb8b2', lacquer: '#8e3432', jade: '#7d6a5f', jadeLight: '#ab9181', gold: '#c99768', goldLight: '#e0b88a', paper: '#120809',
    topbar: ['#180d0e', .98], sidebar: ['#1d1011', .965], taskbar: ['#231213', .965], composer: ['#281516', .975], rightCard: ['#30191a', .965], user: ['#351b1c', .94], code: ['#190c0d', .96], menu: ['#30191a', .985],
    veil: ['#120809', .76, .54, .46, .62]
  },
  'storm-cyan': {
    ink: '#e9f0f0', inkSoft: '#b7c8c9', lacquer: '#536f73', jade: '#6fb5bd', jadeLight: '#a3d8dd', gold: '#8ea69d', goldLight: '#b7c9c0', paper: '#071218',
    topbar: ['#0d171b', .97], sidebar: ['#101a1e', .96], taskbar: ['#132025', .96], composer: ['#172328', .97], rightCard: ['#1d2d32', .96], user: ['#203137', .94], code: ['#0b171c', .96], menu: ['#1d2d32', .985],
    veil: ['#071218', .76, .50, .44, .60]
  },
  'midnight-blue': {
    ink: '#e8edf2', inkSoft: '#b1becb', lacquer: '#526174', jade: '#6f93b5', jadeLight: '#9ebbd2', gold: '#948d82', goldLight: '#bbb2a5', paper: '#080b12',
    topbar: ['#0d121b', .96], sidebar: ['#111722', .94], taskbar: ['#131a26', .95], composer: ['#171e2a', .96], rightCard: ['#1b2432', .95], user: ['#202a39', .92], code: ['#0d121c', .95], menu: ['#1b2432', .98],
    veil: ['#080b12', .62, .34, .28, .52]
  },
  'ridge-umber': {
    ink: '#eee8df', inkSoft: '#c3b9ac', lacquer: '#745342', jade: '#737b70', jadeLight: '#a0a89d', gold: '#a98d69', goldLight: '#c9ae86', paper: '#15120f',
    topbar: ['#171411', .96], sidebar: ['#1a1715', .95], taskbar: ['#201c19', .95], composer: ['#24201d', .965], rightCard: ['#2b2622', .955], user: ['#302a25', .93], code: ['#181512', .95], menu: ['#2b2622', .98],
    veil: ['#15120f', .64, .38, .48, .32]
  },
  'forest-moss': {
    ink: '#e9e9e2', inkSoft: '#bbc2bc', lacquer: '#5e5147', jade: '#729a91', jadeLight: '#9fc0b8', gold: '#9b8d69', goldLight: '#bcb08a', paper: '#0c1110',
    topbar: ['#121615', .96], sidebar: ['#161a19', .95], taskbar: ['#1b201e', .95], composer: ['#202523', .965], rightCard: ['#272c29', .955], user: ['#2c312d', .93], code: ['#111614', .95], menu: ['#272c29', .98],
    veil: ['#0c1110', .60, .30, .40, .28]
  },
  'mountain-jade': {
    ink: '#eaf0e8', inkSoft: '#b8c4b9', lacquer: '#594a42', jade: '#6f9e7f', jadeLight: '#9bc2a6', gold: '#9f8b61', goldLight: '#c0ab7d', paper: '#0b100d',
    topbar: ['#101612', .96], sidebar: ['#141a17', .95], taskbar: ['#171e1a', .95], composer: ['#1b231e', .97], rightCard: ['#222a24', .96], user: ['#273028', .93], code: ['#101611', .95], menu: ['#222a24', .98],
    veil: ['#0b100d', .60, .32, .40, .30]
  },
  'stone-ash': {
    ink: '#ece9e2', inkSoft: '#bdb8ae', lacquer: '#655146', jade: '#85867d', jadeLight: '#b1b2a8', gold: '#aa8c61', goldLight: '#c9ae82', paper: '#0b0b0a',
    topbar: ['#131312', .95], sidebar: ['#171716', .94], taskbar: ['#1b1b1a', .95], composer: ['#20201f', .96], rightCard: ['#272623', .95], user: ['#2b2a27', .92], code: ['#121211', .94], menu: ['#272623', .98],
    veil: ['#0b0b0a', .50, .18, .22, .30]
  },
  'sunset-copper': {
    ink: '#f2e8df', inkSoft: '#cdb8ae', lacquer: '#8d4d43', jade: '#7f746a', jadeLight: '#aa9c8e', gold: '#c78367', goldLight: '#dda48d', paper: '#140a09',
    topbar: ['#180d0c', .96], sidebar: ['#1b100f', .95], taskbar: ['#221312', .96], composer: ['#281817', .97], rightCard: ['#30201d', .96], user: ['#35231f', .94], code: ['#180d0c', .95], menu: ['#30201d', .98],
    veil: ['#140a09', .62, .36, .50, .26]
  }
};

const MOTIF_CSS_NAMES = {
  xiangfeiGourd: 'xiangfei-gourd',
  littleWukong: 'little-wukong',
  littleBajie: 'little-bajie'
};

export const DEFAULT_THEME = {
  schemaVersion: 3,
  id: 'great-sage-scroll',
  name: '大圣归来 · 潇湘双境',
  palette: {
    ink: '#e3ded4',
    lacquer: '#7c4438',
    jade: '#4f7f7c',
    gold: '#a88755',
    paper: '#171917'
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
      { id: 'erlang-ink-duel', asset: 'assets/erlang-ink-duel.jpg', position: 'center center', mode: 'battle-primary', tone: 'celestial-ink' },
      { id: 'great-sage', asset: 'assets/great-sage-return.jpg', position: 'right center', mode: 'battle-primary', tone: 'sage-sepia' },
      { id: 'great-sage-staff', asset: 'assets/great-sage-staff.jpg', position: 'center center', mode: 'battle-primary', tone: 'staff-gold' },
      { id: 'yaksha-king-rift', asset: 'assets/yaksha-king-rift.jpg', position: 'center center', mode: 'battle-secondary', tone: 'yaksha-lacquer' },
      { id: 'storm-bearer', asset: 'assets/storm-bearer.jpg', position: 'center center', mode: 'battle-secondary', tone: 'storm-cyan' },
      { id: 'shadow-confrontation', asset: 'assets/shadow-confrontation.jpg', position: 'center center', mode: 'battle-secondary', tone: 'midnight-blue' },
      { id: 'ridge-gate', asset: 'assets/ridge-gate.jpg', position: 'center center', mode: 'scenery', tone: 'ridge-umber' },
      { id: 'forest-shrine', asset: 'assets/forest-shrine.jpg', position: 'center center', mode: 'scenery', tone: 'forest-moss' },
      { id: 'mountain-path', asset: 'assets/mountain-path.jpg', position: 'center center', mode: 'scenery', tone: 'mountain-jade' },
      { id: 'stone-buddhas', asset: 'assets/stone-buddhas.jpg', position: 'center center', mode: 'scenery', tone: 'stone-ash' },
      { id: 'sunset-ravine', asset: 'assets/sunset-ravine.jpg', position: 'center center', mode: 'scenery', tone: 'sunset-copper' }
    ]
  },
  motifs: {
    xiangfeiGourd: 'motifs/xiangfei-gourd-icon.webp',
    littleWukong: 'motifs/pets/little-wukong-pet-v1.webp',
    littleBajie: 'motifs/pets/little-bajie-pet-v1.webp'
  },
  accessibility: {
    preset: 'workbench',
    reducedMotion: false
  },
  companion: {
    enabled: true,
    side: 'right',
    size: 72,
    motion: 'quiet'
  }
};

const clone = value => JSON.parse(JSON.stringify(value));
const isHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const isUnit = value => Number.isFinite(value) && value >= 0 && value <= 1;
const POSITIONS = ['left center', 'center center', 'right center'];

export function validateTheme(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Theme must be an object');
  if (value.schemaVersion !== 3) throw Error('Unsupported schemaVersion');
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
        !(entry.tone in SCENE_TONES) ||
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
    `--forge-art-${entry.id}:var(--forge-bg-${index});` +
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
  const sceneRules = assets.map((entry, index) => {
    const tone = SCENE_TONES[entry.tone] || SCENE_TONES['celestial-ink'];
    const [veil, edge, center, top, bottom] = tone.veil;
    const surface = (name, fallback) => rgba(tone[name]?.[0] || fallback, tone[name]?.[1] ?? .96);
    return `:root.forge-ink-mountain[data-forge-scene="${index}"]{` +
      `--forge-scene-bg:var(--forge-bg-${index});--forge-scene-position:var(--forge-position-${index});` +
      `--forge-ink:${tone.ink};--forge-ink-soft:${tone.inkSoft};--forge-lacquer:${tone.lacquer};` +
      `--forge-jade:${tone.jade};--forge-jade-light:${tone.jadeLight};--forge-gold:${tone.gold};` +
      `--forge-gold-light:${tone.goldLight};--forge-paper:${tone.paper};` +
      `--forge-topbar-bg:${surface('topbar', tone.paper)};--forge-sidebar-bg:${surface('sidebar', tone.paper)};` +
      `--forge-taskbar-bg:${surface('taskbar', tone.paper)};--forge-composer-bg:${surface('composer', tone.paper)};` +
      `--forge-right-card-bg:${surface('rightCard', tone.paper)};--forge-user-bg:${surface('user', tone.paper)};` +
      `--forge-code-bg:${surface('code', tone.paper)};--forge-menu-bg:${surface('menu', tone.paper)};` +
      `--forge-veil:linear-gradient(90deg,${rgba(veil, edge)} 0%,${rgba(veil, center)} 28%,${rgba(veil, center)} 72%,${rgba(veil, edge)} 100%),` +
      `linear-gradient(180deg,${rgba(veil, top)},${rgba(veil, center)} 20%,${rgba(veil, center)} 80%,${rgba(veil, bottom)})}`;
  }).join('');
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
    `--forge-companion-enabled:${c.enabled ? 1 : 0};` +
    `--forge-motion:${a.reducedMotion || c.motion === 'still' ? '0ms' : '5200ms'}}` +
    sceneRules;
}
