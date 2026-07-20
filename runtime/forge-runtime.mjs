import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cssFor, validateTheme } from '../shared/theme-model.mjs';

export { DEFAULT_THEME, cssFor, makeTheme, validateTheme } from '../shared/theme-model.mjs';

export const MAX_THEME_BYTES = 256 * 1024;
export const MAX_ART_BYTES = 16 * 1024 * 1024;

export function readThemeFile(themePath) {
  const raw = fs.readFileSync(themePath, 'utf8');
  if (Buffer.byteLength(raw) > MAX_THEME_BYTES) throw Error('Theme exceeds size limit');
  return validateTheme(JSON.parse(raw.replace(/^\uFEFF/, '')));
}

export function resolveThemeAsset(themePath, theme) {
  if (!theme.background.asset) return '';
  const root = path.resolve(path.dirname(themePath));
  const asset = path.resolve(root, theme.background.asset);
  const relative = path.relative(root, asset);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Theme asset escapes its managed directory');
  const stat = fs.statSync(asset);
  if (!stat.isFile() || stat.size > MAX_ART_BYTES) throw Error('Invalid theme asset');
  const mime = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  }[path.extname(asset).toLowerCase()];
  if (!mime) throw Error('Unsupported theme asset');
  return `data:${mime};base64,${fs.readFileSync(asset).toString('base64')}`;
}

export function payloadFromThemeFile(themePath) {
  const theme = readThemeFile(themePath);
  const assetUrl = resolveThemeAsset(themePath, theme);
  return { theme, assetUrl, variables: cssFor(theme, assetUrl) };
}

if (process.argv[2] === '--validate') {
  const theme = readThemeFile(process.argv[3]);
  console.log(`VALID: ${theme.name}`);
} else if (process.argv[2] === '--payload') {
  console.log(payloadFromThemeFile(process.argv[3]).variables);
}
