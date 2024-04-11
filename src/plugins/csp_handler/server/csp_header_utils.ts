/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// parse an input CSP header string into a Map where the key of the Map is the directive name
// and the value of the key is a string array of the directive values
export function parseCspHeader(cspHeader: string) {
  const directives: string[] = cspHeader.split(';');

  return directives.reduce((accumulator, directive) => {
    const trimmed = directive.trim().split(' ');

    accumulator.set(trimmed[0], trimmed.slice(1));

    return accumulator;
  }, new Map<string, string[]>());
}

// stringify a CSP header Map to a string
export function stringifyCspHeader(parsedCspHeader: Map<string, string[]>) {
  const directives: string[] = [];
  parsedCspHeader.forEach((values: string[], directive: string) => {
    directives.push(directive + ' ' + values.join(' '));
  });

  return directives.join('; ');
}
