/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const TOKEN_OPEN = '{{';
const TOKEN_CLOSE = '}}';

export function interpolateLegendFormat(template: string, metric: Record<string, string>): string {
  let output = '';
  let cursor = 0;

  while (cursor < template.length) {
    const open = template.indexOf(TOKEN_OPEN, cursor);
    if (open === -1) {
      output += template.slice(cursor);
      break;
    }

    const close = template.indexOf(TOKEN_CLOSE, open + TOKEN_OPEN.length);
    if (close === -1) {
      output += template.slice(cursor);
      break;
    }

    output += template.slice(cursor, open);
    const label = template.slice(open + TOKEN_OPEN.length, close).trim();
    output += metric[label] ?? '';
    cursor = close + TOKEN_CLOSE.length;
  }

  return output;
}
