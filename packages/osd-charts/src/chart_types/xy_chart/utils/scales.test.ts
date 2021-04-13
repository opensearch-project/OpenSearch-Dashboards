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

import { MockXDomain } from '../../../mocks/xy/domains';
import { ScaleType } from '../../../scales/constants';
import { computeXScale } from './scales';

describe('Series scales', () => {
  const xDomainLinear = MockXDomain.fromScaleType(ScaleType.Linear, {
    isBandScale: true,
    domain: [0, 3],
    minInterval: 1,
  });

  const xDomainOrdinal = MockXDomain.fromScaleType(ScaleType.Ordinal, {
    isBandScale: true,
    domain: ['a', 'b'],
    minInterval: 1,
  });

  test('should compute X Scale linear min, max with bands', () => {
    const scale = computeXScale({ xDomain: xDomainLinear, totalBarsInCluster: 1, range: [0, 120] });
    const expectedBandwidth = 120 / 4;
    expect(scale.bandwidth).toBe(120 / 4);
    expect(scale.scale(0)).toBe(0);
    expect(scale.scale(1)).toBe(expectedBandwidth);
    expect(scale.scale(2)).toBe(expectedBandwidth * 2);
    expect(scale.scale(3)).toBe(expectedBandwidth * 3);
  });

  test('should compute X Scale linear inverse min, max with bands', () => {
    const scale = computeXScale({ xDomain: xDomainLinear, totalBarsInCluster: 1, range: [120, 0] });
    const expectedBandwidth = 120 / 4;
    expect(scale.bandwidth).toBe(expectedBandwidth);
    expect(scale.scale(0)).toBe(expectedBandwidth * 3);
    expect(scale.scale(1)).toBe(expectedBandwidth * 2);
    expect(scale.scale(2)).toBe(expectedBandwidth);
    expect(scale.scale(3)).toBe(0);
  });

  describe('computeXScale with single value domain', () => {
    const maxRange = 120;
    const singleDomainValue = 3;
    const minInterval = 1;

    test('should return extended domain & range when in histogram mode', () => {
      const xDomain = MockXDomain.fromScaleType(ScaleType.Linear, {
        isBandScale: true,
        domain: [singleDomainValue, singleDomainValue],
        minInterval,
      });
      const enableHistogramMode = true;

      const scale = computeXScale({
        xDomain,
        totalBarsInCluster: 1,
        range: [0, maxRange],
        barsPadding: 0,
        enableHistogramMode,
      });
      expect(scale.bandwidth).toBe(maxRange);
      expect(scale.domain).toEqual([singleDomainValue, singleDomainValue + minInterval]);
      // reducing of 1 pixel the range for band scale
      expect(scale.range).toEqual([0, maxRange]);
    });

    test('should return unextended domain & range when not in histogram mode', () => {
      const xDomain = MockXDomain.fromScaleType(ScaleType.Linear, {
        isBandScale: true,
        domain: [singleDomainValue, singleDomainValue],
        minInterval,
      });
      const enableHistogramMode = false;

      const scale = computeXScale({
        xDomain,
        totalBarsInCluster: 1,
        range: [0, maxRange],
        barsPadding: 0,
        enableHistogramMode,
      });
      expect(scale.bandwidth).toBe(maxRange);
      expect(scale.domain).toEqual([singleDomainValue, singleDomainValue]);
      expect(scale.range).toEqual([0, 0]);
    });
  });

  test('should compute X Scale ordinal', () => {
    const nonZeroGroupScale = computeXScale({ xDomain: xDomainOrdinal, totalBarsInCluster: 1, range: [120, 0] });
    const expectedBandwidth = 60;
    expect(nonZeroGroupScale.bandwidth).toBe(expectedBandwidth);
    expect(nonZeroGroupScale.scale('a')).toBe(expectedBandwidth);
    expect(nonZeroGroupScale.scale('b')).toBe(0);

    const zeroGroupScale = computeXScale({ xDomain: xDomainOrdinal, totalBarsInCluster: 0, range: [120, 0] });
    expect(zeroGroupScale.bandwidth).toBe(expectedBandwidth);
  });

  describe('bandwidth when totalBarsInCluster is greater than 0 or less than 0', () => {
    const xDomainLinear = MockXDomain.fromScaleType(ScaleType.Linear, {
      isBandScale: true,
      domain: [0, 3],
      minInterval: 1,
    });
    const maxRange = 120;
    const scaleOver0 = computeXScale({
      xDomain: xDomainLinear,
      totalBarsInCluster: 2,
      range: [0, maxRange],
      barsPadding: 0,
      enableHistogramMode: false,
    });

    test('totalBarsInCluster greater than 0', () => {
      expect(scaleOver0.bandwidth).toBe(maxRange / 4 / 2);
    });

    const scaleUnder0 = computeXScale({
      xDomain: xDomainLinear,
      totalBarsInCluster: 0,
      range: [0, maxRange],
      barsPadding: 0,
      enableHistogramMode: false,
    });
    test('totalBarsInCluster less than 0', () => {
      expect(scaleUnder0.bandwidth).toBe(maxRange / 4);
    });
  });
});
