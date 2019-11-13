import { getSpecId } from '../../../utils/ids';
import { RawDataSeries } from './series';
import { ScaleType } from '../../../utils/scales/scales';
import { MockRawDataSeries, MockDataSeries } from '../../../mocks';
import { MockSeriesSpecs, MockSeriesSpec } from '../../../mocks/specs';

import * as fitFunctionModule from './fit_function';
import * as testModule from './nonstacked_series_utils';
import { Fit } from './specs';

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
describe('Non-Stacked Series Utils', () => {
  describe('Format stacked dataset', () => {
    test('empty data', () => {
      const formattedData = testModule.formatNonStackedDataSeriesValues(
        EMPTY_DATA_SET,
        false,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
      expect(formattedData[0].data.length).toBe(0);
    });
    test('format data without nulls', () => {
      let formattedData = testModule.formatNonStackedDataSeriesValues(
        STANDARD_DATA_SET,
        false,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
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
        y0: 0,
        y1: 20,
      });
      expect(formattedData[2].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 30,
        x: 0,
        y0: 0,
        y1: 30,
      });
      formattedData = testModule.formatNonStackedDataSeriesValues(
        STANDARD_DATA_SET,
        true,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
      expect(formattedData[0].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 10,
        x: 0,
        y0: 10,
        y1: 10,
      });
      expect(formattedData[1].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 20,
        x: 0,
        y0: 20,
        y1: 20,
      });
      expect(formattedData[2].data[0]).toEqual({
        datum: undefined,
        initialY0: null,
        initialY1: 30,
        x: 0,
        y0: 30,
        y1: 30,
      });
    });
    test('format data with nulls', () => {
      const formattedData = testModule.formatNonStackedDataSeriesValues(
        WITH_NULL_DATASET,
        false,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
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
      const formattedData = testModule.formatNonStackedDataSeriesValues(
        STANDARD_DATA_SET_WY0,
        false,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
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
        y0: 4,
        y1: 20,
      });
      expect(formattedData[2].data[0]).toEqual({
        datum: undefined,
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 6,
        y1: 30,
      });
    });
    test('format data with nulls', () => {
      const formattedData = testModule.formatNonStackedDataSeriesValues(
        WITH_NULL_DATASET_WY0,
        false,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
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
        y0: 6,
        y1: 30,
      });
    });
    test('format data without nulls on second series', () => {
      const formattedData = testModule.formatNonStackedDataSeriesValues(
        DATA_SET_WITH_NULL_2,
        false,
        MockSeriesSpecs.empty(),
        ScaleType.Linear,
      );
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
        y0: 0,
        y1: 21,
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

  describe('Using fit functions', () => {
    describe.each(['area', 'line'])('Spec type - %s', (specType) => {
      const rawDataSeries = [MockRawDataSeries.fitFunction({ shuffle: false })];
      const dataSeries = MockDataSeries.fitFunction({ shuffle: false });
      const spec =
        specType === 'area' ? MockSeriesSpec.area({ fit: Fit.Linear }) : MockSeriesSpec.line({ fit: Fit.Linear });
      const seriesSpecs = MockSeriesSpecs.fromSpecs([spec]);

      beforeAll(() => {
        jest.spyOn(fitFunctionModule, 'fitFunction').mockReturnValue(dataSeries);
        jest.spyOn(testModule, 'formatNonStackedDataValues').mockReturnValue(dataSeries);
      });

      it('return call formatNonStackedDataValues with args', () => {
        testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, seriesSpecs, ScaleType.Linear);

        expect(testModule.formatNonStackedDataValues).toHaveBeenCalledWith(rawDataSeries[0], false);
      });

      it('return call fitFunction with args', () => {
        testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, seriesSpecs, ScaleType.Linear);

        expect(fitFunctionModule.fitFunction).toHaveBeenCalledWith(dataSeries, Fit.Linear, ScaleType.Linear);
      });

      it('return not call fitFunction if no fit specified', () => {
        const spec =
          specType === 'area' ? MockSeriesSpec.area({ fit: undefined }) : MockSeriesSpec.line({ fit: undefined });
        const noFitSpec = MockSeriesSpecs.fromSpecs([spec]);
        testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, noFitSpec, ScaleType.Linear);

        expect(fitFunctionModule.fitFunction).not.toHaveBeenCalled();
      });

      it('return fitted dataSeries', () => {
        const actual = testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, seriesSpecs, ScaleType.Linear);

        expect(actual[0]).toBe(dataSeries);
      });
    });

    describe('Non area and line specs', () => {
      const rawDataSeries = [MockRawDataSeries.fitFunction({ shuffle: false })];
      const dataSeries = MockDataSeries.fitFunction({ shuffle: false });
      const spec = MockSeriesSpec.bar();
      const seriesSpecs = MockSeriesSpecs.fromSpecs([spec]);

      beforeAll(() => {
        jest.spyOn(fitFunctionModule, 'fitFunction').mockReturnValue(dataSeries);
        jest.spyOn(testModule, 'formatNonStackedDataValues').mockReturnValue(dataSeries);
      });

      it('return call formatNonStackedDataValues with args', () => {
        testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, seriesSpecs, ScaleType.Linear);

        expect(testModule.formatNonStackedDataValues).toHaveBeenCalledWith(rawDataSeries[0], false);
      });

      it('return call fitFunction with args', () => {
        testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, seriesSpecs, ScaleType.Linear);

        expect(fitFunctionModule.fitFunction).not.toHaveBeenCalled();
      });

      it('return fitted dataSeries', () => {
        const actual = testModule.formatNonStackedDataSeriesValues(rawDataSeries, false, seriesSpecs, ScaleType.Linear);

        expect(actual[0]).toBe(dataSeries);
      });
    });
  });
});
