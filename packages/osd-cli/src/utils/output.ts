/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Console output helpers with ANSI color codes and formatting utilities.
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

export function green(text: string): string {
  return `${GREEN}${text}${RESET}`;
}

export function red(text: string): string {
  return `${RED}${text}${RESET}`;
}

export function yellow(text: string): string {
  return `${YELLOW}${text}${RESET}`;
}

export function blue(text: string): string {
  return `${BLUE}${text}${RESET}`;
}

export function cyan(text: string): string {
  return `${CYAN}${text}${RESET}`;
}

export function bold(text: string): string {
  return `${BOLD}${text}${RESET}`;
}

export function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

/**
 * Print a status line with a colored tag.
 */
export function printStatus(
  tag: string,
  message: string,
  color: 'green' | 'red' | 'yellow' | 'blue' = 'green'
): void {
  const colorFn = { green, red, yellow, blue }[color];
  console.log(`  ${colorFn(`[${tag}]`)} ${message}`);
}

/**
 * Print a formatted table to the console.
 */
export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const separator = colWidths.map((w) => '-'.repeat(w + 2)).join('+');
  const formatRow = (row: string[]) =>
    row.map((cell, i) => ` ${(cell || '').padEnd(colWidths[i])} `).join('|');

  console.log(formatRow(headers));
  console.log(separator);
  rows.forEach((row) => console.log(formatRow(row)));
}

/**
 * Render a unified diff with color-coded +/- prefixes.
 */
export function renderDiff(diffText: string): string {
  const lines = diffText.split('\n');
  return lines
    .map((line) => {
      if (line.startsWith('+')) return green(line);
      if (line.startsWith('-')) return red(line);
      if (line.startsWith('@@')) return cyan(line);
      return dim(line);
    })
    .join('\n');
}

/**
 * Print a section header.
 */
export function printHeader(text: string): void {
  console.log(`\n${bold(blue(text))}`);
  console.log(dim('─'.repeat(text.length + 4)));
}

/**
 * Print an error message.
 */
export function printError(message: string): void {
  console.error(`${red('ERROR:')} ${message}`);
}

/**
 * Print a warning message.
 */
export function printWarning(message: string): void {
  console.warn(`${yellow('WARN:')} ${message}`);
}

/**
 * Print a success message.
 */
export function printSuccess(message: string): void {
  console.log(`${green('OK:')} ${message}`);
}
