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
 * under the License. */

import {
  MockDataSeries,
  getFilledNullData,
  getFilledNonNullData,
  getYResolvedData,
  MockDataSeriesDatum,
} from '../../../mocks';
import { Fit } from './specs';
import { ScaleType } from '../../../scales';
import { DataSeries } from './series';

import * as seriesUtils from './stacked_series_utils';
import * as testModule from './fit_function';

describe('Fit Function', () => {
  describe('getValue', () => {
    describe('Non-Ordinal scale', () => {
      it('should return current datum if next and previous are null with no endValue', () => {
        const current = MockDataSeriesDatum.default();
        const actual = testModule.getValue(current, 0, null, null, Fit.Average);

        expect(actual).toBe(current);
        expect(actual.filled).toBeUndefined();
      });

      it('should return current datum with filled endValue if next and previous are null with endValue', () => {
        const current = MockDataSeriesDatum.default();
        const actual = testModule.getValue(current, 0, null, null, Fit.Average, 100);

        expect(actual.filled?.y1).toBe(100);
      });

      describe('previous is not null and fit type is Carry', () => {
        it('should return current datum with value from next when previous is null', () => {
          const previous = MockDataSeriesDatum.full({ x: 0, y1: 20 });
          const current = MockDataSeriesDatum.simple({ x: 3 });
          const actual = testModule.getValue(current, 0, previous, null, Fit.Carry);

          expect(actual).toMatchObject(current);
          expect(actual.filled).toEqual({
            y1: 20,
          });
        });
      });

      describe('next is not null and fit type is Lookahead', () => {
        it('should return current datum with value from next when previous is null', () => {
          const current = MockDataSeriesDatum.simple({ x: 3 });
          const next = MockDataSeriesDatum.full({ x: 4, y1: 20 });
          const actual = testModule.getValue(current, 0, null, next, Fit.Lookahead);

          expect(actual).toMatchObject(current);
          expect(actual.filled).toEqual({
            y1: 20,
          });
        });
      });

      describe('current and previous datums are not null', () => {
        describe('Average - fit type', () => {
          it('should return current datum with average values from previous and next', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 10 });
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const next = MockDataSeriesDatum.full({ x: 4, y1: 20 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Average);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: (10 + 20) / 2,
            });
          });
        });

        describe('Nearest - fit type', () => {
          it('should return current datum with values from previous not next', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 10 });
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const next = MockDataSeriesDatum.full({ x: 10, y1: 20 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 10,
            });
          });

          it('should return current datum with values from next not previous', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 10 });
            const current = MockDataSeriesDatum.simple({ x: 9 });
            const next = MockDataSeriesDatum.full({ x: 10, y1: 20 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });
        });

        describe('Linear - fit type', () => {
          it('should return average from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 10 });
            const current = MockDataSeriesDatum.simple({ x: 5 });
            const next = MockDataSeriesDatum.full({ x: 10, y1: 20 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: (10 + 20) / 2,
            });
          });

          it('should return positive slope interpolated value from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 10 });
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const next = MockDataSeriesDatum.full({ x: 10, y1: 20 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 13,
            });
          });

          it('should return negative slope interpolated value from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 20 });
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const next = MockDataSeriesDatum.full({ x: 10, y1: 10 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 17,
            });
          });

          it('should return complex interpolated value from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 0.767, y1: 10.545 });
            const current = MockDataSeriesDatum.simple({ x: 3.564 });
            const next = MockDataSeriesDatum.full({ x: 10.767, y1: 20.657 });
            const actual = testModule.getValue(current, 0, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 13.3733264,
            });
          });
        });
      });

      describe('next or previous datums are not null - with fits requring bounding datums', () => {
        describe('Nearest - fit type', () => {
          it('should return current datum with value from next when previous is null', () => {
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const next = MockDataSeriesDatum.full({ x: 4, y1: 20 });
            const actual = testModule.getValue(current, 0, null, next, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });

          it('should return current datum with value from next when previous is null', () => {
            const previous = MockDataSeriesDatum.full({ x: 4, y1: 20 });
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const actual = testModule.getValue(current, 0, previous, null, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });
        });

        describe(`endValue is set to 'nearest'`, () => {
          it('should return current datum with value from next when previous is null', () => {
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const next = MockDataSeriesDatum.full({ x: 4, y1: 20 });
            const actual = testModule.getValue(current, 0, null, next, Fit.Average, 'nearest');

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });

          it('should return current datum with value from next when previous is null', () => {
            const previous = MockDataSeriesDatum.full({ x: 0, y1: 20 });
            const current = MockDataSeriesDatum.simple({ x: 3 });
            const actual = testModule.getValue(current, 0, previous, null, Fit.Average, 'nearest');

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });
        });
      });
    });
    describe('Ordinal scale', () => {
      it('should return current datum if next and previous are null with no endValue', () => {
        const current = MockDataSeriesDatum.ordinal();
        const actual = testModule.getValue(current, 0, null, null, Fit.Average);

        expect(actual).toBe(current);
        expect(actual.filled).toBeUndefined();
      });

      it('should return current datum with filled endValue if next and previous are null with endValue', () => {
        const current = MockDataSeriesDatum.ordinal();
        const actual = testModule.getValue(current, 0, null, null, Fit.Average, 100);

        expect(actual.filled?.y1).toBe(100);
      });

      describe('previous is not null and fit type is Carry', () => {
        it('should return current datum with value from next when previous is null', () => {
          const previous = MockDataSeriesDatum.full({ x: 'a', y1: 20, fittingIndex: 0 });
          const current = MockDataSeriesDatum.simple({ x: 'c' });
          const actual = testModule.getValue(current, 3, previous, null, Fit.Carry);

          expect(actual).toMatchObject(current);
          expect(actual.filled).toEqual({
            y1: 20,
          });
        });
      });

      describe('next is not null and fit type is Lookahead', () => {
        it('should return current datum with value from next when previous is null', () => {
          const current = MockDataSeriesDatum.simple({ x: 'c' });
          const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 4 });
          const actual = testModule.getValue(current, 3, null, next, Fit.Lookahead);

          expect(actual).toMatchObject(current);
          expect(actual.filled).toEqual({
            y1: 20,
          });
        });
      });

      describe('current and previous datums are not null', () => {
        describe('Average - fit type', () => {
          it('should return current datum with average values from previous and next', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', y1: 10, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 4 });
            const actual = testModule.getValue(current, 3, previous, next, Fit.Average);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: (10 + 20) / 2,
            });
          });
        });

        describe('Nearest - fit type', () => {
          it('should return current datum with values from previous not next', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', y1: 10, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 10 });
            const actual = testModule.getValue(current, 3, previous, next, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 10,
            });
          });

          it('should return current datum with values from next not previous', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', y1: 10, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 10 });
            const actual = testModule.getValue(current, 9, previous, next, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });
        });

        describe('Linear - fit type', () => {
          it('should return average from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', y1: 10, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 10 });
            const actual = testModule.getValue(current, 5, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: (10 + 20) / 2,
            });
          });

          it('should return positive slope interpolated value from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', y1: 10, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 10 });
            const actual = testModule.getValue(current, 3, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 13,
            });
          });

          it('should return negative slope interpolated value from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', y1: 20, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 10, fittingIndex: 10 });
            const actual = testModule.getValue(current, 3, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 17,
            });
          });

          it('should return complex interpolated value from equidistant previous and next datums', () => {
            const previous = MockDataSeriesDatum.full({ x: 'a', fittingIndex: 0.767, y1: 10.545 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', fittingIndex: 10.767, y1: 20.657 });
            const actual = testModule.getValue(current, 3.564, previous, next, Fit.Linear);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 13.3733264,
            });
          });
        });
      });

      describe('next or previous datums are not null - with fits requring bounding datums', () => {
        describe('Nearest - fit type', () => {
          it('should return current datum with value from next when previous is null', () => {
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 4 });
            const actual = testModule.getValue(current, 3, null, next, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });

          it('should return current datum with value from next when previous is null', () => {
            const previous = MockDataSeriesDatum.full({ x: 4, y1: 20, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const actual = testModule.getValue(current, 3, previous, null, Fit.Nearest);

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });
        });

        describe("endValue is set to 'nearest'", () => {
          it('should return current datum with value from next when previous is null', () => {
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const next = MockDataSeriesDatum.full({ x: 'e', y1: 20, fittingIndex: 4 });
            const actual = testModule.getValue(current, 3, null, next, Fit.Average, 'nearest');

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });

          it('should return current datum with value from next when previous is null', () => {
            const previous = MockDataSeriesDatum.full({ x: 4, y1: 20, fittingIndex: 0 });
            const current = MockDataSeriesDatum.simple({ x: 'c' });
            const actual = testModule.getValue(current, 3, previous, null, Fit.Average, 'nearest');

            expect(actual).toMatchObject(current);
            expect(actual.filled).toEqual({
              y1: 20,
            });
          });
        });
      });
    });
  });

  describe('parseConfig', () => {
    it('should return default type when none exists', () => {
      const actual = testModule.parseConfig();

      expect(actual).toEqual({
        type: Fit.None,
      });
    });

    it('should parse string config', () => {
      const actual = testModule.parseConfig(Fit.Average);

      expect(actual).toEqual({
        type: Fit.Average,
      });
    });

    it('should return default when Explicit is passes without value', () => {
      const actual = testModule.parseConfig({ type: Fit.Explicit });

      expect(actual).toEqual({
        type: Fit.None,
      });
    });

    it('should return type and value when Explicit is passes with value', () => {
      const actual = testModule.parseConfig({ type: Fit.Explicit, value: 20 });

      expect(actual).toEqual({
        type: Fit.Explicit,
        value: 20,
        endValue: undefined,
      });
    });

    it('should return type when no value or endValue is given', () => {
      const actual = testModule.parseConfig({ type: Fit.Average });

      expect(actual).toEqual({
        type: Fit.Average,
        value: undefined,
        endValue: undefined,
      });
    });

    it('should return type and endValue when endValue is passed', () => {
      const actual = testModule.parseConfig({ type: Fit.Average, endValue: 20 });

      expect(actual).toEqual({
        type: Fit.Average,
        value: undefined,
        endValue: 20,
      });
    });
  });

  describe('fitFunction', () => {
    let dataSeries: DataSeries;

    beforeAll(() => {
      jest.spyOn(testModule, 'parseConfig');
      jest.spyOn(testModule, 'getValue');
      dataSeries = MockDataSeries.fitFunction();
    });

    describe('allow mutliple fit config types', () => {
      it('should allow string config', () => {
        testModule.fitFunction(dataSeries, Fit.None, ScaleType.Linear);

        expect(testModule.parseConfig).toHaveBeenCalledWith(Fit.None);
        expect(testModule.parseConfig).toHaveBeenCalledTimes(1);
      });

      it('should allow object config', () => {
        const fitConfig = {
          type: Fit.None,
        };
        testModule.fitFunction(dataSeries, fitConfig, ScaleType.Linear);

        expect(testModule.parseConfig).toHaveBeenCalledWith(fitConfig);
        expect(testModule.parseConfig).toHaveBeenCalledTimes(1);
      });
    });

    describe('sorting', () => {
      const spies: jest.SpyInstance[] = [];
      const mockArray: any[] = [];
      // @ts-ignore
      jest.spyOn(mockArray, 'sort');

      beforeAll(() => {
        // @ts-ignore
        spies.push(jest.spyOn(dataSeries.data, 'sort'));
        // @ts-ignore
        spies.push(jest.spyOn(dataSeries.data, 'slice').mockReturnValue(mockArray));
      });

      afterAll(() => {
        spies.forEach((s) => s.mockRestore());
      });

      it('should call splice sort only', () => {
        testModule.fitFunction(dataSeries, Fit.Linear, ScaleType.Linear);

        expect(dataSeries.data.sort).not.toHaveBeenCalled();
        expect(dataSeries.data.slice).toHaveBeenCalledTimes(1);
        expect(mockArray.sort).toHaveBeenCalledTimes(1);
      });

      it('should not call splice.sort if sorted is true', () => {
        testModule.fitFunction(dataSeries, Fit.Linear, ScaleType.Linear, true);

        expect(dataSeries.data.slice).not.toHaveBeenCalled();
        expect(mockArray.sort).not.toHaveBeenCalled();
      });

      it('should not call splice.sort if scale is ordinal', () => {
        testModule.fitFunction(dataSeries, Fit.Linear, ScaleType.Ordinal);

        expect(dataSeries.data.slice).not.toHaveBeenCalled();
        expect(mockArray.sort).not.toHaveBeenCalled();
      });

      it('should call splice.sort with predicate', () => {
        jest.spyOn(seriesUtils, 'datumXSortPredicate');
        testModule.fitFunction(dataSeries, Fit.Linear, ScaleType.Linear);

        expect(seriesUtils.datumXSortPredicate).toHaveBeenCalledWith(Fit.Linear);
      });
    });

    describe.each([ScaleType.Linear, ScaleType.Ordinal])('ScaleType - %s', (scaleType) => {
      const ordinal = scaleType === ScaleType.Ordinal;

      beforeAll(() => {
        dataSeries = MockDataSeries.fitFunction({ ordinal });
      });

      describe('EndValues', () => {
        const sortedDS = MockDataSeries.fitFunction({ ordinal, shuffle: false });

        describe('number value', () => {
          const endValue = 100;
          it('should set end values - None', () => {
            const actual = testModule.fitFunction(sortedDS, { type: Fit.None, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toBeNull();
            expect(finalValues[finalValues.length - 1]).toBeNull();
          });

          it('should set end values - Zero', () => {
            const actual = testModule.fitFunction(sortedDS, { type: Fit.Zero, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(0);
            expect(finalValues[finalValues.length - 1]).toEqual(0);
          });

          it('should set end values - Explicit', () => {
            const actual = testModule.fitFunction(sortedDS, { type: Fit.Explicit, value: 20, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(20);
            expect(finalValues[finalValues.length - 1]).toEqual(20);
          });

          it('should set end values - Lookahead', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Lookahead, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(3);
            expect(finalValues[finalValues.length - 1]).toEqual(endValue);
          });

          it('should set end values - Nearest', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Nearest, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(3);
            expect(finalValues[finalValues.length - 1]).toEqual(12);
          });

          it('should set end values - Average', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Average, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(endValue);
            expect(finalValues[finalValues.length - 1]).toEqual(endValue);
          });

          it('should set end values - Linear', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Linear, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(endValue);
            expect(finalValues[finalValues.length - 1]).toEqual(endValue);
          });
        });

        describe("'nearest' value", () => {
          const endValue = 'nearest';

          it('should set end values - None', () => {
            const actual = testModule.fitFunction(sortedDS, { type: Fit.None, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toBeNull();
            expect(finalValues[finalValues.length - 1]).toBeNull();
          });

          it('should set end values - Zero', () => {
            const actual = testModule.fitFunction(sortedDS, { type: Fit.Zero, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(0);
            expect(finalValues[finalValues.length - 1]).toEqual(0);
          });

          it('should set end values - Explicit', () => {
            const actual = testModule.fitFunction(sortedDS, { type: Fit.Explicit, value: 20, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(20);
            expect(finalValues[finalValues.length - 1]).toEqual(20);
          });

          it('should set end values - Lookahead', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Lookahead, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(3);
            expect(finalValues[finalValues.length - 1]).toEqual(12);
          });

          it('should set end values - Nearest', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Nearest, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(3);
            expect(finalValues[finalValues.length - 1]).toEqual(12);
          });

          it('should set end values - Average', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Average, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(3);
            expect(finalValues[finalValues.length - 1]).toEqual(12);
          });

          it('should set end values - Linear', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Linear, endValue }, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues[0]).toEqual(3);
            expect(finalValues[finalValues.length - 1]).toEqual(12);
          });
        });
      });

      describe('Fit Types', () => {
        describe('None', () => {
          it('should return original dataSeries', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.None, scaleType);

            expect(actual).toBe(dataSeries);
          });

          it('should return null data values without fit', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.None, scaleType);

            expect(getFilledNullData(actual.data)).toEqualArrayOf(undefined, 7);
          });
        });

        describe('Zero', () => {
          it('should NOT return original dataSeries', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Zero, scaleType);

            expect(actual).not.toBe(dataSeries);
          });

          it('should return null data values with zeros', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Zero, scaleType);
            const testActual = getFilledNullData(actual.data);

            expect(testActual).toEqualArrayOf(0, 7);
          });
        });

        describe('Explicit', () => {
          it('should return original dataSeries if no value provided', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Explicit }, scaleType);

            expect(actual).toBe(dataSeries);
          });

          it('should return null data values with set value', () => {
            const actual = testModule.fitFunction(dataSeries, { type: Fit.Explicit, value: 20 }, scaleType);
            const testActual = getFilledNullData(actual.data);

            expect(testActual).toEqualArrayOf(20, 7);
          });
        });

        describe('Lookahead', () => {
          it('should not return original dataSeries', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Lookahead, scaleType);

            expect(actual).not.toBe(dataSeries);
          });

          it('should not fill non-null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Lookahead, scaleType);

            expect(getFilledNonNullData(actual.data)).toEqualArrayOf(undefined, 6);
          });

          it('should call getValue for first datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Lookahead, scaleType);
            const [current, next] = ds.data;

            expect(testModule.getValue).nthCalledWith(
              1,
              expect.objectContaining(current),
              0,
              null,
              expect.objectContaining(next),
              Fit.Lookahead,
              undefined,
            );
          });

          it('should call getValue for 10th (4th null) datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            const actual = testModule.fitFunction(ds, Fit.Lookahead, scaleType);
            const previous = actual.data[7];
            const current = ds.data[8];
            const next = ds.data[11];

            expect(testModule.getValue).nthCalledWith(
              4,
              expect.objectContaining(current),
              8,
              expect.objectContaining(previous),
              expect.objectContaining(next),
              Fit.Lookahead,
              undefined,
            );
          });

          it('should call getValue for last datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Lookahead, scaleType);
            const [current, previous] = ds.data.slice().reverse();

            expect(testModule.getValue).lastCalledWith(
              expect.objectContaining(current),
              12,
              expect.objectContaining(previous),
              null,
              Fit.Lookahead,
              undefined,
            );
          });

          it('should call getValue for only null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Lookahead, scaleType);
            const length = getFilledNullData(actual.data).length;

            expect(testModule.getValue).toBeCalledTimes(length);
          });

          it('should fill null values correctly', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Lookahead, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues).toEqual([3, 3, 5, 4, 4, 5, 5, 6, 12, 12, 12, 12, null]);
          });
        });
        describe('Nearest', () => {
          it('should not return original dataSeries', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Nearest, scaleType);

            expect(actual).not.toBe(dataSeries);
          });

          it('should not fill non-null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Nearest, scaleType);

            expect(getFilledNonNullData(actual.data)).toEqualArrayOf(undefined, 6);
          });

          it('should call getValue for first datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Nearest, scaleType);
            const [current, next] = ds.data;

            expect(testModule.getValue).nthCalledWith(
              1,
              expect.objectContaining(current),
              0,
              null,
              expect.objectContaining(next),
              Fit.Nearest,
              undefined,
            );
          });

          it('should call getValue for 10th (4th null) datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            const actual = testModule.fitFunction(ds, Fit.Nearest, scaleType);
            const previous = actual.data[7];
            const current = ds.data[8];
            const next = ds.data[11];

            expect(testModule.getValue).nthCalledWith(
              4,
              expect.objectContaining(current),
              8,
              expect.objectContaining(previous),
              expect.objectContaining(next),
              Fit.Nearest,
              undefined,
            );
          });

          it('should call getValue for last datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Nearest, scaleType);
            const [current, previous] = ds.data.slice().reverse();

            expect(testModule.getValue).lastCalledWith(
              expect.objectContaining(current),
              12,
              expect.objectContaining(previous),
              null,
              Fit.Nearest,
              undefined,
            );
          });

          it('should call getValue for only null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Nearest, scaleType);
            const length = getFilledNullData(actual.data).length;

            expect(testModule.getValue).toBeCalledTimes(length);
          });

          it('should fill null values correctly', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Nearest, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues).toEqual([3, 3, 5, 5, 4, 4, 5, 6, 6, 6, 12, 12, 12]);
          });
        });

        describe('Average', () => {
          it('should not return original dataSeries', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Average, scaleType);

            expect(actual).not.toBe(dataSeries);
          });

          it('should not fill non-null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Average, scaleType);

            expect(getFilledNonNullData(actual.data)).toEqualArrayOf(undefined, 6);
          });

          it('should call getValue for first datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Average, scaleType);
            const [current, next] = ds.data;

            expect(testModule.getValue).nthCalledWith(
              1,
              expect.objectContaining(current),
              0,
              null,
              expect.objectContaining(next),
              Fit.Average,
              undefined,
            );
          });

          it('should call getValue for 10th (4th null) datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            const actual = testModule.fitFunction(ds, Fit.Average, scaleType);
            const previous = actual.data[7];
            const current = ds.data[8];
            const next = ds.data[11];

            expect(testModule.getValue).nthCalledWith(
              4,
              expect.objectContaining(current),
              8,
              expect.objectContaining(previous),
              expect.objectContaining(next),
              Fit.Average,
              undefined,
            );
          });

          it('should call getValue for last datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Average, scaleType);
            const [current, previous] = ds.data.slice().reverse();

            expect(testModule.getValue).lastCalledWith(
              expect.objectContaining(current),
              12,
              expect.objectContaining(previous),
              null,
              Fit.Average,
              undefined,
            );
          });

          it('should call getValue for only null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Average, scaleType);
            const length = getFilledNullData(actual.data).length;

            expect(testModule.getValue).toBeCalledTimes(length);
          });

          it('should fill null values correctly', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Average, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues).toEqual([null, 3, 5, 4.5, 4, 4.5, 5, 6, 9, 9, 9, 12, null]);
          });
        });

        describe('Linear', () => {
          it('should not return original dataSeries', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Linear, scaleType);

            expect(actual).not.toBe(dataSeries);
          });

          it('should not fill non-null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Linear, scaleType);

            expect(getFilledNonNullData(actual.data)).toEqualArrayOf(undefined, 6);
          });

          it('should call getValue for first datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Linear, scaleType);
            const [current, next] = ds.data;

            expect(testModule.getValue).nthCalledWith(
              1,
              expect.objectContaining(current),
              0,
              null,
              expect.objectContaining(next),
              Fit.Linear,
              undefined,
            );
          });

          it('should call getValue for 10th (4th null) datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            const actual = testModule.fitFunction(ds, Fit.Linear, scaleType);
            const previous = actual.data[7];
            const current = ds.data[8];
            const next = ds.data[11];

            expect(testModule.getValue).nthCalledWith(
              4,
              expect.objectContaining(current),
              8,
              expect.objectContaining(previous),
              expect.objectContaining(next),
              Fit.Linear,
              undefined,
            );
          });

          it('should call getValue for last datum with correct args', () => {
            const ds = MockDataSeries.fitFunction({ ordinal, shuffle: false });
            testModule.fitFunction(ds, Fit.Linear, scaleType);
            const [current, previous] = ds.data.slice().reverse();

            expect(testModule.getValue).lastCalledWith(
              expect.objectContaining(current),
              12,
              expect.objectContaining(previous),
              null,
              Fit.Linear,
              undefined,
            );
          });

          it('should call getValue for only null values', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Linear, scaleType);
            const length = getFilledNullData(actual.data).length;

            expect(testModule.getValue).toBeCalledTimes(length);
          });

          it('should fill null values correctly', () => {
            const actual = testModule.fitFunction(dataSeries, Fit.Linear, scaleType);
            const finalValues = getYResolvedData(actual.data);

            expect(finalValues).toEqual([null, 3, 5, 4.5, 4, 4.5, 5, 6, 7.5, 9, 10.5, 12, null]);
          });
        });
      });
    });
  });
});
