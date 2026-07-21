import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const runtimeFiles = [
  'runtime/cdp-client.mjs',
  'runtime/forge-runtime.mjs',
  'runtime/forge-theme.css',
  'runtime/injection-plan.mjs',
  'runtime/injector.mjs',
  'runtime/watch.mjs',
  'shared/theme-model.mjs',
  'scripts/launch.ps1',
  'scripts/disable.ps1',
  'themes/active.json',
  'themes/ink-mountain.json',
  'themes/native-wukong.json',
  'package.json',
  'LICENSE',
  'README.md',
  'PORTABLE-README.txt',
  'start-theme.cmd',
  'stop-theme.cmd',
  'remove-theme.cmd'
];

const inside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

export function packageRuntime({ source, destination }) {
  const sourceRoot = path.resolve(source);
  const target = path.resolve(destination);
  if (sourceRoot === target || inside(sourceRoot, target) || inside(target, sourceRoot)) {
    throw new Error('Runtime package destination must be separate from the source repository.');
  }
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    throw new Error('Runtime package destination must be empty.');
  }

  const activePath = path.join(sourceRoot, 'themes', 'active.json');
  if (!fs.statSync(activePath).isFile()) throw new Error('Required active theme definition is missing.');
  const active = JSON.parse(fs.readFileSync(activePath, 'utf8'));
  const themeReferences = [
    active.background?.asset,
    ...(active.background?.gallery || []).map(item => item.asset),
    ...Object.values(active.motifs || {})
  ].filter(Boolean).map(file => `themes/${file}`);
  const packageFiles = [...new Set([...runtimeFiles, ...themeReferences])];
  const copyRelativeFile = relativeFile => {
    const normalized = path.normalize(relativeFile);
    const sourceFile = path.resolve(sourceRoot, normalized);
    if (!inside(sourceRoot, sourceFile)) throw new Error(`Theme file escapes the source root: ${relativeFile}`);
    if (!fs.statSync(sourceFile).isFile()) throw new Error(`Required runtime file is missing: ${relativeFile}`);
    const targetFile = path.resolve(target, normalized);
    if (!inside(target, targetFile)) throw new Error(`Theme file escapes the package root: ${relativeFile}`);
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.copyFileSync(sourceFile, targetFile);
  };
  fs.mkdirSync(target, { recursive: true });
  packageFiles.forEach(copyRelativeFile);
  return target;
}

function args(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || value == null) throw new Error(`Invalid argument near ${flag ?? '(end)'}.`);
    values[flag.slice(2)] = value;
  }
  return values;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const values = args(process.argv.slice(2));
    if (!values.source || !values.destination) throw new Error('Use --source DIR --destination DIR.');
    console.log(`PACKAGED: ${packageRuntime(values)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
