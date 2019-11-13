import { matcherErrorMessage } from 'jest-matcher-utils';

// ensure this is parsed as a module.
export {};

/**
 * Final Matcher type with `this` and `received` args removed from jest matcher function
 */
type MatcherParameters<T extends (this: any, received: any, ...args: any[]) => any> = T extends (
  this: any,
  received: any,
  ...args: infer P
) => any
  ? P
  : never;

declare global {
  namespace jest { // eslint-disable-line
    interface Matchers<R> {
      /**
       * Expect array to be filled with value, and optionally length
       */
      toEqualArrayOf(...args: MatcherParameters<typeof toEqualArrayOf>): R;
    }
  }
}

/**
 * Expect array to be filled with value, and optionally length
 */
function toEqualArrayOf(this: jest.MatcherUtils, received: any[], value: any, length?: number) {
  const matcherName = 'toEqualArrayOf';

  if (!Array.isArray(received)) {
    throw new Error(
      matcherErrorMessage(
        this.utils.matcherHint(matcherName),
        `${this.utils.RECEIVED_COLOR('received')} value must be an array.`,
        `Received type: ${typeof received}`,
      ),
    );
  }

  const receivedPretty = this.utils.printReceived(received);
  const elementCheck = received.every((v) => v === value);
  const lengthCheck = length === undefined || received.length === length;

  if (!lengthCheck) {
    return {
      pass: false,
      message: () => `expected array length to be ${length} but got ${received.length}`,
    };
  }

  if (!elementCheck) {
    return {
      pass: false,
      message: () => `expected ${receivedPretty} to be an array of ${value}'s`,
    };
  }

  return {
    pass: true,
    message: () => `expected ${receivedPretty} not to be an array of ${value}'s`,
  };
}

expect.extend({
  toEqualArrayOf,
});
