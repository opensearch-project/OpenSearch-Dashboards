import { getGroupId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import { XDomain } from './domains/x_domain';
import { computeXScale, countBarsInCluster } from './scales';
import { FormattedDataSeries } from './series';

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

  test('count bars required on a cluster', () => {
    const stacked: FormattedDataSeries[] = [
      {
        groupId: getGroupId('g1'),
        dataSeries: [],
        counts: {
          areaSeries: 10,
          barSeries: 2,
          lineSeries: 2,
        },
      },
      {
        groupId: getGroupId('g2'),
        dataSeries: [],
        counts: {
          areaSeries: 10,
          barSeries: 20,
          lineSeries: 2,
        },
      },
      {
        groupId: getGroupId('g3'),
        dataSeries: [],
        counts: {
          areaSeries: 10,
          barSeries: 0,
          lineSeries: 2,
        },
      },
    ];
    const nonStacked: FormattedDataSeries[] = [
      {
        groupId: getGroupId('g1'),
        dataSeries: [],
        counts: {
          areaSeries: 10,
          barSeries: 5,
          lineSeries: 2,
        },
      },
      {
        groupId: getGroupId('g2'),
        dataSeries: [],
        counts: {
          areaSeries: 10,
          barSeries: 7,
          lineSeries: 2,
        },
      },
    ];
    const {
      nonStackedBarsInCluster,
      stackedBarsInCluster,
      totalBarsInCluster,
    } = countBarsInCluster(stacked, nonStacked);
    expect(nonStackedBarsInCluster).toBe(12);
    // count one per group
    expect(stackedBarsInCluster).toBe(2);
    expect(totalBarsInCluster).toBe(14);
  });
});
