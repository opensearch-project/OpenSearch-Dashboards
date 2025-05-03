/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(process.cwd(), 'ts_error_baseline.json');
const TSC_BIN = path.join(process.cwd(), 'node_modules/.bin/tsc');
const TSCONFIG_PATH = path.join(process.cwd(), 'tsconfig.check.json');

console.log('Running TypeScript compiler to capture current errors...');

// Helper to run TypeCheck with tsconfig.json
function runTypeCheck() {
  // Check if tsconfig.json exists
  if (!fs.existsSync(TSCONFIG_PATH)) {
    console.error(`Error: Could not find tsconfig.json at ${TSCONFIG_PATH}`);
    process.exit(1);
  }

  console.log(`Using TypeScript config: ${TSCONFIG_PATH}`);

  // Use project flag to specify tsconfig.json
  const args = ['--project', TSCONFIG_PATH, '--noEmit', '--pretty', 'false'];

  // Changed stdio to 'pipe' to capture output instead of 'inherit'
  const result = spawnSync(TSC_BIN, args, {
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe',
  });

  // Log the output to console
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  // Process doesn't throw an exception when there are type errors
  // Instead we need to check the exit code
  if (result.status === 0) {
    // Success - no errors
    console.log('No TypeScript errors found! Creating empty baseline.');
    return { errors: [] };
  } else {
    // Parse the error output to get structured error info
    const errors = [];
    const output = result.stderr || result.stdout || '';

    output.split('\n').forEach((line) => {
      const match = line.match(/(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5],
        });
      }
    });

    return { errors };
  }
}

// Main function
async function main() {
  // Get current errors
  const currentStatus = runTypeCheck();

  // Save to baseline
  fs.writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      {
        errors: currentStatus.errors,
        updatedAt: new Date().toISOString(),
        tsconfig: TSCONFIG_PATH, // Add reference to which tsconfig was used
      },
      null,
      2
    )
  );

  console.log(`✅ Baseline updated with ${currentStatus.errors.length} errors`);
}

main().catch((error) => {
  console.error('❌ Error updating TypeScript baseline:', error);
  process.exit(1);
});
