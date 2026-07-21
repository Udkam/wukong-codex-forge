import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const parseArgs = argv => {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value == null) throw Error(`Invalid argument near ${key ?? '(end)'}`);
    values[key.slice(2)] = value;
  }
  return values;
};

const median = values => {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
};

const borderColour = png => {
  const samples = [[], [], []];
  const add = (x, y) => {
    const offset = (y * png.width + x) * 4;
    for (let channel = 0; channel < 3; channel += 1) samples[channel].push(png.data[offset + channel]);
  };
  const stepX = Math.max(1, Math.floor(png.width / 96));
  const stepY = Math.max(1, Math.floor(png.height / 96));
  for (let x = 0; x < png.width; x += stepX) {
    add(x, 0);
    add(x, png.height - 1);
  }
  for (let y = 0; y < png.height; y += stepY) {
    add(0, y);
    add(png.width - 1, y);
  }
  return samples.map(median);
};

const smoothstep = value => value * value * (3 - 2 * value);
const clampByte = value => Math.max(0, Math.min(255, Math.round(value)));

const keyMagenta = source => {
  const background = borderColour(source);
  const result = new PNG({ width: source.width, height: source.height });
  let minX = source.width;
  let minY = source.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const offset = (y * source.width + x) * 4;
      const red = source.data[offset];
      const green = source.data[offset + 1];
      const blue = source.data[offset + 2];
      const magenta = Math.min(red, blue) - green - Math.abs(red - blue) * .42;
      const qualifies = red > 48 && blue > 48;
      const rawAlpha = !qualifies || magenta <= 24
        ? 1
        : magenta >= 132
          ? 0
          : 1 - smoothstep((magenta - 24) / 108);
      const alpha = rawAlpha < .025 ? 0 : rawAlpha;

      if (alpha === 0) {
        result.data.fill(0, offset, offset + 4);
        continue;
      }

      for (let channel = 0; channel < 3; channel += 1) {
        const observed = source.data[offset + channel];
        const decontaminated = alpha < .995
          ? (observed - background[channel] * (1 - alpha)) / Math.max(alpha, .06)
          : observed;
        result.data[offset + channel] = clampByte(decontaminated);
      }
      result.data[offset + 3] = clampByte(alpha * 255);
      if (alpha > .035) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  /* Replace semi-transparent chroma RGB with the nearest solid character colour.
     Alpha still carries the antialiasing; colour dilation prevents purple/green fringe. */
  const original = Buffer.from(result.data);
  for (let y = 0; y < result.height; y += 1) {
    for (let x = 0; x < result.width; x += 1) {
      const offset = (y * result.width + x) * 4;
      const alpha = original[offset + 3];
      if (alpha === 0 || alpha >= 250) continue;
      let sourceOffset = -1;
      for (let radius = 1; radius <= 6 && sourceOffset < 0; radius += 1) {
        const left = Math.max(0, x - radius);
        const right = Math.min(result.width - 1, x + radius);
        const top = Math.max(0, y - radius);
        const bottom = Math.min(result.height - 1, y + radius);
        for (let sampleY = top; sampleY <= bottom && sourceOffset < 0; sampleY += 1) {
          for (let sampleX = left; sampleX <= right; sampleX += 1) {
            if (sampleX !== left && sampleX !== right && sampleY !== top && sampleY !== bottom) continue;
            const candidate = (sampleY * result.width + sampleX) * 4;
            if (original[candidate + 3] >= 250) {
              sourceOffset = candidate;
              break;
            }
          }
        }
      }
      if (sourceOffset >= 0) {
        result.data[offset] = original[sourceOffset];
        result.data[offset + 1] = original[sourceOffset + 1];
        result.data[offset + 2] = original[sourceOffset + 2];
      } else if (alpha < 24) {
        result.data.fill(0, offset, offset + 4);
      }
    }
  }

  const spillScore = (buffer, offset) => {
    const red = buffer[offset];
    const green = buffer[offset + 1];
    const blue = buffer[offset + 2];
    return red > 70 && blue > 70
      ? Math.min(red, blue) - green - Math.abs(red - blue) * .3
      : -Infinity;
  };
  const dilated = Buffer.from(result.data);
  for (let y = 0; y < result.height; y += 1) {
    for (let x = 0; x < result.width; x += 1) {
      const offset = (y * result.width + x) * 4;
      const alpha = dilated[offset + 3];
      if (alpha === 0) continue;
      if (alpha < 18) {
        result.data.fill(0, offset, offset + 4);
        continue;
      }
      if (spillScore(dilated, offset) <= 28) continue;
      let sourceOffset = -1;
      for (let radius = 1; radius <= 8 && sourceOffset < 0; radius += 1) {
        const left = Math.max(0, x - radius);
        const right = Math.min(result.width - 1, x + radius);
        const top = Math.max(0, y - radius);
        const bottom = Math.min(result.height - 1, y + radius);
        for (let sampleY = top; sampleY <= bottom && sourceOffset < 0; sampleY += 1) {
          for (let sampleX = left; sampleX <= right; sampleX += 1) {
            if (sampleX !== left && sampleX !== right && sampleY !== top && sampleY !== bottom) continue;
            const candidate = (sampleY * result.width + sampleX) * 4;
            if (dilated[candidate + 3] >= 220 && spillScore(dilated, candidate) < 12) {
              sourceOffset = candidate;
              break;
            }
          }
        }
      }
      if (sourceOffset >= 0) {
        result.data[offset] = dilated[sourceOffset];
        result.data[offset + 1] = dilated[sourceOffset + 1];
        result.data[offset + 2] = dilated[sourceOffset + 2];
      } else if (alpha < 96) {
        result.data.fill(0, offset, offset + 4);
      }
    }
  }

  if (maxX < minX || maxY < minY) throw Error('No foreground remained after chroma keying');
  const padding = 8;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(source.width - 1, maxX + padding);
  maxY = Math.min(source.height - 1, maxY + padding);
  const cropped = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  PNG.bitblt(result, cropped, minX, minY, cropped.width, cropped.height, 0, 0);
  return { background, cropped };
};

