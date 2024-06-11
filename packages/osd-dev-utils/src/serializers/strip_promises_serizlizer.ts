/*
 * Copyright OpenSearch Contributors
 *  SPDX-License-Identifier: Apache-2.0
 */

export const createStripPromisesSerializer = () => ({
  serialize: (value: string) => value.replace(/("value": Promise) \{[^}]+}/gm, '$1 {}'),
  test: (value: any) => typeof value === 'string',
});
