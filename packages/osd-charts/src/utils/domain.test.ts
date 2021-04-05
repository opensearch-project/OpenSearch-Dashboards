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

import { ScaleType } from '../scales/constants';
import { AccessorFn } from './accessor';
import { identity } from './common';
import { computeContinuousDataDomain, computeDomainExtent, computeOrdinalDataDomain } from './domain';

describe('utils/domain', () => {
  test('should return [0] domain if no data', () => {
    const data: any[] = [];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = true;
    const removeNull = true;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    expect(ordinalDataDomain).toEqual([0]);
  });

  test('should compute ordinal data domain: sort & remove nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = true;
    const removeNull = true;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['a', 'b', 'd'];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute ordinal data domain: unsorted and remove nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = false;
    const removeNull = true;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['d', 'a', 'b'];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute ordinal data domain: sorted and keep nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = true;
    const removeNull = false;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['a', 'b', 'd', null];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute ordinal data domain: unsorted and keep nulls', () => {
    const data = [{ x: 'd' }, { x: 'a' }, { x: null }, { x: 'b' }];
    const accessor: AccessorFn = (datum: any) => datum.x;
    const isSorted = false;
    const removeNull = false;

    const ordinalDataDomain = computeOrdinalDataDomain(data, accessor, isSorted, removeNull);

    const expectedOrdinalDomain = ['d', 'a', null, 'b'];

    expect(ordinalDataDomain).toEqual(expectedOrdinalDomain);
  });

  test('should compute continuous data domain: data scaled to extent', () => {
    const data = [{ x: 12 }, { x: 6 }, { x: 8 }];
    const accessor = (datum: any) => datum.x;
    const continuousDataDomain = computeContinuousDataDomain(data, accessor, ScaleType.Linear, { fit: true });
    const expectedContinuousDomain = [6, 12];

    expect(continuousDataDomain).toEqual(expectedContinuousDomain);
  });

  test('should compute continuous data domain: data not scaled to extent', () => {
    const data = [{ x: 12 }, { x: 6 }, { x: 8 }];
    const accessor = (datum: any) => datum.x;

    const continuousDataDomain = computeContinuousDataDomain(data, accessor, ScaleType.Linear);

    const expectedContinuousDomain = [0, 12];

    expect(continuousDataDomain).toEqual(expectedContinuousDomain);
  });

  test('should compute continuous data domain: empty data not scaled to extent', () => {
    const data: any[] = [];
    const accessor = (datum: any) => datum.x;

    const continuousDataDomain = computeContinuousDataDomain(data, accessor, ScaleType.Linear);

    const expectedContinuousDomain = [0, 0];

    expect(continuousDataDomain).toEqual(expectedContinuousDomain);
  });

  test('should filter zeros on log scale domain when fit is true', () => {
    const data: number[] = [0.0001, 0, 1, 0, 10, 0, 100, 0, 0, 1000];
    const continuousDataDomain = computeContinuousDataDomain(data, identity, ScaleType.Log, { fit: true });

    expect(continuousDataDomain).toEqual([0.0001, 1000]);
  });

  test('should not filter zeros on log scale domain when fit is false', () => {
    const data: number[] = [0.0001, 0, 1, 0, 10, 0, 100, 0, 0, 1000];
    const continuousDataDomain = computeContinuousDataDomain(data, identity, ScaleType.Log, { fit: false });

    expect(continuousDataDomain).toEqual([0, 1000]);
  });

  describe('YDomainOptions', () => {
    it('should not effect domain when domain.fit is true', () => {
      expect(computeDomainExtent([5, 10], { fit: true })).toEqual([5, 10]);
    });

    // Note: padded domains are possible with log scale but not very practical
    it('should not effect positive domain if log scale with padding', () => {
      expect(computeDomainExtent([0.001, 10], { padding: 5 })).toEqual([0, 15]);
    });

    it('should not effect negative domain if log scale with padding', () => {
      expect(computeDomainExtent([-10, -0.001], { padding: 5 })).toEqual([-15, 0]);
    });

    describe('domain.fit is true', () => {
      it('should find domain when start & end are positive', () => {
        expect(computeDomainExtent([5, 10], { fit: true })).toEqual([5, 10]);
      });

      it('should find domain when start & end are negative', () => {
        expect(computeDomainExtent([-15, -10], { fit: true })).toEqual([-15, -10]);
      });

      it('should find domain when start is negative, end is positive', () => {
        expect(computeDomainExtent([-15, 10], { fit: true })).toEqual([-15, 10]);
      });
    });
    describe('domain.fit is false', () => {
      it('should find domain when start & end are positive', () => {
        expect(computeDomainExtent([5, 10])).toEqual([0, 10]);
      });

      it('should find domain when start & end are negative', () => {
        expect(computeDomainExtent([-15, -10])).toEqual([-15, 0]);
      });

      it('should find domain when start is negative, end is positive', () => {
        expect(computeDomainExtent([-15, 10])).toEqual([-15, 10]);
      });
    });

    describe('padding does NOT cause domain to cross zero baseline', () => {
      it('should get domain from positive domain', () => {
        expect(computeDomainExtent([10, 70], { fit: true, padding: 5 })).toEqual([5, 75]);
      });

      it('should get domain from positive & negative domain', () => {
        expect(computeDomainExtent([-30, 30], { fit: true, padding: 5 })).toEqual([-35, 35]);
      });

      it('should get domain from negative domain', () => {
        expect(computeDomainExtent([-70, -10], { fit: true, padding: 5 })).toEqual([-75, -5]);
      });

      it('should use absolute padding value', () => {
        expect(computeDomainExtent([10, 70], { fit: true, padding: -5 })).toEqual([5, 75]);
      });
    });

    describe('padding caused domain to cross zero baseline', () => {
      describe('constrainPadding true - default', () => {
        it('should set min baseline as 0 if original domain is less than zero', () => {
          expect(computeDomainExtent([5, 65], { fit: true, padding: 15 })).toEqual([0, 80]);
        });

        it('should set max baseline as 0 if original domain is less than zero', () => {
          expect(computeDomainExtent([-65, -5], { fit: true, padding: 15 })).toEqual([-80, 0]);
        });
      });

      describe('constrainPadding false', () => {
        it('should allow min past baseline as 0, even if original domain is less than zero', () => {
          expect(computeDomainExtent([5, 65], { fit: true, padding: 15, constrainPadding: false })).toEqual([-10, 80]);
        });

        it('should allow max past baseline as 0, even if original domain is less than zero', () => {
          expect(computeDomainExtent([-65, -5], { fit: true, padding: 15, constrainPadding: false })).toEqual([
            -80,
            10,
          ]);
        });
      });
    });
  });
});
