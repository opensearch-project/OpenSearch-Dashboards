/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */

// @ts-check
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

const TSC_BIN = path.join(process.cwd(), 'node_modules/.bin/tsc');
const TSCONFIG_PATH = path.join(process.cwd(), 'tsconfig.check.json');
const TSC_ARGS = ['--project', TSCONFIG_PATH, '--noEmit', '--pretty', 'false', '--skipLibCheck'];

// Helper functions for console output
function logHeader(text) {
  console.log(
    `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
  );
  console.log(`${colors.bold}${text}${colors.reset}`);
  console.log(
    `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
  );
}

function logStep(message) {
  console.log(`${colors.cyan}▶ ${colors.reset}${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${colors.reset}${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${colors.reset}${message}`);
}

function logError(message) {
  console.error(`${colors.red}✖ ${colors.reset}${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${colors.reset}${message}`);
}

// Parse TypeScript error output into structured format
function parseTypeScriptErrors(output) {
  const errors = [];
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
  return errors;
}

// Run TypeScript compiler and get structured output
function runTypeScriptCheck() {
  // Check if tsconfig.json exists
  if (!fs.existsSync(TSCONFIG_PATH)) {
    logError(`Could not find tsconfig.json at ${TSCONFIG_PATH}`);
    process.exit(1);
  }

  console.log(`Using TypeScript config: ${TSCONFIG_PATH}`);
  logStep(`Executing: ${TSC_BIN} ${TSC_ARGS.join(' ')}\n`);

  const result = spawnSync(TSC_BIN, TSC_ARGS, {
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe',
  });

  // Process doesn't throw an exception when there are type errors
  // Instead we need to check the exit code
  if (result.status === 0) {
    // Success - no errors
    logSuccess(`${colors.bold}No TypeScript errors found!${colors.reset}`);
    return [];
  } else {
    // Parse the error output to get structured error info
    const output = result.stderr || result.stdout || '';
    const errors = parseTypeScriptErrors(output);
    logInfo(
      `Found ${colors.bold}${errors.length}${colors.reset} TypeScript errors in current codebase`
    );
    return errors;
  }
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

// Group errors by file
function groupErrorsByFile(errors) {
  const errorsByFile = {};
  errors.forEach((error) => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });
  return errorsByFile;
}

// Add standard ts-expect-error comments to files
async function addTsExpectErrorComments(errors) {
  logStep('Adding @ts-expect-error comments to files...');

  const errorsByFile = groupErrorsByFile(errors);
  const modifiedFiles = [];

  for (const file of Object.keys(errorsByFile)) {
    try {
      const errorsByLine = {};
      errorsByFile[file].forEach((error) => {
        if (!errorsByLine[error.line]) {
          errorsByLine[error.line] = [];
        }
        if (!errorsByLine[error.line].some((e) => e.code === error.code)) {
          errorsByLine[error.line].push(error);
        }
      });

      const lineNumbers = Object.keys(errorsByLine)
        .map(Number)
        .sort((a, b) => b - a);

      let content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (const lineNum of lineNumbers) {
        if (lineNum > 1 && !lines[lineNum - 2].includes('@ts-expect-error')) {
          const errorCodes = errorsByLine[lineNum].map((e) => e.code).join(', ');
          // Start with standard comment format
          const commentLine = `// @ts-expect-error ${errorCodes} TODO(ts-error): fixme`;
          lines.splice(lineNum - 1, 0, commentLine);
        }
      }

      fs.writeFileSync(file, lines.join('\n'), 'utf8');
      logSuccess(`Added comments to ${file}`);
      modifiedFiles.push(file);
    } catch (err) {
      logError(`Error processing ${file}: ${err.message}`);
    }
  }

  // Verify if the comments fixed the errors by running TypeScript again
  logStep('Verifying if comments fixed the errors...');
  const remainingErrors = runTypeScriptCheck();

  // Convert line comments to JSX comments for files that still have errors
  if (remainingErrors.length > 0) {
    logStep('Some errors remain. Converting to JSX comments where needed...');
    convertToJsxComments(remainingErrors);
  }

  // Run ESLint to fix indentation
  if (modifiedFiles.length > 0) {
    runEslintFix(modifiedFiles);
  }

  logSuccess('Finished adding @ts-expect-error comments');
  return modifiedFiles;
}

// Convert standard comments to JSX comments only for lines that still have errors
function convertToJsxComments(errors) {
  const errorsByFile = groupErrorsByFile(errors);

  for (const file of Object.keys(errorsByFile)) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      const commentLines = new Set();
      errorsByFile[file].forEach((error) => {
        // The comment should be on the line before the error
        commentLines.add(error.line - 1);
      });

      for (let i = 0; i < lines.length; i++) {
        if (commentLines.has(i + 1) && lines[i].includes('// @ts-expect-error')) {
          const commentText = lines[i].replace('// @ts-expect-error', '@ts-expect-error');
          lines[i] = `{/* ${commentText.trim()} */}`;
          modified = true;
          logInfo(`Converting comment on line ${i + 1} in ${file} to JSX format`);
        }
      }

      if (modified) {
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
        logSuccess(`Converted specific comments to JSX format in ${file}`);
      }
    } catch (err) {
      logError(`Error processing ${file}: ${err.message}`);
    }
  }
}

// Run ESLint to fix indentation
function runEslintFix(files) {
  logStep('Running ESLint to fix indentation...');
  try {
    const eslintArgs = ['lint:es', '--fix', ...files];

    const result = spawnSync('yarn', eslintArgs, {
      encoding: 'utf8',
      shell: true,
      stdio: 'pipe',
    });

    if (result.status === 0) {
      logSuccess('ESLint formatting completed successfully');
    } else {
      logWarning('ESLint formatting completed with warnings');
    }
  } catch (err) {
    logError(`Error running ESLint: ${err.message}`);
  }
}

// Main function
async function main() {
  logHeader('TypeScript Error Checker');
  logStep('Running TypeScript compiler to check for new errors...');

  const args = process.argv.slice(2);
  const shouldAddComments = args.includes('--add-ts-expect-error');
  const currentErrors = runTypeScriptCheck();

  if (shouldAddComments && currentErrors.length > 0) {
    await addTsExpectErrorComments(currentErrors);
    console.log('\nPlease run the TypeScript check again to verify errors are resolved.');
    process.exit(0);
  }

  if (currentErrors.length === 0) {
    logSuccess(`${colors.bold}SUCCESS:${colors.reset} No TypeScript errors detected!`);
    console.log(
      `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    process.exit(0); // Success
  } else {
    logError(
      `${colors.bold}FAILURE:${colors.reset} Found ${currentErrors.length} TypeScript errors:\n`
    );

    // Print errors in a nice format
    currentErrors.forEach((error, index) => {
      console.error(formatError(error, index));
      if (index < currentErrors.length - 1) console.error('');
    });

    console.error('\n');
    logError(`${colors.bold}Build failed due to TypeScript errors.${colors.reset}`);
    logWarning(
      'To automatically add @ts-expect-error comments, run with --add-ts-expect-error flag.'
    );
    console.error(
      `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );

    process.exit(1); // Failure
  }
}

main().catch((error) => {
  logError(`${colors.bold}ERROR:${colors.reset} Failed to check TypeScript errors`);
  console.error(`  ${error.message}`);
  process.exit(1);
});
