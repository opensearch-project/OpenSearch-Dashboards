/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @param func The function to be debounced.
 * @param delay The time in milliseconds to wait before invoking the function again after the last invocation.
 * @param leading An optional parameter that, when true, allows the function to be invoked immediately upon the first call. 

 */
export const debounce = (func: Function, delay: number, leading?: boolean) => {
  let timerId: NodeJS.Timeout;

  return (...args: any) => {
    if (!timerId && leading) {
      func(...args);
    }
    clearTimeout(timerId);

    timerId = setTimeout(() => func(...args), delay);
  };
};
