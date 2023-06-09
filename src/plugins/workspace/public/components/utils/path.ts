/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function join(base: string, ...paths: string[]) {
  const normalized = [base]
    .concat(...paths)
    .join('/')
    .split('/')
    .filter(Boolean)
    .join('/');
  if (base.startsWith('/')) {
    return `/${normalized}`;
  }
  return normalized;
}
