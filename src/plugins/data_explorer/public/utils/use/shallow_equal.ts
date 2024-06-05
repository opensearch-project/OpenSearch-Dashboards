/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple shallow equal function that can ignore specified keys
export function shallowEqual(object1: any, object2: any, ignoreKeys: any) {
  const keys1 = Object.keys(object1).filter((key) => !ignoreKeys.includes(key));
  const keys2 = Object.keys(object2).filter((key) => !ignoreKeys.includes(key));

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}
