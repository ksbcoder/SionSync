import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

function buildSvg(size: number) {
  const padding = size * 0.18;
  const inner = size - padding * 2;
  const r = size * 0.22;

  // Nota musical: cabeza + plica + corchete
  const cx = size / 2 - inner * 0.08;
  const cy = size / 2 + inner * 0.18;
  const headRx = inner * 0.18;
  const headRy = inner * 0.135;
  const stemX = cx + headRx * 0.85;
  const stemTop = cy - inner * 0.52;
  const stemH = inner * 0.52;
  const flagX1 = stemX;
  const flagY1 = stemTop;
  const flagX2 = stemX + inner * 0.28;
  const flagY2 = stemTop + inner * 0.14;
  const flagX3 = stemX + inner * 0.18;
  const flagY3 = stemTop + inner * 0.3;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#4338ca"/>
  <g fill="white">
    <!-- Cabeza de la nota -->
    <ellipse cx="${cx}" cy="${cy}" rx="${headRx}" ry="${headRy}" transform="rotate(-15 ${cx} ${cy})"/>
    <!-- Plica -->
    <rect x="${stemX - inner * 0.025}" y="${stemTop}" width="${inner * 0.05}" height="${stemH}" rx="${inner * 0.025}"/>
    <!-- Corchete -->
    <path d="M${flagX1} ${flagY1} C${flagX2} ${flagY1}, ${flagX2} ${flagY2}, ${flagX3} ${flagY3}"
          stroke="white" stroke-width="${inner * 0.05}" fill="none" stroke-linecap="round"/>
  </g>
</svg>`.trim();
}

await sharp(Buffer.from(buildSvg(512))).png().toFile('public/icons/icon-512.png');
await sharp(Buffer.from(buildSvg(192))).png().toFile('public/icons/icon-192.png');

console.log('✓ public/icons/icon-192.png');
console.log('✓ public/icons/icon-512.png');
