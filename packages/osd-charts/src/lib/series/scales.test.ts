import { getGroupId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import { XDomain } from './domains/x_domain';
import { computeXScale, countClusteredSeries } from './scales';

describe('Series scales', () => {
  const xDomainLinear: XDomain = {
    type: 'xDomain',
    isBandScale: true,
    domain: [0, 3],
    minInterval: 1,
    scaleType: ScaleType.Linear,
  };

  const xDomainOrdinal: XDomain = {
    type: 'xDomain',
    isBandScale: true,
    domain: ['a', 'b'],
    minInterval: 1,
    scaleType: ScaleType.Ordinal,
  };

  test('should compute X Scale linear min, max with bands', () => {
    const scale = computeXScale(xDomainLinear, 1, 0, 120);
    const expectedBandwidth = 120 / 4;
    expect(scale.bandwidth).toBe(expectedBandwidth);
    expect(scale.scale(0)).toBe(expectedBandwidth * 0);
    expect(scale.scale(1)).toBe(expectedBandwidth * 1);
    expect(scale.scale(2)).toBe(expectedBandwidth * 2);
    expect(scale.scale(3)).toBe(expectedBandwidth * 3);
  });

  test('should compute X Scale linear inverse min, max with bands', () => {
    const scale = computeXScale(xDomainLinear, 1, 120, 0);
    const expectedBandwidth = 120 / 4;
    expect(scale.bandwidth).toBe(expectedBandwidth);
    expect(scale.scale(0)).toBe(expectedBandwidth * 3);
    expect(scale.scale(1)).toBe(expectedBandwidth * 2);
    expect(scale.scale(2)).toBe(expectedBandwidth * 1);
    expect(scale.scale(3)).toBe(expectedBandwidth * 0);
  });

  test('should compute X Scale ordinal', () => {
    const nonZeroGroupScale = computeXScale(xDomainOrdinal, 1, 120, 0);
    const expectedBandwidth = 60;
    expect(nonZeroGroupScale.bandwidth).toBe(expectedBandwidth);
    expect(nonZeroGroupScale.scale('a')).toBe(expectedBandwidth);
    expect(nonZeroGroupScale.scale('b')).toBe(0);

    const zeroGroupScale = computeXScale(xDomainOrdinal, 0, 120, 0);
    expect(zeroGroupScale.bandwidth).toBe(expectedBandwidth);
  });

  test('should count clustered series', () => {
    const group1 = getGroupId('group_1');
    const nonStackedSeries = [{
      groupId: group1,
      dataSeries: [],
      counts: {
        barSeries: 1,
        lineSeries: 1,
        areaSeries: 1,
        basicSeries: 1,
      },
    }];
    const stackedSeries = [{
      groupId: group1,
      dataSeries: [],
      counts: {
        barSeries: 3,
        lineSeries: 1,
        areaSeries: 1,
        basicSeries: 1,
      },
    }, {
      groupId: group1,
      dataSeries: [],
      counts: {
        barSeries: 0,
        lineSeries: 1,
        areaSeries: 1,
        basicSeries: 1,
      },
    }];

    const expectedCount = {
      nonStackedGroupCount: 1,
      stackedGroupCount: 1,
      totalGroupCount: 2,
    };
    const numClusteredSeries = countClusteredSeries(stackedSeries, nonStackedSeries);
    expect(numClusteredSeries).toEqual(expectedCount);
  });
});
