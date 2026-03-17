/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-restricted-syntax */
/**
 * Parses JUnit XML reports and writes a Markdown failure summary to
 * $GITHUB_STEP_SUMMARY (if set) or stdout. Designed for use in CI pipelines
 * so that AI agents and humans can quickly identify failing tests without
 * reading raw logs.
 *
 * Usage:
 *   node scripts/summarize_jest_failures.js [--dir=<path>]
 *
 * Options:
 *   --dir=<path>  Directory containing JUnit XML files (default: target/junit)
 */

const fs = require('fs');
const path = require('path');

// Parse optional --dir argument
const dirArg = process.argv.find((a) => a.startsWith('--dir='));
const junitDir = path.resolve(dirArg ? dirArg.slice(6) : path.join(__dirname, '../target/junit'));

function findXmlFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findXmlFiles(full, results);
    else if (entry.name.endsWith('.xml')) results.push(full);
  }
  return results;
}

/**
 * Minimal XML attribute extractor — avoids a heavy XML parser dependency.
 * Reads attributes from an opening tag string.
 */
function attrs(tag) {
  const result = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(tag)) !== null) result[m[1]] = m[2];
  return result;
}

/**
 * Extracts all <failure> messages from a testcase block.
 * Strips CDATA wrappers and trims whitespace.
 */
function extractFailureText(block) {
  const messages = [];
  const re = /<failure[^>]*>([\s\S]*?)<\/failure>/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    messages.push(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
  }
  return messages;
}

/**
 * Parse a single JUnit XML file, returning an array of failure objects.
 * Each failure: { suite, name, classname, time, messages[] }
 */
function parseFile(filePath) {
  const xml = fs.readFileSync(filePath, 'utf-8');
  const failures = [];

  // Match each <testcase ...>...</testcase> block
  const tcRe = /<testcase((?:\s+\w+="[^"]*")+)\s*\/?>([\s\S]*?)<\/testcase>/gi;
  let m;
  while ((m = tcRe.exec(xml)) !== null) {
    const block = m[2];
    // Only care about testcases that have <failure>
    if (!/<failure/i.test(block)) continue;
    const a = attrs(m[1]);
    const messages = extractFailureText(block);
    if (messages.length > 0) {
      failures.push({
        suite: path.relative(junitDir, filePath),
        name: a.name || '(unnamed)',
        classname: a.classname || '',
        time: a.time || '',
        messages,
      });
    }
  }
  return failures;
}

function truncate(str, maxLines = 10) {
  const lines = str.split('\n');
  if (lines.length <= maxLines) return str;
  return lines.slice(0, maxLines).join('\n') + `\n  … (${lines.length - maxLines} more lines)`;
}

function buildMarkdown(allFailures) {
  if (allFailures.length === 0) {
    return '## ✅ All Jest Tests Passed\n\nNo failures detected in JUnit reports.\n';
  }

  const lines = [`## ❌ ${allFailures.length} Jest Test Failure(s)\n`];

  // Group by suite file
  const bySuite = new Map();
  for (const f of allFailures) {
    if (!bySuite.has(f.suite)) bySuite.set(f.suite, []);
    bySuite.get(f.suite).push(f);
  }

  for (const [suite, failures] of bySuite) {
    lines.push(`### 📄 \`${suite}\``);
    for (const f of failures) {
      const timeStr = f.time ? ` *(${f.time}s)*` : '';
      lines.push(`\n**❌ ${f.name}**${timeStr}`);
      if (f.classname) lines.push(`> ${f.classname}`);
      for (const msg of f.messages) {
        const truncated = truncate(msg);
        lines.push('```');
        lines.push(truncated);
        lines.push('```');
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `*${allFailures.length} failure(s) across ${bySuite.size} suite(s). Full XML reports are in the \`junit-jest-*\` artifacts.*`
  );

  return lines.join('\n');
}

// Main
const xmlFiles = findXmlFiles(junitDir);

if (xmlFiles.length === 0) {
  // Nothing to report — possibly tests didn't run or CI=false suppressed XML output
  process.exit(0);
}

const allFailures = xmlFiles.flatMap(parseFile);
const markdown = buildMarkdown(allFailures);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, markdown + '\n', 'utf-8');
} else {
  process.stdout.write(markdown + '\n');
}
