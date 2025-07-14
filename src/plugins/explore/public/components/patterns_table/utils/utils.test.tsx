/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { highlightLogUsingPattern, isValidFiniteNumber } from './utils';

describe('utils', () => {
  describe('isValidFiniteNumber', () => {
    // Test valid numbers
    it('should return true for valid positive numbers', () => {
      expect(isValidFiniteNumber(42)).toBe(true);
      expect(isValidFiniteNumber(0.5)).toBe(true);
      expect(isValidFiniteNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should return true for valid negative numbers', () => {
      expect(isValidFiniteNumber(-42)).toBe(true);
      expect(isValidFiniteNumber(-0.5)).toBe(true);
      expect(isValidFiniteNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isValidFiniteNumber(0)).toBe(true);
    });

    // Test invalid numbers
    it('should return false for NaN', () => {
      expect(isValidFiniteNumber(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidFiniteNumber(Infinity)).toBe(false);
      expect(isValidFiniteNumber(-Infinity)).toBe(false);
    });

    // Scientific notation tests
    it('should handle positive scientific notation correctly', () => {
      expect(isValidFiniteNumber(1e5)).toBe(true);
      expect(isValidFiniteNumber(1.23e5)).toBe(true);
      expect(isValidFiniteNumber(1e5)).toBe(true);
    });

    it('should handle negative scientific notation correctly', () => {
      expect(isValidFiniteNumber(1e-5)).toBe(true);
      expect(isValidFiniteNumber(1.23e-5)).toBe(true);
      expect(isValidFiniteNumber(-1.23e-5)).toBe(true);
    });
  });

  describe('highlightLogUsingPattern', () => {
    it('dynamic element inside', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '[Log] <*> GET/<*> 172.198.1.1'
        )
      ).toStrictEqual('[Log] <mark>Gecko</mark> GET/<mark>something</mark> 172.198.1.1');
    });

    it('dynamic element in front', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '<*> <*> GET/<*> 172.198.1.1'
        )
      ).toStrictEqual(
        '<mark>[Log]</mark> <mark>Gecko</mark> GET/<mark>something</mark> 172.198.1.1'
      );
    });

    it('dynamic element in front with special delim', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '<*MSG*> <*> GET/<*> 172.198.1.1'
        )
      ).toStrictEqual(
        '<mark>[Log]</mark> <mark>Gecko</mark> GET/<mark>something</mark> 172.198.1.1'
      );
    });

    it('dynamic element at the end', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '[Log] <*> GET/<*> 172.198.<*>'
        )
      ).toStrictEqual(
        '[Log] <mark>Gecko</mark> GET/<mark>something</mark> 172.198.<mark>1.1</mark>'
      );
    });

    it('dynamic element at the end with special delim', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '[Log] <*> GET/<*> <*IP*>'
        )
      ).toStrictEqual(
        '[Log] <mark>Gecko</mark> GET/<mark>something</mark> <mark>172.198.1.1</mark>'
      );
    });

    it('dynamic elements at the front and back', () => {
      expect(
        highlightLogUsingPattern(
          '223.87.60.27 - - [2018-07-22T00:39:02.912Z] "GET /opensearch/opensearch-1.0.0.deb_1 HTTP/1.1" 200 6219 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1"',
          '<*IP*> - - [<*DATETIME*>] "GET <*> HTTP/<*><*>" 200 <*> "-" "Mozilla/<*><*> (<*>; Linux <*>_<*>; rv:<*><*><*>) Gecko/<*> Firefox/<*><*><*>"'
        )
      ).toStrictEqual(
        '<mark>223.87.60.27</mark> - - [<mark>2018-07-22T00:39:02.912Z</mark>] "GET <mark>/opensearch/opensearch-1.0.0.deb_1</mark> HTTP/<mark>1.1</mark>" 200 <mark>6219</mark> "-" "Mozilla/<mark>5.0</mark> (<mark>X11</mark>; Linux <mark>x86</mark>_<mark>64</mark>; rv:<mark>6.0a1</mark>) Gecko/<mark>20110421</mark> Firefox/<mark>6.0a1</mark>"'
      );
    });
  });
});
