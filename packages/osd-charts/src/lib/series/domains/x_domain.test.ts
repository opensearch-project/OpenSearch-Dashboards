import { getGroupId, getSpecId, SpecId } from '../../utils/ids';
import { ScaleType } from '../../utils/scales/scales';
import { getSplittedSeries } from '../series';
import { BasicSeriesSpec } from '../specs';
import { convertXScaleTypes, findMinInterval, mergeXDomain } from './x_domain';

describe('X Domain', () => {
  test('Should return null when missing specs or specs types', () => {
    const seriesSpecs: BasicSeriesSpec[] = [];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toBe(null);
  });

  test('should throw if we miss calling merge X domain without specs configured', () => {
    expect(() => {
      mergeXDomain([], new Set());
    }).toThrow();
  });

  test('Should return correct scale type with single bar', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      {
        seriesType: 'bar',
        xScaleType: ScaleType.Linear,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Linear,
      isBandScale: true,
    });
  });

  test('Should return correct scale type with single bar with Ordinal', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      {
        seriesType: 'bar',
        xScaleType: ScaleType.Ordinal,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Ordinal,
      isBandScale: true,
    });
  });

  test('Should return correct scale type with single area', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      {
        seriesType: 'area',
        xScaleType: ScaleType.Linear,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Linear,
      isBandScale: false,
    });
  });
  test('Should return correct scale type with single line (time)', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>> = [
      {
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        timeZone: 'utc-3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Time,
      isBandScale: false,
      timeZone: 'utc-3',
    });
  });
  test('Should return correct scale type with multi line with same scale types (time) same tz', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>> = [
      {
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        timeZone: 'UTC-3',
      },
      {
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        timeZone: 'utc-3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Time,
      isBandScale: false,
      timeZone: 'utc-3',
    });
  });
  test('Should return correct scale type with multi line with same scale types (time) coerce to UTC', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>> = [
      {
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        timeZone: 'utc-3',
      },
      {
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        timeZone: 'utc+3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Time,
      isBandScale: false,
      timeZone: 'utc',
    });
  });

  test('Should return correct scale type with multi line with different scale types (linear, ordinal)', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      {
        seriesType: 'line',
        xScaleType: ScaleType.Linear,
      },
      {
        seriesType: 'line',
        xScaleType: ScaleType.Ordinal,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Ordinal,
      isBandScale: false,
    });
  });
  test('Should return correct scale type with multi bar, area with different scale types (linear, ordinal)', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      {
        seriesType: 'bar',
        xScaleType: ScaleType.Linear,
      },
      {
        seriesType: 'area',
        xScaleType: ScaleType.Ordinal,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Ordinal,
      isBandScale: true,
    });
  });
  test('Should return correct scale type with multi bar, area with same scale types (linear, linear)', () => {
    const seriesSpecs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>> = [
      {
        seriesType: 'bar',
        xScaleType: ScaleType.Linear,
      },
      {
        seriesType: 'area',
        xScaleType: ScaleType.Time,
        timeZone: 'utc+3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      scaleType: ScaleType.Linear,
      isBandScale: true,
    });
  });

  test('Should merge line series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g1'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'line',
          xScaleType: ScaleType.Linear,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge bar series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge multi bar series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge multi bar series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge multi bar linear/bar ordinal series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Ordinal,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });
  test('Should merge multi bar/line ordinal series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Linear,
        },
        {
          seriesType: 'line',
          xScaleType: ScaleType.Ordinal,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });
  test('Should merge multi bar/line time series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'bar',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'bar',
          xScaleType: ScaleType.Ordinal,
        },
        {
          seriesType: 'line',
          xScaleType: ScaleType.Time,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });
  test('Should merge multi lines series correctly', () => {
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 5, y: 0 }],
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);
    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'line',
          xScaleType: ScaleType.Ordinal,
        },
        {
          seriesType: 'line',
          xScaleType: ScaleType.Linear,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });

  test('Should merge X multi high volume of data', () => {
    const maxValues = 10000;
    const ds1: BasicSeriesSpec = {
      id: getSpecId('ds1'),
      groupId: getGroupId('g1'),
      seriesType: 'area',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
    };
    const ds2: BasicSeriesSpec = {
      id: getSpecId('ds2'),
      groupId: getGroupId('g2'),
      seriesType: 'line',
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      yScaleToDataExtent: false,
      data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
    };
    const specDataSeries = new Map<SpecId, BasicSeriesSpec>();
    specDataSeries.set(ds1.id, ds1);
    specDataSeries.set(ds2.id, ds2);
    const { xValues } = getSplittedSeries(specDataSeries);

    const mergedDomain = mergeXDomain(
      [
        {
          seriesType: 'area',
          xScaleType: ScaleType.Linear,
        },
        {
          seriesType: 'line',
          xScaleType: ScaleType.Ordinal,
        },
      ],
      xValues,
    );
    expect(mergedDomain.domain.length).toEqual(maxValues);
  });
  test('should compute minInterval an ordered list of numbers', () => {
    const minInterval = findMinInterval([0, 1, 2, 3, 4, 5]);
    expect(minInterval).toBe(1);
  });
  test('should compute minInterval an unordered list of numbers', () => {
    const minInterval = findMinInterval([2, 10, 3, 1, 5]);
    expect(minInterval).toBe(1);
  });
  test('should compute minInterval an list grether than 9', () => {
    const minInterval = findMinInterval([0, 2, 4, 6, 8, 10, 20, 30, 40, 50, 80]);
    expect(minInterval).toBe(2);
  });
  test('should compute minInterval an list with negative numbers', () => {
    const minInterval = findMinInterval([-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12]);
    expect(minInterval).toBe(1);
  });
  test('should compute minInterval an list with negative and positive numbers', () => {
    const minInterval = findMinInterval([-2, -4, -6, -8, -10, -12, 0, 2, 4, 6, 8, 10, 12]);
    expect(minInterval).toBe(2);
  });
  test('should compute minInterval a single element array', () => {
    const minInterval = findMinInterval([100]);
    expect(minInterval).toBe(1);
  });
  test('should compute minInterval a empty element array', () => {
    const minInterval = findMinInterval([]);
    expect(minInterval).toBe(0);
  });
  test('should account for custom domain when merging a linear domain: complete bounded domain', () => {
    const xValues = new Set([1, 2, 3, 4, 5]);
    const xDomain = { min: 0, max: 3 };
    const specs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      { seriesType: 'line', xScaleType: ScaleType.Linear },
    ];

    const basicMergedDomain = mergeXDomain(specs, xValues, xDomain);
    expect(basicMergedDomain.domain).toEqual([0, 3]);

    const arrayXDomain = [1, 2];
    const attemptToMergeArrayDomain = () => {
      mergeXDomain(specs, xValues, arrayXDomain);
    };
    const errorMessage =
      'xDomain for continuous scale should be a DomainRange object, not an array';
    expect(attemptToMergeArrayDomain).toThrowError(errorMessage);

    const invalidXDomain = { min: 10, max: 0 };
    const attemptToMerge = () => {
      mergeXDomain(specs, xValues, invalidXDomain);
    };
    expect(attemptToMerge).toThrowError('custom xDomain is invalid, min is greater than max');
  });

  test('should account for custom domain when merging a linear domain: lower bounded domain', () => {
    const xValues = new Set([1, 2, 3, 4, 5]);
    const xDomain = { min: 0 };
    const specs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      { seriesType: 'line', xScaleType: ScaleType.Linear },
    ];

    const mergedDomain = mergeXDomain(specs, xValues, xDomain);
    expect(mergedDomain.domain).toEqual([0, 5]);

    const invalidXDomain = { min: 10 };
    const attemptToMerge = () => {
      mergeXDomain(specs, xValues, invalidXDomain);
    };
    expect(attemptToMerge).toThrowError(
      'custom xDomain is invalid, custom min is greater than computed max',
    );
  });

  test('should account for custom domain when merging a linear domain: upper bounded domain', () => {
    const xValues = new Set([1, 2, 3, 4, 5]);
    const xDomain = { max: 3 };
    const specs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      { seriesType: 'line', xScaleType: ScaleType.Linear },
    ];

    const mergedDomain = mergeXDomain(specs, xValues, xDomain);
    expect(mergedDomain.domain).toEqual([1, 3]);

    const invalidXDomain = { max: -1 };
    const attemptToMerge = () => {
      mergeXDomain(specs, xValues, invalidXDomain);
    };
    expect(attemptToMerge).toThrowError(
      'custom xDomain is invalid, computed min is greater than custom max',
    );
  });

  test('should account for custom domain when merging an ordinal domain', () => {
    const xValues = new Set(['a', 'b', 'c', 'd']);
    const xDomain = ['a', 'b', 'c'];
    const specs: Array<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>> = [
      { seriesType: 'bar', xScaleType: ScaleType.Ordinal },
    ];
    const basicMergedDomain = mergeXDomain(specs, xValues, xDomain);
    expect(basicMergedDomain.domain).toEqual(['a', 'b', 'c']);

    const objectXDomain = { max: 10, min: 0 };
    const attemptToMerge = () => {
      mergeXDomain(specs, xValues, objectXDomain);
    };
    const errorMessage =
      'xDomain for ordinal scale should be an array of values, not a DomainRange object';
    expect(attemptToMerge).toThrowError(errorMessage);
  });
});
