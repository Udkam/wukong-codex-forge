import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cssFor, validateTheme } from '../shared/theme-model.mjs';

export { DEFAULT_THEME, cssFor, makeTheme, validateTheme } from '../shared/theme-model.mjs';

export const MAX_THEME_BYTES = 256 * 1024;
export const MAX_ART_BYTES = 16 * 1024 * 1024;
export const MAX_GALLERY_BYTES = 24 * 1024 * 1024;
export const MAX_MOTIF_BYTES = 4 * 1024 * 1024;

export function readThemeFile(themePath) {
  const raw = fs.readFileSync(themePath, 'utf8');
  if (Buffer.byteLength(raw) > MAX_THEME_BYTES) throw Error('Theme exceeds size limit');
  return validateTheme(JSON.parse(raw.replace(/^\uFEFF/, '')));
}

const assetDataUrl = (themePath, relativeAsset) => {
  const root = path.resolve(path.dirname(themePath));
  const asset = path.resolve(root, relativeAsset);
  const relative = path.relative(root, asset);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Theme asset escapes its managed directory');
  const stat = fs.statSync(asset);
  if (!stat.isFile() || stat.size > MAX_ART_BYTES) throw Error('Invalid theme asset');
  const mime = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  }[path.extname(asset).toLowerCase()];
  if (!mime) throw Error('Unsupported theme asset');
  return {
    bytes: stat.size,
    url: `data:${mime};base64,${fs.readFileSync(asset).toString('base64')}`
  };
};

export function resolveThemeAssets(themePath, theme) {
  if (theme.background.mode === 'solid') return [];
  const requested = theme.background.gallery?.length
    ? theme.background.gallery
    : theme.background.asset
      ? [{ id: 'primary', asset: theme.background.asset, position: theme.background.position }]
      : [];
  let totalBytes = 0;
  const cache = new Map();
  const assets = requested.map(entry => {
    let encoded = cache.get(entry.asset);
    if (!encoded) {
      encoded = assetDataUrl(themePath, entry.asset);
      cache.set(entry.asset, encoded);
      totalBytes += encoded.bytes;
      if (totalBytes > MAX_GALLERY_BYTES) throw Error('Theme gallery exceeds size limit');
    }
    return { id: entry.id, url: encoded.url, position: entry.position, mode: entry.mode };
  });
  return assets;
}

export function resolveThemeAsset(themePath, theme) {
  return resolveThemeAssets(themePath, theme)[0]?.url || '';
}

export function resolveThemeMotifs(themePath, theme) {
  if (!theme.motifs) return {};
  let totalBytes = 0;
  return Object.fromEntries(Object.entries(theme.motifs).map(([key, relativeAsset]) => {
    const encoded = assetDataUrl(themePath, relativeAsset);
    totalBytes += encoded.bytes;
    if (totalBytes > MAX_MOTIF_BYTES) throw Error('Theme motifs exceed size limit');
    return [key, encoded.url];
  }));
}

export function payloadFromThemeFile(themePath) {
  const theme = readThemeFile(themePath);
  const assets = resolveThemeAssets(themePath, theme);
  const motifs = resolveThemeMotifs(themePath, theme);
  const assetUrl = assets[0]?.url || '';
  return { theme, assetUrl, assets, motifs, variables: cssFor(theme, assets, motifs) };
}

if (process.argv[2] === '--validate') {
  const theme = readThemeFile(process.argv[3]);
  console.log(`VALID: ${theme.name}`);
} else if (process.argv[2] === '--payload') {
  console.log(payloadFromThemeFile(process.argv[3]).variables);
}
