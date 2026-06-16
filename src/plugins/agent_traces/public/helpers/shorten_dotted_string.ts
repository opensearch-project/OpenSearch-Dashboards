/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const DOT_PREFIX_RE = /(.).+?\./g;

/**
 * Convert a dot.notated.string into a short
 * version (d.n.string)
 */
export const shortenDottedString = (input: string) => input.replace(DOT_PREFIX_RE, '$1.');
