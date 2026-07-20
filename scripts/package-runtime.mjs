import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const requiredDirectories = ['runtime', 'shared', 'themes'];
const requiredFiles = ['package.json', 'LICENSE'];
const runtimeScripts = ['launch.ps1', 'disable.ps1'];

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

  for (const directory of requiredDirectories) {
    const item = path.join(sourceRoot, directory);
    if (!fs.statSync(item).isDirectory()) throw new Error(`Required runtime directory is missing: ${directory}`);
  }
  for (const file of [...requiredFiles, ...runtimeScripts.map(script => `scripts/${script}`)]) {
    const item = path.join(sourceRoot, file);
    if (!fs.statSync(item).isFile()) throw new Error(`Required runtime file is missing: ${file}`);
  }
  const wsSource = path.join(sourceRoot, 'node_modules', 'ws');
  if (!fs.statSync(wsSource).isDirectory()) throw new Error('Runtime dependency node_modules/ws is missing. Run npm install first.');

  fs.mkdirSync(target, { recursive: true });
  for (const directory of requiredDirectories) {
    fs.cpSync(path.join(sourceRoot, directory), path.join(target, directory), { recursive: true });
  }
  for (const file of requiredFiles) {
    fs.copyFileSync(path.join(sourceRoot, file), path.join(target, file));
  }
  fs.mkdirSync(path.join(target, 'scripts'), { recursive: true });
  for (const script of runtimeScripts) {
    fs.copyFileSync(path.join(sourceRoot, 'scripts', script), path.join(target, 'scripts', script));
  }
  fs.mkdirSync(path.join(target, 'node_modules'), { recursive: true });
  fs.cpSync(wsSource, path.join(target, 'node_modules', 'ws'), { recursive: true });
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
