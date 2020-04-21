/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { matcherErrorMessage } from 'jest-matcher-utils';
import 'jest-extended'; // require to load jest-extended matchers

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
  // eslint-disable-next-line
  namespace jest {
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
