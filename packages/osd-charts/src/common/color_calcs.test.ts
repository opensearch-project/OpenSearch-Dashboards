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
 * under the License.
 */

import { integerSnap, monotonicHillClimb } from '../solvers/monotonic_hill_climb';
import { makeHighContrastColor, combineColors } from './color_calcs';

describe('calcs', () => {
  describe('test makeHighContrastColor', () => {
    it('hex input - should change white text to black when background is white', () => {
      const expected = '#000';
      const result = makeHighContrastColor('#fff', '#fff');
      expect(result).toBe(expected);
    });
    it('rgb input - should change white text to black when background is white', () => {
      const expected = '#000';
      const result = makeHighContrastColor('rgb(255, 255, 255)', 'rgb(255, 255, 255)');
      expect(result).toBe(expected);
    });
    it('rgba input - should change white text to black when background is white', () => {
      const expected = '#000';
      const result = makeHighContrastColor('rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)');
      expect(result).toBe(expected);
    });
    it('word input - should change white text to black when background is white', () => {
      const expected = '#000';
      const result = makeHighContrastColor('white', 'white');
      expect(result).toBe(expected);
    });
    // test contrast computation
    it('should provide at least 4.5 contrast', () => {
      const foreground = '#fff'; // white
      const background = 'rgba(255, 255, 51, 0.3)'; // light yellow
      const result = '#000'; // black
      expect(result).toBe(makeHighContrastColor(foreground, background));
    });
    it('should use black text for hex value', () => {
      const foreground = '#fff'; // white
      const background = '#7874B2'; // Thailand color
      const result = '#000'; // black
      expect(result).toBe(makeHighContrastColor(foreground, background));
    });
    it('should switch to black text if background color is in rgba() format - Thailand', () => {
      const containerBackground = 'white';
      const background = 'rgba(120, 116, 178, 0.7)';
      const resultForCombined = 'rgba(161, 158, 201, 1)'; // 0.3 'rgba(215, 213, 232, 1)'; // 0.5 - 'rgba(188, 186, 217, 1)'; //0.7 - ;
      expect(combineColors(background, containerBackground)).toBe(resultForCombined);
      const foreground = 'white';
      const resultForContrastedText = '#000'; // switches to black text
      expect(makeHighContrastColor(foreground, resultForCombined)).toBe(resultForContrastedText);
    });
  });
  describe('test the combineColors function', () => {
    it('should return correct RGBA with opacity greater than 0.7', () => {
      const expected = 'rgba(102, 43, 206, 1)';
      const result = combineColors('rgba(121, 47, 249, 0.8)', '#1c1c24');
      expect(result).toBe(expected);
    });
    it('should return correct RGBA with opacity less than 0.7', () => {
      const expected = 'rgba(226, 186, 187, 1)';
      const result = combineColors('rgba(228, 26, 28, 0.3)', 'rgba(225, 255, 255, 1)');
      expect(result).toBe(expected);
    });
    it('should return correct RGBA with the input color as a word vs rgba or hex value', () => {
      const expected = 'rgba(0, 0, 255, 1)';
      const result = combineColors('blue', 'black');
      expect(result).toBe(expected);
    });
    it('should return the correct RGBA with hex input', () => {
      const expected = 'rgba(212, 242, 210, 1)';
      const result = combineColors('#D4F2D2', '#BEB7DF');
      expect(result).toBe(expected);
    });
  });
});

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
