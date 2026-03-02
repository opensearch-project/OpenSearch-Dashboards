/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns a wrapped version of `fn` that retries on rejection.
 *
 * @param {Function} fn        The async function to wrap.
 * @param {Object}   options
 * @param {number}   options.maxAttempts  Total attempts (default: 3)
 * @param {number}   options.delay        Delay between attempts in ms (default: 1000)
 *  * @param {number}   options.delay        Delay between attempts in ms (default: 1000)
 */
export function retry<D>(
  fn: (...args: any[]) => Promise<D>,
  {
    maxAttempts,
    delay,
  }: {
    maxAttempts: number;
    delay: number;
  }
) {
  return async function retryingFn(...args: any[]) {
    let attempt = 0;
    while (true) {
      try {
        return await fn(...args);
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) {
          // Exhausted retries → rethrow last error
          throw err;
        }
        // Wait before next retry
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  };
}
