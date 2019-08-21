import { getSpecId } from '../../../utils/ids';
import { RawDataSeries } from './series';
import { formatStackedDataSeriesValues } from './stacked_series_utils';

describe('Stacked Series Utils', () => {
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
          y1: 70,
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
          y1: 70,
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
          y1: 90,
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
      data: [{ x: 1, y1: 10 }, { x: 2, y1: 20 }, { x: 4, y1: 40 }],
    },
    {
      specId: getSpecId('spec1'),
      key: ['b'],
      seriesColorKey: 'b',
      data: [{ x: 1, y1: 90 }, { x: 3, y1: 30 }],
    },
  ];

  describe('Format stacked dataset', () => {
    test('format data without nulls', () => {
      const formattedData = formatStackedDataSeriesValues(STANDARD_DATA_SET, false, true);
      const data0 = formattedData[0].data[0];
      expect(data0.initialY1).toBe(0.1);
      expect(data0.y0).toBe(0);
      expect(data0.y1).toBe(0.1);

      const data1 = formattedData[1].data[0];
      expect(data1.initialY1).toBe(0.2);
      expect(data1.y0).toBe(0.1);
      expect(data1.y1).toBeCloseTo(0.3);

      const data2 = formattedData[2].data[0];
      expect(data2.initialY1).toBe(0.7);
      expect(data2.y0).toBe(0.3);
      expect(data2.y1).toBe(1);
    });
    test('format data with nulls', () => {
      const formattedData = formatStackedDataSeriesValues(WITH_NULL_DATASET, false, true);
      const data0 = formattedData[0].data[0];
      expect(data0.initialY1).toBe(0.25);
      expect(data0.y0).toBe(0);
      expect(data0.y1).toBe(0.25);

      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: null,
        y0: 0.25,
      });

      const data2 = formattedData[2].data[0];
      expect(data2.initialY1).toBe(0.75);
      expect(data2.y0).toBe(0.25);
      expect(data2.y1).toBe(1);
    });
    test('format data without nulls with y0 values', () => {
      const formattedData = formatStackedDataSeriesValues(STANDARD_DATA_SET_WY0, false, true);
      const data0 = formattedData[0].data[0];
      expect(data0.initialY0).toBe(0.02);
      expect(data0.initialY1).toBe(0.1);
      expect(data0.y0).toBe(0.02);
      expect(data0.y1).toBe(0.1);

      const data1 = formattedData[1].data[0];
      expect(data1.initialY0).toBe(0.04);
      expect(data1.initialY1).toBe(0.2);
      expect(data1.y0).toBe(0.14);
      expect(data1.y1).toBeCloseTo(0.3, 5);

      const data2 = formattedData[2].data[0];
      expect(data2.initialY0).toBe(0.06);
      expect(data2.initialY1).toBe(0.7);
      expect(data2.y0).toBe(0.36);
      expect(data2.y1).toBe(1);
    });
    test('format data with nulls', () => {
      const formattedData = formatStackedDataSeriesValues(WITH_NULL_DATASET_WY0, false, true);
      const data0 = formattedData[0].data[0];
      expect(data0.initialY0).toBe(0.02);
      expect(data0.initialY1).toBe(0.1);
      expect(data0.y0).toBe(0.02);
      expect(data0.y1).toBe(0.1);

      const data1 = formattedData[1].data[0];
      expect(data1.initialY0).toBe(null);
      expect(data1.initialY1).toBe(null);
      expect(data1.y0).toBe(0.1);
      expect(data1.y1).toBe(null);

      const data2 = formattedData[2].data[0];
      expect(data2.initialY0).toBe(0.06);
      expect(data2.initialY1).toBe(0.9);
      expect(data2.y0).toBe(0.16);
      expect(data2.y1).toBe(1);
    });
    test('format data without nulls on second series', () => {
      const formattedData = formatStackedDataSeriesValues(DATA_SET_WITH_NULL_2, false, true);
      expect(formattedData.length).toBe(2);
      expect(formattedData[0].data.length).toBe(3);
      expect(formattedData[1].data.length).toBe(2);

      expect(formattedData[0].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 0.1,
        x: 1,
        y0: 0,
        y1: 0.1,
      });
      expect(formattedData[0].data[1]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 1,
        x: 2,
        y0: 0,
        y1: 1,
      });
      expect(formattedData[0].data[2]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 1,
        x: 4,
        y0: 0,
        y1: 1,
      });
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 0.9,
        x: 1,
        y0: 0.1,
        y1: 1,
      });
      expect(formattedData[1].data[1]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 1,
        x: 3,
        y0: 0,
        y1: 1,
      });
    });
  });
});
