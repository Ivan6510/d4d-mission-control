// Generate simple PWA icons as SVG files
// For production, convert these to PNG using any SVG-to-PNG tool
const fs = require('fs');
const path = require('path');

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="24" fill="#0f172a"/>
  <text x="96" y="115" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="64" fill="#f97316">D4D</text>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#0f172a"/>
  <text x="256" y="300" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="160" fill="#f97316">D4D</text>
</svg>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-192.svg'), svg192);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-512.svg'), svg512);
console.log('SVG icons generated in public/');
