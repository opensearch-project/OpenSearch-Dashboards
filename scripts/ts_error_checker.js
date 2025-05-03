/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

const BASELINE_FILE = path.join(process.cwd(), 'ts_error_baseline.json');
const TSC_BIN = path.join(process.cwd(), 'node_modules/.bin/tsc');
const TSCONFIG_PATH = path.join(process.cwd(), 'tsconfig.check.json');

console.log(
  `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.bold}TypeScript Error Checker${colors.reset}`);
console.log(
  `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(
  `\n${colors.cyan}▶ ${colors.reset}Running TypeScript compiler to check for new errors...\n`
);

// Load baseline errors
function loadBaseline() {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      const content = fs.readFileSync(BASELINE_FILE, 'utf8');
      const baseline = JSON.parse(content);
      console.log(`${colors.blue}ℹ ${colors.reset}Loaded baseline from ${BASELINE_FILE}`);
      console.log(
        `${colors.blue}ℹ ${colors.reset}Baseline contains ${colors.bold}${baseline.errors.length}${colors.reset} known errors`
      );
      return baseline.errors;
    } else {
      console.warn(`${colors.yellow}⚠ ${colors.reset}Baseline file not found at ${BASELINE_FILE}.`);
      console.warn(`${colors.yellow}⚠ ${colors.reset}All errors will be treated as new.`);
      return [];
    }
  } catch (error) {
    console.error(`${colors.red}✖ ${colors.reset}Error loading baseline: ${error.message}`);
    process.exit(1);
  }
}

// Helper to run TypeScript compiler and get structured output
function getCurrentErrors() {
  // Check if tsconfig.json exists
  if (!fs.existsSync(TSCONFIG_PATH)) {
    console.error(`Error: Could not find tsconfig.json at ${TSCONFIG_PATH}`);
    process.exit(1);
  }

  console.log(`Using TypeScript config: ${TSCONFIG_PATH}`);

  const args = ['--project', TSCONFIG_PATH, '--noEmit', '--pretty', 'false'];

  console.log(`${colors.cyan}▶ ${colors.reset}Executing: ${TSC_BIN} ${args.join(' ')}\n`);

  const result = spawnSync(TSC_BIN, args, {
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe',
  });

  // Process doesn't throw an exception when there are type errors
  // Instead we need to check the exit code
  if (result.status === 0) {
    // Success - no errors
    console.log(
      `${colors.green}✓ ${colors.reset}${colors.bold}No TypeScript errors found!${colors.reset}`
    );
    return [];
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

    console.log(
      `${colors.blue}ℹ ${colors.reset}Found ${colors.bold}${errors.length}${colors.reset} TypeScript errors in current codebase`
    );
    return errors;
  }
}

// Check if an error is new or already in the baseline
function isNewError(error, baselineErrors) {
  // An error is considered the same if it has the same file, code, line, and column
  // If you touch it, you should fix it!
  return !baselineErrors.some(
    (baselineError) =>
      baselineError.file === error.file &&
      baselineError.code === error.code &&
      baselineError.line === error.line &&
      baselineError.column === error.column
  );
}

// Format an error for nice display
function formatError(error, index) {
  return [
    `  ${colors.bold}${index + 1}.${colors.reset} ${colors.red}${error.file}:${error.line}:${
      error.column
    }${colors.reset}`,
    `     ${colors.yellow}Error ${error.code}:${colors.reset} ${error.message}`,
  ].join('\n');
}

// Main function
async function main() {
  console.log('\n');

  // Get baseline errors
  const baselineErrors = loadBaseline();
  console.log('');

  // Get current errors
  const currentErrors = getCurrentErrors();
  console.log('');

  // Find new errors (not in baseline)
  const newErrors = currentErrors.filter((error) => isNewError(error, baselineErrors));

  if (newErrors.length === 0) {
    console.log(
      `${colors.green}✓ ${colors.reset}${colors.bold}SUCCESS:${colors.reset} No new TypeScript errors detected!`
    );

    if (currentErrors.length > 0) {
      console.log(
        `${colors.blue}ℹ ${colors.reset}${currentErrors.length} existing errors found (already in baseline)`
      );
    }

    console.log(
      `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    process.exit(0); // Success
  } else {
    console.error(
      `${colors.red}✖ ${colors.reset}${colors.bold}FAILURE:${colors.reset} Found ${newErrors.length} new TypeScript errors:\n`
    );

    // Print new errors in a nice format
    newErrors.forEach((error, index) => {
      console.error(formatError(error, index));
      if (index < newErrors.length - 1) console.error('');
    });

    console.error('\n');
    console.error(
      `${colors.red}✖ ${colors.reset}${colors.bold}Build failed due to new TypeScript errors.${colors.reset}`
    );
    console.error(
      `${colors.yellow}ℹ ${colors.reset}To update the baseline, run the baseline update script.`
    );
    console.error(
      `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );

    process.exit(1); // Failure
  }
}

main().catch((error) => {
  console.error(
    `${colors.red}✖ ${colors.reset}${colors.bold}ERROR:${colors.reset} Failed to check TypeScript errors`
  );
  console.error(`  ${error.message}`);
  process.exit(1);
});
