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

import { integerSnap, monotonicHillClimb } from './calcs';

describe('monotonicHillClimb', () => {
  const arbitraryNumber = 27;

  describe('continuous functions', () => {
    test('linear case', () => {
      expect(monotonicHillClimb((n: number) => n, 100, arbitraryNumber)).toBeCloseTo(arbitraryNumber, 6);
    });

    test('flat case should yield `maxVar`', () => {
      expect(monotonicHillClimb(() => arbitraryNumber, 100, 50)).toBeCloseTo(100, 6);
    });

    test('nonlinear case', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n), Math.PI / 2, Math.sqrt(2) / 2)).toBeCloseTo(Math.PI / 4, 6);
    });

    test('non-compliant for even `minVar` should yield NaN', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n), Math.PI / 2, -1)).toBeNaN();
    });

    test('`loVar > hiVar` should yield NaN', () => {
      expect(
        monotonicHillClimb(
          (n: number) => Math.sin(n),
          1,
          arbitraryNumber,
          (n: number) => n,
          2,
        ),
      ).toBeNaN();
    });

    test('compliant for `maxVar` should yield `maxVar`', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n), Math.PI / 2, 1)).toBeCloseTo(Math.PI / 2, 6);
    });

    test('`loVar === hiVar`, compliant', () => {
      expect(
        monotonicHillClimb(
          (n: number) => Math.sin(n),
          Math.PI / 2,
          1,
          (n: number) => n,
          Math.PI / 2,
        ),
      ).toBe(Math.PI / 2);
    });

    test('`loVar === hiVar`, non-compliant', () => {
      expect(
        monotonicHillClimb(
          (n: number) => Math.sin(n),
          Math.PI / 2,
          Math.sqrt(2) / 2,
          (n: number) => n,
          Math.PI / 2,
        ),
      ).toBeNaN();
    });
  });

  describe('integral domain functions', () => {
    test('linear case', () => {
      expect(monotonicHillClimb((n: number) => n, 100, arbitraryNumber, integerSnap)).toBe(arbitraryNumber);
    });

    test('flat case should yield `maxVar`', () => {
      expect(monotonicHillClimb(() => arbitraryNumber, 100, 50)).toBe(100);
    });

    test('nonlinear case', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, Math.sqrt(2) / 2, integerSnap)).toBe(7);
    });

    test('non-compliant for even `minVar` should yield NaN', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n), Math.PI / 2, -1, integerSnap)).toBeNaN();
    });

    test('`loVar > hiVar` should yield NaN', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n), 1, arbitraryNumber, integerSnap, 2)).toBeNaN();
    });

    test('compliant for `maxVar` should yield `maxVar`', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, 1, integerSnap)).toBe(15);
    });

    test('`loVar === hiVar`, compliant', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, 1, integerSnap, 15)).toBe(15);
    });

    test('`loVar === hiVar`, non-compliant', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, Math.sqrt(2) / 2, integerSnap, 15)).toBeNaN();
    });

    test('`loVar + 1 === hiVar`, latter is compliant', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, 1, integerSnap, 14)).toBe(15);
    });

    test('`loVar + 1 === hiVar`, only former is compliant', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, 0.99, integerSnap, 14)).toBe(14);
    });

    test('`loVar + 1 === hiVar`, non-compliant', () => {
      expect(monotonicHillClimb((n: number) => Math.sin(n / 10), 15, Math.sqrt(2) / 2, integerSnap, 14)).toBeNaN();
    });
  });
});
