#!/usr/bin/env node
// Batch import Font Awesome Sharp SVGs into Figma as components
// Usage: node scripts/import-icons.js [--family sharp-solid] [--batch-size 15]

import { readFileSync, readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, basename } from 'path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const CLI = resolve(REPO_ROOT, 'src/index.js');
const ICON_SIZE = 16;
const GRID_GAP = 8;
const GRID_COLS = 20;

// Parse args
const args = process.argv.slice(2);
const familyIdx = args.indexOf('--family');
const family = familyIdx >= 0 ? args[familyIdx + 1] : 'sharp-solid';
const batchIdx = args.indexOf('--batch-size');
const BATCH_SIZE = batchIdx >= 0 ? parseInt(args[batchIdx + 1]) : 15;
const filterIdx = args.indexOf('--filter');
const filterFile = filterIdx >= 0 ? args[filterIdx + 1] : null;

const iconsDir = resolve(REPO_ROOT, 'icons', family);
if (!existsSync(iconsDir)) {
  console.error(`Icons directory not found: ${iconsDir}`);
  process.exit(1);
}

// Get list of icons to import
let iconFiles;
if (filterFile) {
  const names = readFileSync(filterFile, 'utf8').trim().split('\n');
  iconFiles = names.map(n => n.trim() + '.svg').filter(f => existsSync(resolve(iconsDir, f)));
} else {
  iconFiles = readdirSync(iconsDir).filter(f => f.endsWith('.svg'));
}

console.log(`Importing ${iconFiles.length} icons from ${family} (batch size: ${BATCH_SIZE})`);

function runEval(code) {
  try {
    const result = execSync(`node ${CLI} eval '${code.replace(/'/g, "\\'")}'`, {
      cwd: REPO_ROOT,
      timeout: 55000,
      encoding: 'utf8',
    });
    return result.trim();
  } catch (e) {
    console.error('Eval failed:', e.message?.slice(0, 200));
    return null;
  }
}

// Process in batches
for (let i = 0; i < iconFiles.length; i += BATCH_SIZE) {
  const batch = iconFiles.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(iconFiles.length / BATCH_SIZE);
  console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} icons)...`);

  // Build batch SVG data
  const svgData = batch.map(file => {
    const svg = readFileSync(resolve(iconsDir, file), 'utf8')
      .replace(/\n/g, ' ')
      .replace(/"/g, '\\"');
    const name = basename(file, '.svg');
    return { name, svg };
  });

  // Create all icons in one eval call
  const code = `
(async () => {
  const icons = ${JSON.stringify(svgData)};
  const results = [];
  const baseX = ${Math.floor(i / GRID_COLS) * 0 + (i % iconFiles.length < GRID_COLS ? 0 : 0)};

  for (let j = 0; j < icons.length; j++) {
    const idx = ${i} + j;
    const col = idx % ${GRID_COLS};
    const row = Math.floor(idx / ${GRID_COLS});
    const x = col * ${ICON_SIZE + GRID_GAP};
    const y = row * ${ICON_SIZE + GRID_GAP + 16};

    try {
      const node = figma.createNodeFromSvg(icons[j].svg);
      node.name = "icon/" + icons[j].name;
      node.resize(${ICON_SIZE}, ${ICON_SIZE});
      node.x = x;
      node.y = y;

      const comp = figma.createComponentFromNode(node);
      comp.name = "icon/" + icons[j].name;
      results.push(icons[j].name);
    } catch(e) {
      results.push("ERR:" + icons[j].name);
    }
  }

  return JSON.stringify({ok: results.filter(r => !r.startsWith("ERR:")).length, err: results.filter(r => r.startsWith("ERR:")).length});
})()
`;

  const result = runEval(code);
  if (result) {
    try {
      const parsed = JSON.parse(result);
      console.log(`  ✓ ${parsed.ok} created, ${parsed.err} errors`);
    } catch {
      console.log(`  Result: ${result.slice(0, 100)}`);
    }
  }
}

console.log('\nDone!');
