/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare module 'raf-debounce' {
  const debounce: <T extends (...args: any[]) => any>(fn: T) => T;
  // eslint-disable-next-line import/no-default-export
  export default debounce;
}
