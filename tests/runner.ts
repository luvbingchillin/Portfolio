/**
 * Master E2E Test Suite Runner for Athenaeum 3D Portfolio
 * Executes all 4 tiers across all 12 features and generates an executive summary report.
 *
 * Usage:
 *   node tests/runner.ts
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface TierConfig {
  tier: string;
  name: string;
  dir: string;
}

const TIERS: TierConfig[] = [
  {
    tier: 'Tier 1',
    name: 'Feature Coverage (>=5 per feature)',
    dir: path.join(__dirname, 'tier1-features')
  },
  {
    tier: 'Tier 2',
    name: 'Boundary & Corner Cases (>=5 per feature)',
    dir: path.join(__dirname, 'tier2-boundary')
  },
  {
    tier: 'Tier 3',
    name: 'Cross-Feature Pairwise Interactions',
    dir: path.join(__dirname, 'tier3-cross-feature')
  },
  {
    tier: 'Tier 4',
    name: 'Real-World Application E2E Scenarios',
    dir: path.join(__dirname, 'tier4-application')
  }
];

function getTestFiles(): { tier: string; file: string }[] {
  const allFiles: { tier: string; file: string }[] = [];

  for (const t of TIERS) {
    if (fs.existsSync(t.dir)) {
      const files = fs.readdirSync(t.dir)
        .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'))
        .sort()
        .map(f => ({ tier: t.tier, file: path.join(t.dir, f) }));
      allFiles.push(...files);
    }
  }

  return allFiles;
}

async function main() {
  const startTime = Date.now();
  console.log('\n================================================================');
  console.log('🏛️  ATHENAEUM 3D PORTFOLIO — 4-TIER E2E TEST SUITE RUNNER');
  console.log('================================================================');
  console.log(`Node.js: ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}`);
  console.log(`Directory: ${projectRoot}\n`);

  const testFileEntries = getTestFiles();
  const testFiles = testFileEntries.map(e => e.file);

  console.log(`Discovered ${testFiles.length} test files across 4 tiers:`);
  TIERS.forEach(t => {
    const count = testFileEntries.filter(e => e.tier === t.tier).length;
    console.log(`  • ${t.tier} (${t.name}): ${count} suites`);
  });
  console.log('----------------------------------------------------------------\n');

  let passedTests = 0;
  let failedTests = 0;
  let totalTests = 0;

  const testStream = run({
    files: testFiles,
    concurrency: false
  });

  // Tap into events for statistics
  testStream.on('test:pass', (info) => {
    // Only count leaf tests (not wrapper describe suites if any)
    if (!info.nesting || info.nesting > 0) {
      passedTests++;
      totalTests++;
    }
  });

  testStream.on('test:fail', (_info) => {
    failedTests++;
    totalTests++;
  });

  // Pipe formatted spec output to stdout
  testStream.compose(new spec()).pipe(process.stdout);

  testStream.on('end', () => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================');
    console.log('📊 EXECUTIVE TEST SUMMARY REPORT');
    console.log('================================================================');
    console.log(`Total Test Assertions: ${totalTests}`);
    console.log(`Passed:                ${passedTests} ✅`);
    console.log(`Failed:                ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
    console.log(`Pass Rate:             ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`Total Execution Time:  ${elapsedSec}s`);
    console.log('================================================================');

    if (failedTests > 0) {
      console.error(`\n❌ Test run failed with ${failedTests} failure(s).`);
      process.exit(1);
    } else {
      console.log('\n✅ ALL 4 TIERS PASSED WITH 100% SUCCESS.');
      process.exit(0);
    }
  });
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
