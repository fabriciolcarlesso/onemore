import sharp from "sharp";

const [
  inputPath,
  outputPath,
  gutterValue = "0",
  interpolationValue = "0",
  delayValue = "90",
  stabilizationValue = "0",
] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/make-bench-press-gif.mjs <sprite-sheet.png> <output.gif> [vertical-gutter] [intermediate-frames] [delay-ms] [stabilization-threshold]");
  process.exit(1);
}

const columns = 4;
const rows = 2;
const verticalGutter = Number(gutterValue);
const intermediateFrames = Number(interpolationValue);
const frameDelay = Number(delayValue);
const stabilizationThreshold = Number(stabilizationValue);
const metadata = await sharp(inputPath).metadata();

if (!metadata.width || !metadata.height) {
  throw new Error("Could not determine the sprite sheet dimensions.");
}

const frameWidth = Math.floor((metadata.width - verticalGutter * (columns - 1)) / columns);
const frameHeight = Math.floor(metadata.height / rows);
const sourceFrames = [];

for (let index = 0; index < columns * rows; index += 1) {
  sourceFrames.push(
    await sharp(inputPath)
      .extract({
        left: (index % columns) * (frameWidth + verticalGutter),
        top: Math.floor(index / columns) * frameHeight,
        width: frameWidth,
        height: frameHeight,
      })
      .png()
      .toBuffer(),
  );
}

if (stabilizationThreshold > 0) {
  const rawFrames = await Promise.all(
    sourceFrames.map((frame) => sharp(frame).ensureAlpha().raw().toBuffer()),
  );
  const reference = rawFrames[0];
  const forcedStaticStart = Math.floor(frameHeight * 0.65);

  for (let offset = 0; offset < reference.length; offset += 4) {
    const pixelIndex = offset / 4;
    const row = Math.floor(pixelIndex / frameWidth);
    let maximumRange = 0;

    for (let channel = 0; channel < 3; channel += 1) {
      let minimum = 255;
      let maximum = 0;

      for (const frame of rawFrames) {
        minimum = Math.min(minimum, frame[offset + channel]);
        maximum = Math.max(maximum, frame[offset + channel]);
      }
      maximumRange = Math.max(maximumRange, maximum - minimum);
    }

    const isStatic = maximumRange <= stabilizationThreshold || row >= forcedStaticStart;
    if (!isStatic) continue;

    for (const frame of rawFrames) {
      reference.copy(frame, offset, offset, offset + 4);
    }
  }

  for (let index = 0; index < sourceFrames.length; index += 1) {
    sourceFrames[index] = await sharp(rawFrames[index], {
      raw: { width: frameWidth, height: frameHeight, channels: 4 },
    })
      .png()
      .toBuffer();
  }
}

const frames = [];

for (let index = 0; index < sourceFrames.length; index += 1) {
  const current = sourceFrames[index];
  const next = sourceFrames[(index + 1) % sourceFrames.length];
  frames.push(current);

  for (let step = 1; step <= intermediateFrames; step += 1) {
    const amount = step / (intermediateFrames + 1);
    const currentPixels = await sharp(current).ensureAlpha().raw().toBuffer();
    const nextPixels = await sharp(next).ensureAlpha().raw().toBuffer();
    const blendedPixels = Buffer.allocUnsafe(currentPixels.length);

    for (let pixel = 0; pixel < currentPixels.length; pixel += 1) {
      blendedPixels[pixel] = Math.round(
        currentPixels[pixel] * (1 - amount) + nextPixels[pixel] * amount,
      );
    }

    frames.push(
      await sharp(blendedPixels, {
        raw: { width: frameWidth, height: frameHeight, channels: 4 },
      })
        .png()
        .toBuffer(),
    );
  }
}

await sharp(frames, {
  join: { across: 1, animated: true },
})
  .gif({ delay: Array(frames.length).fill(frameDelay), loop: 0, colours: 128, effort: 8 })
  .toFile(outputPath);

console.log(`Created ${outputPath} (${frameWidth}x${frameHeight}, ${frames.length} frames)`);
