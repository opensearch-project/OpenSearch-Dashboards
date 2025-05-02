/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASELINE_FILE = path.join(process.cwd(), 'ts_error_baseline.json');
const TSC_BIN = path.join(process.cwd(), 'node_modules/.bin/tsc');

// Helper to run TypeScript compiler and get structured output
function runTypeCheck(specificFiles = null) {
  console.log('Running TypeScript type checker...');

  const args = ['--incremental', '--noEmit', '--pretty', 'false'];

  // If specific files are provided, add them to the command
  if (specificFiles && specificFiles.length > 0) {
    console.log(`Checking ${specificFiles.length} modified files...`);
    args.push(...specificFiles);
  } else {
    console.log('Checking all TypeScript files...');
  }

  try {
    const result = spawnSync(TSC_BIN, args, {
      encoding: 'utf8',
      shell: true,
      stdio: 'pipe',
    });

    // Parse the result
    const checkedFiles = result.stdout
      .split('\n')
      .filter((line) => line.trim().length > 0 && line.endsWith('.ts'));

    // Success - no errors
    return {
      success: true,
      checkedFiles,
      errors: [],
    };
  } catch (error) {
    // Parse the error output to get structured error info
    const errors = [];
    if (error.stderr) {
      error.stderr.split('\n').forEach((line) => {
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
    }

    const checkedFiles = error.stdout
      .split('\n')
      .filter((line) => line.trim().length > 0 && line.endsWith('.ts'));

    return {
      success: false,
      checkedFiles,
      errors,
    };
  }
}

// Get git status to find modified files
function getModifiedFiles() {
  try {
    const result = execSync('git ls-files --modified --others --exclude-standard', {
      encoding: 'utf8',
    });

    const modifiedFiles = result
      .split('\n')
      .filter((file) => file.trim().length > 0)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

    console.log(`Found ${modifiedFiles.length} modified TypeScript files.`);
    return modifiedFiles;
  } catch (error) {
    console.warn('⚠️ Could not get git status. Falling back to checking all files.');
    return null;
  }
}

// Main function
async function main() {
  // Load baseline if it exists
  let baseline = {};
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Could not parse baseline file. Creating a new one.');
      baseline = { errors: [] };
    }
  } else {
    console.log('⚠️ No baseline found. Creating a new one.');
    baseline = { errors: [] };
  }

  // First run - create baseline if needed
  if (!baseline.errors || !Array.isArray(baseline.errors)) {
    console.log('📝 Creating initial baseline...');
    // For initial baseline, check all files
    const currentStatus = runTypeCheck();
    fs.writeFileSync(
      BASELINE_FILE,
      JSON.stringify(
        {
          errors: currentStatus.errors,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    console.log(`✅ Baseline created with ${currentStatus.errors.length} errors`);
    process.exit(0);
  }

  // Get modified files for incremental checking
  const modifiedFiles = getModifiedFiles();

  // Get the current status - only check modified files if available
  const currentStatus = runTypeCheck(modifiedFiles);

  // Compare with baseline to find new errors
  const baselineErrors = new Map();
  baseline.errors.forEach((error) => {
    const key = `${error.file}:${error.code}`;
    baselineErrors.set(key, error);
  });

  const newErrors = currentStatus.errors.filter((error) => {
    const key = `${error.file}:${error.code}`;
    return !baselineErrors.has(key);
  });

  if (newErrors.length > 0) {
    console.error('❌ New TypeScript errors detected:');
    newErrors.forEach((error) => {
      console.error(
        `- ${error.file}(${error.line},${error.column}): error ${error.code}: ${error.message}`
      );
    });
    console.error('\nFix these new errors or update the baseline with:');
    console.error('  npm run update-ts-baseline');
    process.exit(1);
  } else {
    // Check if we've fixed any errors
    const fixedErrors = [];

    // Only consider files that we actually checked as fixed
    const checkedFileSet = new Set(currentStatus.checkedFiles);

    baselineErrors.forEach((error, key) => {
      // Only consider errors fixed if the file was actually checked
      const fileWasChecked =
        modifiedFiles === null ||
        checkedFileSet.has(error.file) ||
        modifiedFiles.some((f) => error.file.endsWith(f));

      if (fileWasChecked && !currentStatus.errors.some((e) => `${e.file}:${e.code}` === key)) {
        fixedErrors.push(error);
      }
    });

    if (fixedErrors.length > 0) {
      console.log(`✅ Good job! You've fixed ${fixedErrors.length} TypeScript errors!`);
    }

    const remainingErrors = currentStatus.errors.length;
    console.log(`✅ No new TypeScript errors introduced!`);
    if (modifiedFiles !== null) {
      console.log(`Checked ${modifiedFiles.length} modified files.`);
    }
    console.log(`(${remainingErrors} existing errors in baseline)`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Error running TypeScript check:', error);
  process.exit(1);
});
