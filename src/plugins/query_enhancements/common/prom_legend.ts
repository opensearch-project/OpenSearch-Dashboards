/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const LEGEND_TOKEN = /\{\{\s*([\w:]+)\s*\}\}/g;

export function interpolateLegendFormat(template: string, metric: Record<string, string>): string {
  return template.replace(LEGEND_TOKEN, (_match, key: string) => {
    const value = metric[key];
    return value === undefined ? '' : value;
  });
}
