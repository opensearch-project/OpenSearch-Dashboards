/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const debounce = (func: Function, delay: number) => {
  let timerId: NodeJS.Timeout;

  return (...args: any) => {
    if (!timerId) {
      func(...args);
    }
    clearTimeout(timerId);

    timerId = setTimeout(() => func(...args), delay);
  };
};
