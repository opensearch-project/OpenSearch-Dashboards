/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function get(obj, path, defaultValue) {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  for (let i = 0; i < keys.length; i++) {
    if (result == null) {
      break;
    }
    result = result[keys[i]];
  }
  return result === undefined ? defaultValue : result;
}

export function isObject(obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function uniq(array) {
  return [...new Set(array)];
}

export function flattenDeep(array) {
  return array.reduce(
    (acc, cur) => (Array.isArray(cur) ? acc.concat(flattenDeep(cur)) : acc.concat(cur)),
    []
  );
}
