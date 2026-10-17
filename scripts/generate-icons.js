import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator using Node's built-in zlib
function createSolidPNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw pixel data with filter byte 0 at start of each scanline
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Draw circular compass design: check distance from center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.42;

      // Outer squircle margin for maskable / regular
      if (dist < width * 0.08) {
        // center dot (teal bright)
        rawData[pixelOffset] = 45; // #2dd4bf
        rawData[pixelOffset + 1] = 212;
        rawData[pixelOffset + 2] = 191;
        rawData[pixelOffset + 3] = 255;
      } else if (dist < width * 0.15) {
        // inner ring
        rawData[pixelOffset] = 15; // #0f172a
        rawData[pixelOffset + 1] = 23;
        rawData[pixelOffset + 2] = 42;
        rawData[pixelOffset + 3] = 255;
      } else if (dist < radius && (Math.abs(dx) < 6 || Math.abs(dy) < 6)) {
        // crosshair dial
        rawData[pixelOffset] = 13; // #0d9488
        rawData[pixelOffset + 1] = 148;
        rawData[pixelOffset + 2] = 136;
        rawData[pixelOffset + 3] = 255;
      } else if (dist < radius && dist > radius - 8) {
        // compass ring
        rawData[pixelOffset] = 20; // #14b8a6
        rawData[pixelOffset + 1] = 184;
        rawData[pixelOffset + 2] = 166;
        rawData[pixelOffset + 3] = 255;
      } else {
        // background deep navy #0f172a
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);

  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);

  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + len);

  return chunk;
}

// CRC-32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Navy #0f172a is r=15, g=23, b=42
const pwa192 = createSolidPNG(192, 192, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createSolidPNG(512, 512, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable512 = createSolidPNG(512, 512, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

const appleIcon = createSolidPNG(180, 180, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('Generated PNG icons in /public successfully.');
