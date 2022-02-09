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

import { MockDataSeries } from '../../../mocks';
import { MockSeriesSpecs, MockSeriesSpec } from '../../../mocks/specs';
import { MockStore } from '../../../mocks/store';
import { ScaleType } from '../../../scales/constants';
import { computeSeriesDomainsSelector } from '../state/selectors/compute_series_domains';
import * as fitFunctionModule from './fit_function';
import * as testModule from './fit_function_utils';
import { Fit } from './specs';

const EMPTY_DATA_SET = MockSeriesSpec.area({
  xScaleType: ScaleType.Linear,
  yAccessors: ['y1'],
  splitSeriesAccessors: ['g'],
  data: [],
});
const STANDARD_DATA_SET = MockSeriesSpec.area({
  xScaleType: ScaleType.Linear,
  yAccessors: ['y1'],
  splitSeriesAccessors: ['g'],
  data: [
    { x: 0, y1: 10, g: 'a' },
    { x: 0, y1: 20, g: 'b' },
    { x: 0, y1: 30, g: 'c' },
  ],
});
const WITH_NULL_DATASET = MockSeriesSpec.area({
  xScaleType: ScaleType.Linear,
  yAccessors: ['y1'],
  splitSeriesAccessors: ['g'],
  data: [
    { x: 0, y1: 10, g: 'a' },
    { x: 0, y1: null, g: 'b' },
    { x: 0, y1: 30, g: 'c' },
  ],
});
const STANDARD_DATA_SET_WY0 = MockSeriesSpec.area({
  xScaleType: ScaleType.Linear,
  yAccessors: ['y1'],
  y0Accessors: ['y0'],
  splitSeriesAccessors: ['g'],
  data: [
    { x: 0, y0: 2, y1: 10, g: 'a' },
    { x: 0, y0: 4, y1: 20, g: 'b' },
    { x: 0, y0: 6, y1: 30, g: 'c' },
  ],
});
const WITH_NULL_DATASET_WY0 = MockSeriesSpec.area({
  xScaleType: ScaleType.Linear,
  yAccessors: ['y1'],
  y0Accessors: ['y0'],
  splitSeriesAccessors: ['g'],
  data: [
    { x: 0, y0: 2, y1: 10, g: 'a' },
    { x: 0, y1: null, g: 'b' },
    { x: 0, y0: 6, y1: 30, g: 'c' },
  ],
});
const DATA_SET_WITH_NULL_2 = MockSeriesSpec.area({
  xScaleType: ScaleType.Linear,
  yAccessors: ['y1'],
  splitSeriesAccessors: ['g'],
  data: [
    { x: 1, y1: 1, g: 'a' },
    { x: 2, y1: 2, g: 'a' },
    { x: 4, y1: 4, g: 'a' },
    { x: 1, y1: 21, g: 'b' },
    { x: 3, y1: 23, g: 'b' },
  ],
});
describe('Non-Stacked Series Utils', () => {
  describe('Format stacked dataset', () => {
    test('empty data', () => {
      const store = MockStore.default();
      MockStore.addSpecs(EMPTY_DATA_SET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());
      expect(formattedDataSeries).toHaveLength(0);
    });
    test('format data without nulls', () => {
      const store = MockStore.default();
      MockStore.addSpecs(STANDARD_DATA_SET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 10,
        x: 0,
        y0: null,
        y1: 10,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 20,
        x: 0,
        y0: null,
        y1: 20,
        mark: null,
      });
      expect(formattedDataSeries[2].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 30,
        x: 0,
        y0: null,
        y1: 30,
        mark: null,
      });
    });
    test('format data with nulls', () => {
      const store = MockStore.default();
      MockStore.addSpecs(WITH_NULL_DATASET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: null,
        y0: null,
        mark: null,
      });
    });
    test('format data without nulls with y0 values', () => {
      const store = MockStore.default();
      MockStore.addSpecs(STANDARD_DATA_SET_WY0, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: 2,
        initialY1: 10,
        x: 0,
        y0: 2,
        y1: 10,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: 4,
        initialY1: 20,
        x: 0,
        y0: 4,
        y1: 20,
        mark: null,
      });
      expect(formattedDataSeries[2].data[0]).toMatchObject({
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 6,
        y1: 30,
        mark: null,
      });
    });
    test('format data with nulls - fit functions', () => {
      const store = MockStore.default();
      MockStore.addSpecs(WITH_NULL_DATASET_WY0, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: 2,
        initialY1: 10,
        x: 0,
        y0: 2,
        y1: 10,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: null,
        y0: null,
        mark: null,
      });
      expect(formattedDataSeries[2].data[0]).toMatchObject({
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 6,
        y1: 30,
        mark: null,
      });
    });
    test('format data without nulls on second series', () => {
      const store = MockStore.default();
      MockStore.addSpecs(DATA_SET_WITH_NULL_2, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries.length).toBe(2);
      // this because linear non stacked area/lines doesn't fill up the dataset
      // with missing x data points
      expect(formattedDataSeries[0].data.length).toBe(3);
      expect(formattedDataSeries[1].data.length).toBe(2);

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 1,
        x: 1,
        y0: null, // todo check if we can move that to 0
        y1: 1,
        mark: null,
      });
      expect(formattedDataSeries[0].data[1]).toMatchObject({
        initialY0: null,
        initialY1: 2,
        x: 2,
        y0: null,
        y1: 2,
        mark: null,
      });
      expect(formattedDataSeries[0].data[2]).toMatchObject({
        initialY0: null,
        initialY1: 4,
        x: 4,
        y0: null,
        y1: 4,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 21,
        x: 1,
        y0: null,
        y1: 21,
        mark: null,
      });
      expect(formattedDataSeries[1].data[1]).toMatchObject({
        initialY0: null,
        initialY1: 23,
        x: 3,
        y0: null,
        y1: 23,
        mark: null,
      });
    });
  });

  describe('Using fit functions', () => {
    describe.each(['area', 'line'])('Spec type - %s', (specType) => {
      const dataSeries = [MockDataSeries.fitFunction({ shuffle: false })];
      const dataSeriesData = MockDataSeries.fitFunction({ shuffle: false }).data;
      const spec =
        specType === 'area' ? MockSeriesSpec.area({ fit: Fit.Linear }) : MockSeriesSpec.line({ fit: Fit.Linear });
      const seriesSpecs = MockSeriesSpecs.fromSpecs([spec]);

      beforeAll(() => {
        jest.spyOn(fitFunctionModule, 'fitFunction').mockReturnValue(dataSeriesData);
      });

      it('return call fitFunction with args', () => {
        testModule.applyFitFunctionToDataSeries(dataSeries, seriesSpecs, ScaleType.Linear);

        expect(fitFunctionModule.fitFunction).toHaveBeenCalledWith(dataSeriesData, Fit.Linear, ScaleType.Linear);
      });

      it('return not call fitFunction if no fit specified', () => {
        const currentSpec =
          specType === 'area' ? MockSeriesSpec.area({ fit: undefined }) : MockSeriesSpec.line({ fit: undefined });
        const noFitSpec = MockSeriesSpecs.fromSpecs([currentSpec]);
        testModule.applyFitFunctionToDataSeries(dataSeries, noFitSpec, ScaleType.Linear);

        expect(fitFunctionModule.fitFunction).not.toHaveBeenCalled();
      });

      it('return fitted dataSeries', () => {
        const actual = testModule.applyFitFunctionToDataSeries(dataSeries, seriesSpecs, ScaleType.Linear);

        expect(actual[0].data).toBe(dataSeriesData);
      });
    });

    describe('Non area and line specs', () => {
      const dataSeries = [MockDataSeries.fitFunction({ shuffle: false })];
      const dataSeriesData = MockDataSeries.fitFunction({ shuffle: false }).data;
      const spec = MockSeriesSpec.bar();
      const seriesSpecs = MockSeriesSpecs.fromSpecs([spec]);

      beforeAll(() => {
        jest.spyOn(fitFunctionModule, 'fitFunction').mockReturnValue(dataSeriesData);
      });

      it('return call fitFunction with args', () => {
        testModule.applyFitFunctionToDataSeries(dataSeries, seriesSpecs, ScaleType.Linear);

        expect(fitFunctionModule.fitFunction).not.toHaveBeenCalled();
      });

      it('return fitted dataSeries', () => {
        const actual = testModule.applyFitFunctionToDataSeries(dataSeries, seriesSpecs, ScaleType.Linear);

        expect(actual[0].data).toBe(dataSeriesData);
      });
    });
  });
});
