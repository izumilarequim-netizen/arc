import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Master standard SVG icon (512x512)
const svgStandard = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#0d0d0d"/>
  <rect x="20" y="20" width="472" height="472" rx="80" stroke="#262626" stroke-width="4"/>
  
  <!-- Architectural Drafting Grid Elements -->
  <circle cx="256" cy="256" r="180" stroke="#1f1f1f" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="256" y1="60" x2="256" y2="452" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="60" y1="256" x2="452" y2="256" stroke="#1a1a1a" stroke-width="2"/>

  <!-- Stylized Geometric "A" for ARCDESIGN Construction -->
  <!-- Left Pillar -->
  <path d="M256 100 L120 400 H180 L256 220 L332 400 H392 L256 100Z" fill="#ffffff"/>
  
  <!-- Accent Red Crossbar / Steel Beam -->
  <path d="M165 295 H347 L360 335 H152 L165 295Z" fill="#d11a2a"/>

  <!-- Construction Ruler / Caliper Notch details -->
  <rect x="200" y="303" width="6" height="12" fill="#ffffff" rx="1"/>
  <rect x="230" y="303" width="6" height="12" fill="#ffffff" rx="1"/>
  <rect x="253" y="300" width="6" height="18" fill="#ffffff" rx="1"/>
  <rect x="276" y="303" width="6" height="12" fill="#ffffff" rx="1"/>
  <rect x="306" y="303" width="6" height="12" fill="#ffffff" rx="1"/>

  <!-- Apex Gold Dot -->
  <circle cx="256" cy="140" r="10" fill="#d11a2a"/>
</svg>
`;

// Maskable SVG with extra 18% padding so Android launcher circles/squircles don't clip the icon
const svgMaskable = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0d0d0d"/>
  
  <!-- Architectural Drafting Grid Elements (within safe zone) -->
  <circle cx="256" cy="256" r="150" stroke="#1f1f1f" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="256" y1="90" x2="256" y2="422" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="90" y1="256" x2="422" y2="256" stroke="#1a1a1a" stroke-width="2"/>

  <!-- Scaled "A" to fit cleanly inside Android safe zone (inner 75%) -->
  <g transform="translate(256 256) scale(0.78) translate(-256 -256)">
    <!-- Main "A" -->
    <path d="M256 100 L120 400 H180 L256 220 L332 400 H392 L256 100Z" fill="#ffffff"/>
    
    <!-- Accent Red Crossbar / Steel Beam -->
    <path d="M165 295 H347 L360 335 H152 L165 295Z" fill="#d11a2a"/>

    <!-- Construction Caliper markings -->
    <rect x="200" y="303" width="6" height="12" fill="#ffffff" rx="1"/>
    <rect x="230" y="303" width="6" height="12" fill="#ffffff" rx="1"/>
    <rect x="253" y="300" width="6" height="18" fill="#ffffff" rx="1"/>
    <rect x="276" y="303" width="6" height="12" fill="#ffffff" rx="1"/>
    <rect x="306" y="303" width="6" height="12" fill="#ffffff" rx="1"/>

    <!-- Apex Dot -->
    <circle cx="256" cy="140" r="10" fill="#d11a2a"/>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgStandard);

  // Generate standard 192x192
  await sharp(Buffer.from(svgStandard))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate standard 512x512
  await sharp(Buffer.from(svgStandard))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate maskable 512x512
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // Generate Apple touch icon 180x180
  await sharp(Buffer.from(svgStandard))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon 64x64 PNG
  await sharp(Buffer.from(svgStandard))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
