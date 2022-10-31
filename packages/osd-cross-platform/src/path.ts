/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalize } from 'path';

/**
 * Get a standardized reference to a path
 * @param {string} path - the path to standardize
 * @param {boolean} [usePosix=true] - produce a posix reference
 * @param {boolean} [escapedBackslashes=true] - on Windows, double-backslash the reference
 * @internal
 */
export const standardize = (
  path: string,
  usePosix: boolean = true,
  escapedBackslashes: boolean = true
) => {
  /* Force os-dependant separators
   * path.posix.normalize doesn't convert backslashes to slashes on Windows so we manually force it afterwards
   */
  const normal = normalize(path);

  // Filter out in-browser executions as well as non-windows ones
  if (process?.platform !== 'win32') return normal;

  if (usePosix) return normal.replace(/\\/g, '/');
  return escapedBackslashes ? normal.replace(/\\/g, '\\\\') : normal;
};