const writeImage = (destination, data) => {
  const absolute = path.resolve(destination);
  if (fs.existsSync(absolute)) throw Error(`Refusing to overwrite retained file: ${absolute}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, data, { flag: 'wx' });
  return absolute;
};

const resizeAndEncode = async ({ png, height }) => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const source = PNG.sync.write(png).toString('base64');
    return await page.evaluate(async ({ source, sourceWidth, sourceHeight, targetHeight }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const scale = Math.min(1, targetHeight / sourceHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return {
        width: canvas.width,
        height: canvas.height,
        png: canvas.toDataURL('image/png').split(',')[1],
        webp: canvas.toDataURL('image/webp', .9).split(',')[1]
      };
    }, { source, sourceWidth: png.width, sourceHeight: png.height, targetHeight: height });
  } finally {
    await browser.close();
  }
};

const values = parseArgs(process.argv.slice(2));
if (!values.input || !values.png || !values.webp) {
  throw Error('Use --input INPUT.png --png OUTPUT.png --webp OUTPUT.webp [--height 768]');
}
const targetHeight = Number(values.height || 768);
if (!Number.isInteger(targetHeight) || targetHeight < 128 || targetHeight > 2048) throw Error('Invalid output height');
const source = PNG.sync.read(fs.readFileSync(path.resolve(values.input)));
const keyed = keyMagenta(source);
const encoded = await resizeAndEncode({ png: keyed.cropped, height: targetHeight });
const pngPath = writeImage(values.png, Buffer.from(encoded.png, 'base64'));
const webpPath = writeImage(values.webp, Buffer.from(encoded.webp, 'base64'));
console.log(JSON.stringify({
  input: path.resolve(values.input),
  background: keyed.background,
  width: encoded.width,
  height: encoded.height,
  png: pngPath,
  webp: webpPath
}));
