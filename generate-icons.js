const fs = require('fs');
const zlib = require('zlib');

function createPNG(width, height, rgbaData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  const ihdr = createChunk('IHDR', ihdrData);
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawData[offset++] = rgbaData[idx];
      rawData[offset++] = rgbaData[idx + 1];
      rawData[offset++] = rgbaData[idx + 2];
      rawData[offset++] = rgbaData[idx + 3];
    }
  }
  const idat = createChunk('IDAT', zlib.deflateSync(rawData));
  const iend = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xffffffff;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function generateIcon(size) {
  const data = new Uint8Array(size * size * 4);
  const radius = size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let inside = true;
      if (x < radius && y < radius) inside = Math.sqrt((radius-x)**2 + (radius-y)**2) <= radius;
      else if (x >= size-radius && y < radius) inside = Math.sqrt((x-(size-radius))**2 + (radius-y)**2) <= radius;
      else if (x < radius && y >= size-radius) inside = Math.sqrt((radius-x)**2 + (y-(size-radius))**2) <= radius;
      else if (x >= size-radius && y >= size-radius) inside = Math.sqrt((x-(size-radius))**2 + (y-(size-radius))**2) <= radius;
      if (inside) {
        const t = (x + y) / (2 * size);
        data[idx] = Math.round(79 * (1-t) + 0 * t);
        data[idx+1] = Math.round(172 * (1-t) + 242 * t);
        data[idx+2] = Math.round(254 * (1-t) + 254 * t);
        data[idx+3] = 255;
        // T letter
        const cx = size/2, cy = size/2, lw = size*0.5, lh = size*0.5, bh = size*0.12, sw = size*0.15;
        const inTopBar = y >= cy-lh/2 && y <= cy-lh/2+bh && x >= cx-lw/2 && x <= cx+lw/2;
        const inStem = y >= cy-lh/2+bh && y <= cy+lh/2 && x >= cx-sw/2 && x <= cx+sw/2;
        if (inTopBar || inStem) { data[idx] = 26; data[idx+1] = 26; data[idx+2] = 46; }
      } else { data[idx+3] = 0; }
    }
  }
  return createPNG(size, size, data);
}

[16, 32, 48, 128].forEach(size => {
  fs.writeFileSync(`assets/icon${size}.png`, generateIcon(size));
  console.log(`✓ icon${size}.png`);
});
