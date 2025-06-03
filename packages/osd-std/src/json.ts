/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import JSON11 from 'json11';

export const stringify = (
  obj: any,
  replacer?: ((this: any, key: string, value: any) => any) | null,
  space?: string | number
): string => {
  let text;
  let numeralsAreNumbers = true;
  /* For better performance, instead of testing for existence of `replacer` on each value, two almost
   * identical functions are used.
   *
   * Note: Converting BigInt values to numbers, `Number()` is much faster that `parseInt()`. Since we
   * check the `type`, it is safe to just use `Number()`.
   */
  const checkForBigInts = replacer
    ? function (this: any, key: string, val: any) {
        if (typeof val === 'bigint') {
          numeralsAreNumbers = false;
          return replacer.call(this, key, Number(val));
        }
        return replacer.call(this, key, val);
      }
    : (key: string, val: any) => {
        if (typeof val === 'bigint') {
          numeralsAreNumbers = false;
          return Number(val);
        }
        return val;
      };

  /* While this is a check for possibly having BigInt values, if none were found, the results is
   * sufficient to fulfill the purpose of the function. However, if BigInt values were found, we will
   * use `stringifyObjectWithBigInts` to do this again.
   *
   * The goal was not to punish every object that doesn't have a BigInt with the more expensive
   * `stringifyObjectWithBigInts`. Those with BigInt values are also not unduly burdened because we
   * still need it in its string form to find a suitable marker.
   */
  text = JSON.stringify(obj, checkForBigInts, space);

  if (!numeralsAreNumbers) {
    const temp = JSON11.stringify(obj, {
      replacer,
      space,
      withBigInt: false,
      quote: '"',
      quoteNames: true,
    });
    if (temp) text = temp;
  }

  return text;
};

export const parse = (
  text: string,
  reviver?: ((this: any, key: string, value: any) => any) | null
): any => {
  let obj;
  let numeralsAreNumbers = true;
  const inspectValueForLargeNumerals = (val: any) => {
    if (
      numeralsAreNumbers &&
      typeof val === 'number' &&
      isFinite(val) &&
      (val < Number.MIN_SAFE_INTEGER || val > Number.MAX_SAFE_INTEGER)
    ) {
      numeralsAreNumbers = false;
    }

    // This function didn't have to have a return value but having it makes the rest cleaner
    return val;
  };

  /* For better performance, instead of testing for existence of `reviver` on each value, two almost
   * identical functions are used.
   */
  const checkForLargeNumerals = reviver
    ? function (this: any, key: string, val: any) {
        return inspectValueForLargeNumerals(reviver.call(this, key, val));
      }
    : (key: string, val: any) => inspectValueForLargeNumerals(val);

  /* While this is a check for possibly having BigInt values, if none were found, the results is
   * sufficient to fulfill the purpose of the function. However, if BigInt values were found, we will
   * use `stringifyObjectWithBigInts` to do this again.
   *
   * The goal was not to punish every object that doesn't have a BigInt with the more expensive
   * `stringifyObjectWithBigInts`. Those with BigInt values are also not unduly burdened because we
   * still need it in its string form to find a suitable marker.
   */
  obj = JSON.parse(text, checkForLargeNumerals);

  if (!numeralsAreNumbers) {
    const temp = JSON11.parse(text, reviver, { withLongNumerals: true });
    if (temp) obj = temp;
  }

  return obj;
};
