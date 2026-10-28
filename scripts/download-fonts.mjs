import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = path.resolve(__dirname, '../public/fonts');

const FONTS = [
  {
    name: 'PPNeueMontreal-Medium.woff2',
    url: 'https://a24.raviklaassens.com/fonts/PPNeueMontreal-Medium.woff2',
    expectedMinBytes: 80000
  },
  {
    name: 'PPEiko-Regular.woff2',
    url: 'https://a24.raviklaassens.com/fonts/PPEiko-Regular.woff2',
    expectedMinBytes: 110000
  },
  {
    name: 'PPMuseum-Regular.woff2',
    url: 'https://a24.raviklaassens.com/fonts/PPMuseum-Regular.woff2',
    expectedMinBytes: 45000
  }
];

async function downloadFonts() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const font of FONTS) {
    const dest = path.join(targetDir, font.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size >= font.expectedMinBytes) {
      console.log(`[fonts] ${font.name} already exists (${fs.statSync(dest).size} bytes), skipping.`);
      continue;
    }

    console.log(`[fonts] Fetching ${font.name} from ${font.url}...`);
    const res = await fetch(font.url);
    if (!res.ok) {
      throw new Error(`Failed to download ${font.name}: HTTP ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < font.expectedMinBytes) {
      throw new Error(`Downloaded ${font.name} is undersized (${buffer.length} bytes < expected ${font.expectedMinBytes})`);
    }

    fs.writeFileSync(dest, buffer);
    console.log(`[fonts] Successfully saved ${font.name} (${buffer.length} bytes).`);
  }
}

downloadFonts().catch(err => {
  console.error('[fonts] Error during font acquisition:', err);
  process.exit(1);
});
