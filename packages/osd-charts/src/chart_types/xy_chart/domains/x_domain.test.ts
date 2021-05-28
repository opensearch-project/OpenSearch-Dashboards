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

import { ChartType } from '../..';
import { MockGlobalSpec, MockSeriesSpec, MockSeriesSpecs } from '../../../mocks/specs';
import { ScaleType } from '../../../scales/constants';
import { SpecType, Direction, BinAgg } from '../../../specs/constants';
import { Logger } from '../../../utils/logger';
import { getXNiceFromSpec, getXScaleTypeFromSpec } from '../scales/get_api_scales';
import { getScaleConfigsFromSpecs } from '../state/selectors/get_api_scale_configs';
import { getDataSeriesFromSpecs } from '../utils/series';
import { BasicSeriesSpec, SeriesType } from '../utils/specs';
import { convertXScaleTypes, findMinInterval, mergeXDomain } from './x_domain';

jest.mock('../../../utils/logger', () => ({
  Logger: {
    warn: jest.fn(),
  },
}));

describe('X Domain', () => {
  test('Should return a default scale when missing specs or specs types', () => {
    const seriesSpecs: BasicSeriesSpec[] = [];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).not.toBeNull();
  });

  test('Should return correct scale type with single bar', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[] = [
      {
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Linear,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Linear),
      nice: getXNiceFromSpec(),
      isBandScale: true,
    });
  });

  test('Should return correct scale type with single bar with Ordinal', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[] = [
      {
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Ordinal,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Ordinal),
      nice: getXNiceFromSpec(),
      isBandScale: true,
    });
  });

  test('Should return correct scale type with single area', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[] = [
      {
        seriesType: SeriesType.Area,
        xScaleType: ScaleType.Linear,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Linear),
      nice: getXNiceFromSpec(),
      isBandScale: false,
    });
  });
  test('Should return correct scale type with single line (time)', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>[] = [
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Time,
        timeZone: 'utc-3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Time),
      nice: getXNiceFromSpec(),
      isBandScale: false,
      timeZone: 'utc-3',
    });
  });
  test('Should return correct scale type with multi line with same scale types (time) same tz', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>[] = [
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Time,
        timeZone: 'UTC-3',
      },
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Time,
        timeZone: 'utc-3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Time),
      nice: getXNiceFromSpec(),
      isBandScale: false,
      timeZone: 'utc-3',
    });
  });
  test('Should return correct scale type with multi line with same scale types (time) coerce to UTC', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>[] = [
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Time,
        timeZone: 'utc-3',
      },
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Time,
        timeZone: 'utc+3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Time),
      nice: getXNiceFromSpec(),
      isBandScale: false,
      timeZone: 'utc',
    });
  });

  test('Should return correct scale type with multi line with different scale types (linear, ordinal)', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[] = [
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Linear,
      },
      {
        seriesType: SeriesType.Line,
        xScaleType: ScaleType.Ordinal,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Ordinal),
      nice: getXNiceFromSpec(),
      isBandScale: false,
    });
  });
  test('Should return correct scale type with multi bar, area with different scale types (linear, ordinal)', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[] = [
      {
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Linear,
      },
      {
        seriesType: SeriesType.Area,
        xScaleType: ScaleType.Ordinal,
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Ordinal),
      nice: getXNiceFromSpec(),
      isBandScale: true,
    });
  });
  test('Should return correct scale type with multi bar, area with same scale types (linear, linear)', () => {
    const seriesSpecs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>[] = [
      {
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Linear,
      },
      {
        seriesType: SeriesType.Area,
        xScaleType: ScaleType.Time,
        timeZone: 'utc+3',
      },
    ];
    const mainXScale = convertXScaleTypes(seriesSpecs);
    expect(mainXScale).toEqual({
      type: getXScaleTypeFromSpec(ScaleType.Linear),
      nice: getXNiceFromSpec(),
      isBandScale: true,
    });
  });

  test('Should merge line series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g1',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries: BasicSeriesSpec[] = [ds1, ds2];
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());
    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge bar series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());
    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge multi bar series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());
    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge multi bar series correctly - 2', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];

    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());

    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 7]);
  });
  test('Should merge multi bar linear/bar ordinal series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());
    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });

  test('Should fallback to ordinal scale if not array of numbers', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 'a', y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];
    const customDomain = {
      min: 0,
    };

    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const scalesConfig = getScaleConfigsFromSpecs(
      [],
      specDataSeries,
      MockGlobalSpec.settings({ xDomain: customDomain }),
    );

    const getResult = () => mergeXDomain(scalesConfig.x, xValues, ScaleType.Ordinal);

    expect(getResult).not.toThrow();

    const mergedDomain = getResult();
    expect(mergedDomain.domain).toEqual([0, 'a', 2, 5, 7]);
    expect(mergedDomain.type).toEqual(ScaleType.Ordinal);
  });

  test('Should merge multi bar/line ordinal series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];

    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());

    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });
  test('Should merge multi bar/line time series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Bar,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];

    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());

    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });
  test('Should merge multi lines series correctly', () => {
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 5, y: 0 },
      ],
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: [
        { x: 0, y: 0 },
        { x: 7, y: 0 },
      ],
    };
    const specDataSeries = [ds1, ds2];

    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());

    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
    expect(mergedDomain.domain).toEqual([0, 1, 2, 5, 7]);
  });

  test('Should merge X multi high volume of data', () => {
    const maxValues = 10000;
    const ds1: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds1',
      groupId: 'g1',
      seriesType: SeriesType.Area,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
    };
    const ds2: BasicSeriesSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Series,
      id: 'ds2',
      groupId: 'g2',
      seriesType: SeriesType.Line,
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
      data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
    };
    const specDataSeries = [ds1, ds2];

    const { xValues } = getDataSeriesFromSpecs(specDataSeries);
    const scalesConfig = getScaleConfigsFromSpecs([], specDataSeries, MockGlobalSpec.settings());

    const mergedDomain = mergeXDomain(scalesConfig.x, xValues);
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
  test('should compute minInterval an list greater than 9', () => {
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
    const specs = [MockSeriesSpec.line({ xScaleType: ScaleType.Linear })];

    const basicMergedDomain = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain })).x,
      xValues,
    );
    expect(basicMergedDomain.domain).toEqual([0, 3]);

    const arrayXDomain = [1, 2];
    let { domain } = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: arrayXDomain })).x,
      xValues,
    );
    expect(domain).toEqual([1, 5]);
    const warnMessage = 'xDomain for continuous scale should be a DomainRange object, not an array';
    expect(Logger.warn).toBeCalledWith(warnMessage);

    (Logger.warn as jest.Mock).mockClear();

    const invalidXDomain = { min: 10, max: 0 };
    domain = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: invalidXDomain })).x,
      xValues,
    ).domain;
    expect(domain).toEqual([1, 5]);
    expect(Logger.warn).toBeCalledWith('custom xDomain is invalid, min is greater than max. Custom domain is ignored.');
  });

  test('should account for custom domain when merging a linear domain: lower bounded domain', () => {
    const xValues = new Set([1, 2, 3, 4, 5]);
    const xDomain = { min: 0 };
    const specs = [MockSeriesSpec.line({ xScaleType: ScaleType.Linear })];

    const mergedDomain = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain })).x,
      xValues,
    );
    expect(mergedDomain.domain).toEqual([0, 5]);

    const invalidXDomain = { min: 10 };
    const { domain } = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: invalidXDomain })).x,
      xValues,
    );
    expect(domain).toEqual([1, 5]);
    expect(Logger.warn).toBeCalledWith(
      'custom xDomain is invalid, custom min is greater than computed max. Custom domain is ignored.',
    );
  });

  test('should account for custom domain when merging a linear domain: upper bounded domain', () => {
    const xValues = new Set([1, 2, 3, 4, 5]);
    const xDomain = { max: 3 };
    const specs = [MockSeriesSpec.line({ xScaleType: ScaleType.Linear })];

    const mergedDomain = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain })).x,
      xValues,
    );
    expect(mergedDomain.domain).toEqual([1, 3]);

    const invalidXDomain = { max: -1 };
    const { domain } = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: invalidXDomain })).x,
      xValues,
    );
    expect(domain).toEqual([1, 5]);
    expect(Logger.warn).toBeCalledWith(
      'custom xDomain is invalid, computed min is greater than custom max. Custom domain is ignored.',
    );
  });

  test('should account for custom domain when merging an ordinal domain', () => {
    const xValues = new Set(['a', 'b', 'c', 'd']);
    const xDomain = ['a', 'b', 'c'];
    const specs = [MockSeriesSpec.bar({ xScaleType: ScaleType.Ordinal })];
    const basicMergedDomain = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain })).x,
      xValues,
    );
    expect(basicMergedDomain.domain).toEqual(['a', 'b', 'c']);

    const objectXDomain = { max: 10, min: 0 };
    const { domain } = mergeXDomain(
      getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: objectXDomain })).x,
      xValues,
    );
    expect(domain).toEqual(['a', 'b', 'c', 'd']);
    const warnMessage =
      'xDomain for ordinal scale should be an array of values, not a DomainRange object. xDomain is ignored.';
    expect(Logger.warn).toBeCalledWith(warnMessage);
  });

  describe('should account for custom minInterval', () => {
    const xValues = new Set([1, 2, 3, 4, 5]);
    const specs = [MockSeriesSpec.bar({ xScaleType: ScaleType.Linear })];

    test('with valid minInterval', () => {
      const xDomain = { minInterval: 0.5 };
      const mergedDomain = mergeXDomain(
        getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain })).x,
        xValues,
      );
      expect(mergedDomain.minInterval).toEqual(0.5);
    });

    test('with valid minInterval greater than computed minInterval for single datum set', () => {
      const xDomain = { minInterval: 10 };
      const mergedDomain = mergeXDomain(
        getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain })).x,
        new Set([5]),
      );
      expect(mergedDomain.minInterval).toEqual(10);
    });

    test('with invalid minInterval greater than computed minInterval for multi data set', () => {
      const invalidXDomain = { minInterval: 10 };
      const { minInterval } = mergeXDomain(
        getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: invalidXDomain })).x,
        xValues,
      );
      expect(minInterval).toEqual(1);
      const expectedWarning =
        'custom xDomain is invalid, custom minInterval is greater than computed minInterval. Using computed minInterval.';
      expect(Logger.warn).toBeCalledWith(expectedWarning);
    });

    test('with invalid minInterval less than 0', () => {
      const invalidXDomain = { minInterval: -1 };
      const { minInterval } = mergeXDomain(
        getScaleConfigsFromSpecs([], specs, MockGlobalSpec.settings({ xDomain: invalidXDomain })).x,
        xValues,
      );
      expect(minInterval).toEqual(1);
      const expectedWarning =
        'custom xDomain is invalid, custom minInterval is less than 0. Using computed minInterval.';
      expect(Logger.warn).toBeCalledWith(expectedWarning);
    });
  });

  describe('orderOrdinalBinsBySum', () => {
    const ordinalSpecs = MockSeriesSpecs.fromPartialSpecs([
      {
        id: 'ordinal1',
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Ordinal,
        data: [
          { x: 'a', y: 2 },
          { x: 'b', y: 4 },
          { x: 'c', y: 8 },
          { x: 'd', y: 6 },
        ],
      },
      {
        id: 'ordinal2',
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Ordinal,
        data: [
          { x: 'a', y: 4 },
          { x: 'b', y: 8 },
          { x: 'c', y: 16 },
          { x: 'd', y: 12 },
        ],
      },
    ]);

    const linearSpecs = MockSeriesSpecs.fromPartialSpecs([
      {
        id: 'linear1',
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Linear,
        data: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 8 },
          { x: 4, y: 6 },
        ],
      },
      {
        id: 'linear2',
        seriesType: SeriesType.Bar,
        xScaleType: ScaleType.Linear,
        data: [
          { x: 1, y: 4 },
          { x: 2, y: 8 },
          { x: 3, y: 16 },
          { x: 4, y: 12 },
        ],
      },
    ]);

    it('should sort ordinal xValues by descending sum by default', () => {
      const { xValues } = getDataSeriesFromSpecs(ordinalSpecs, [], {});
      expect(xValues).toEqual(new Set(['c', 'd', 'b', 'a']));
    });

    it('should sort ordinal xValues by descending sum', () => {
      const { xValues } = getDataSeriesFromSpecs(ordinalSpecs, [], {
        binAgg: BinAgg.None,
        direction: Direction.Descending,
      });
      expect(xValues).toEqual(new Set(['c', 'd', 'b', 'a']));
    });

    it('should sort ordinal xValues by ascending sum', () => {
      const { xValues } = getDataSeriesFromSpecs(ordinalSpecs, [], {
        binAgg: BinAgg.None,
        direction: Direction.Ascending,
      });
      expect(xValues).toEqual(new Set(['a', 'b', 'd', 'c']));
    });

    it('should NOT sort ordinal xValues sum', () => {
      const { xValues } = getDataSeriesFromSpecs(ordinalSpecs, [], undefined);
      expect(xValues).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    it('should NOT sort ordinal xValues sum when undefined', () => {
      const { xValues } = getDataSeriesFromSpecs(ordinalSpecs, [], {
        binAgg: BinAgg.None,
        direction: Direction.Descending,
      });
      expect(xValues).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    it('should NOT sort linear xValue by descending sum', () => {
      const { xValues } = getDataSeriesFromSpecs(linearSpecs, [], {
        direction: Direction.Descending,
      });
      expect(xValues).toEqual(new Set([1, 2, 3, 4]));
    });
  });
});
