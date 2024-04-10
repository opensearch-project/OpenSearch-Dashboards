/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function parseCspHeader(cspHeader: string) {
  const directives: string[] = cspHeader.split(';');

  return directives.reduce((accumulator, directive) => {
    const trimmed = directive.trim().split(' ');

    accumulator.set(trimmed[0], trimmed.slice(1));

    return accumulator;
  }, new Map<string, string[]>());
}

export function stringifyCspHeader(parsedCspHeader: Map<string, string[]>) {
  const strings: string[] = [];
  parsedCspHeader.forEach((values: string[], directive: string) => {
    strings.push(directive + ' ' + values.join(' '));
  });

  return strings.join('; ');
}
