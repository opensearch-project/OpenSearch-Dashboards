import { getSpecId } from '../utils/ids';
import { RawDataSeries } from './series';
import { computeYStackedMapValues, formatStackedDataSeriesValues, getYValueStackMap } from './stacked_series_utils';

describe('Stacked Series Utils', () => {
  const EMPTY_DATA_SET: RawDataSeries[] = [
    {
      data: [],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec1'),
    },
  ];
  const STANDARD_DATA_SET: RawDataSeries[] = [
    {
      data: [
        {
          x: 0,
          y1: 10,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec1'),
    },
    {
      data: [
        {
          x: 0,
          y1: 20,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec2'),
    },
    {
      data: [
        {
          x: 0,
          y1: 30,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec3'),
    },
  ];
  const WITH_NULL_DATASET: RawDataSeries[] = [
    {
      data: [
        {
          x: 0,
          y1: 10,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec1'),
    },
    {
      data: [
        {
          x: 0,
          y1: null,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec2'),
    },
    {
      data: [
        {
          x: 0,
          y1: 30,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec3'),
    },
  ];
  const STANDARD_DATA_SET_WY0: RawDataSeries[] = [
    {
      data: [
        {
          x: 0,
          y0: 2,
          y1: 10,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec1'),
    },
    {
      data: [
        {
          x: 0,
          y0: 4,
          y1: 20,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec2'),
    },
    {
      data: [
        {
          x: 0,
          y0: 6,
          y1: 30,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec3'),
    },
  ];
  const WITH_NULL_DATASET_WY0: RawDataSeries[] = [
    {
      data: [
        {
          x: 0,
          y0: 2,
          y1: 10,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec1'),
    },
    {
      data: [
        {
          x: 0,
          y1: null,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec2'),
    },
    {
      data: [
        {
          x: 0,
          y0: 6,
          y1: 30,
        },
      ],
      key: [],
      seriesColorKey: 'color-key',
      specId: getSpecId('spec3'),
    },
  ];
  const DATA_SET_WITH_NULL_2: RawDataSeries[] = [
    {
      specId: getSpecId('spec1'),
      key: ['a'],
      seriesColorKey: 'a',
      data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 4, y1: 4 }],
    },
    {
      specId: getSpecId('spec1'),
      key: ['b'],
      seriesColorKey: 'b',
      data: [{ x: 1, y1: 21 }, { x: 3, y1: 23 }],
    },
  ];
  describe('create stacked maps', () => {
    test('with empty values', () => {
      const stackedMap = getYValueStackMap(EMPTY_DATA_SET);
      expect(stackedMap.size).toBe(0);
    });
    test('with basic values', () => {
      const stackedMap = getYValueStackMap(STANDARD_DATA_SET);
      expect(stackedMap.size).toBe(1);
      const x0StackArray = stackedMap.get(0)!;
      expect(x0StackArray).toBeDefined();
      expect(x0StackArray.length).toBe(3);
      expect(x0StackArray).toEqual([10, 20, 30]);
    });
    test('with values with nulls', () => {
      const stackedMap = getYValueStackMap(WITH_NULL_DATASET);
      expect(stackedMap.size).toBe(1);
      const x0StackArray = stackedMap.get(0)!;
      expect(x0StackArray).toBeDefined();
      expect(x0StackArray.length).toBe(3);
      expect(x0StackArray).toEqual([10, null, 30]);
    });
  });
  describe('compute stacked arrays', () => {
    test('with empty values', () => {
      const stackedMap = getYValueStackMap(EMPTY_DATA_SET);
      let computedStackedMap = computeYStackedMapValues(stackedMap, false);
      expect(computedStackedMap.size).toBe(0);
      computedStackedMap = computeYStackedMapValues(stackedMap, true);
      expect(computedStackedMap.size).toBe(0);
    });
    test('with basic values', () => {
      const stackedMap = getYValueStackMap(STANDARD_DATA_SET);
      const computedStackedMap = computeYStackedMapValues(stackedMap, false);
      expect(computedStackedMap.size).toBe(1);
      const x0Array = computedStackedMap.get(0)!;
      expect(x0Array).toBeDefined();
      expect(x0Array).toEqual([0, 10, 30, 60]);
    });
    test('with null values', () => {
      const stackedMap = getYValueStackMap(WITH_NULL_DATASET);
      const computedStackedMap = computeYStackedMapValues(stackedMap, false);
      expect(computedStackedMap.size).toBe(1);
      const x0Array = computedStackedMap.get(0)!;
      expect(x0Array).toBeDefined();
      expect(x0Array).toEqual([0, 10, 10, 40]);
    });
  });
  describe('Format stacked dataset', () => {
    test('format data without nulls', () => {
      const formattedData = formatStackedDataSeriesValues(STANDARD_DATA_SET, false);
      expect(formattedData[0].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 10,
        x: 0,
        y0: 0,
        y1: 10,
      });
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 20,
        x: 0,
        y0: 10,
        y1: 30,
      });
      expect(formattedData[2].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 30,
        x: 0,
        y0: 30,
        y1: 60,
      });
    });
    test('format data with nulls', () => {
      const formattedData = formatStackedDataSeriesValues(WITH_NULL_DATASET, false);
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: null,
        y0: null,
      });
    });
    test('format data without nulls with y0 values', () => {
      const formattedData = formatStackedDataSeriesValues(STANDARD_DATA_SET_WY0, false);
      expect(formattedData[0].data[0]).toEqual({
        datum: undefined,
        initialY0: 2,
        initialY1: 10,
        x: 0,
        y0: 2,
        y1: 10,
      });
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: 4,
        initialY1: 20,
        x: 0,
        y0: 14,
        y1: 30,
      });
      expect(formattedData[2].data[0]).toEqual({
        datum: undefined,
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 36,
        y1: 60,
      });
    });
    test('format data with nulls', () => {
      const formattedData = formatStackedDataSeriesValues(WITH_NULL_DATASET_WY0, false);
      expect(formattedData[0].data[0]).toEqual({
        datum: undefined,
        initialY0: 2,
        initialY1: 10,
        x: 0,
        y0: 2,
        y1: 10,
      });
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: null,
        y0: null,
      });
      expect(formattedData[2].data[0]).toEqual({
        datum: undefined,
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 16,
        y1: 40,
      });
    });
    test('format data without nulls on second series', () => {
      const formattedData = formatStackedDataSeriesValues(DATA_SET_WITH_NULL_2, false);
      expect(formattedData.length).toBe(2);
      expect(formattedData[0].data.length).toBe(3);
      expect(formattedData[1].data.length).toBe(2);

      expect(formattedData[0].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 1,
        x: 1,
        y0: 0,
        y1: 1,
      });
      expect(formattedData[0].data[1]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 2,
        x: 2,
        y0: 0,
        y1: 2,
      });
      expect(formattedData[0].data[2]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 4,
        x: 4,
        y0: 0,
        y1: 4,
      });
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 21,
        x: 1,
        y0: 1,
        y1: 22,
      });
      expect(formattedData[1].data[1]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 23,
        x: 3,
        y0: 0,
        y1: 23,
      });
    });
  });
});
