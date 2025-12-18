/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// A safe get function that blocks prototype access
export function safeGet(object, path, defaultValue) {
  const pathArray = Array.isArray(path) ? path : path.split('.');

  // Block dangerous prototype pollution paths
  const dangerousPaths = ['__proto__', 'constructor', 'prototype'];
  for (const segment of pathArray) {
    if (dangerousPaths.includes(segment)) {
      return defaultValue;
    }
  }

  // Use standard property access instead of lodash.get
  let result = object;
  for (const key of pathArray) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    // Only access own properties, not inherited ones
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      return defaultValue;
    }
    result = result[key];
  }
  return result !== undefined ? result : defaultValue;
}
