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

import { ScaleType } from '../../../scales';
import { RawDataSeries } from '../utils/series';
import { BasicSeriesSpec, DomainRange, SeriesTypes } from '../utils/specs';
import { BARCHART_1Y0G } from '../../../utils/data_samples/test_dataset';
import {
  coerceYScaleTypes,
  getDataSeriesOnGroup,
  mergeYDomain,
  splitSpecsByGroupId,
  YBasicSeriesSpec,
} from './y_domain';
import { GroupId } from '../../../utils/ids';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';
import { MockRawDataSeries, MockRawDataSeriesDatum } from '../../../mocks';

describe('Y Domain', () => {
  test('Should merge Y domain', () => {
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId: 'a',
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId: 'a',
        domain: [2, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should merge Y domain different group', () => {
    const dataSeries1 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const dataSeries2 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 10 },
          { x: 2, y1: 10 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries1);
    specDataSeries.set('b', dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId: 'a',
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Log,
          groupId: 'b',
          id: 'b',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [2, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
      {
        groupId: 'b',
        domain: [2, 10],
        scaleType: ScaleType.Log,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y domain same group all stacked', () => {
    const dataSeries1 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );

    const dataSeries2 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 10 },
          { x: 2, y1: 10 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries1);
    specDataSeries.set('b', dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId: 'a',
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Log,
          groupId: 'a',
          id: 'b',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [2, 17],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y domain same group partially stacked', () => {
    const dataSeries1 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 2, mark: null },
          { x: 4, y1: 5, mark: null },
        ],
        [
          { x: 1, y1: 2, mark: null },
          { x: 4, y1: 7, mark: null },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const dataSeries2 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 10, mark: null },
          { x: 2, y1: 10, mark: null },
          { x: 3, y1: 2, mark: null },
          { x: 4, y1: 5, mark: null },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries1);
    specDataSeries.set('b', dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId: 'a',
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Log,
          groupId: 'a',
          id: 'b',
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [2, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y high volume of data', () => {
    const maxValues = 10000;
    const data = new Array(maxValues).fill(0).map((_, i) => MockRawDataSeriesDatum.default({ x: i, y1: i }));
    const dataSeries1: RawDataSeries[] = [
      {
        specId: 'a',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [''],
        key: '',
        data,
      },
      {
        specId: 'a',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [''],
        key: '',
        data,
      },
    ];
    const dataSeries2: RawDataSeries[] = [
      {
        specId: 'a',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [''],
        key: '',
        data,
      },
    ];
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries1);
    specDataSeries.set('b', dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId: 'a',
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Log,
          groupId: 'a',
          id: 'b',
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain.length).toEqual(1);
  });
  test('Should split specs by groupId, two groups, non stacked', () => {
    const spec1: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec1',
      groupId: 'group1',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec2',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group1', 'group2']);
    expect(groupValues.length).toBe(2);
    expect(groupValues[0].nonStacked).toEqual([spec1]);
    expect(groupValues[1].nonStacked).toEqual([spec2]);
    expect(groupValues[0].stacked).toEqual([]);
    expect(groupValues[1].stacked).toEqual([]);
  });
  test('Should split specs by groupId, two groups, stacked', () => {
    const spec1: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec1',
      groupId: 'group1',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec2',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group1', 'group2']);
    expect(groupValues.length).toBe(2);
    expect(groupValues[0].stacked).toEqual([spec1]);
    expect(groupValues[1].stacked).toEqual([spec2]);
    expect(groupValues[0].nonStacked).toEqual([]);
    expect(groupValues[1].nonStacked).toEqual([]);
  });
  test('Should split specs by groupId, 1 group, stacked', () => {
    const spec1: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec1',
      groupId: 'group',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec2',
      groupId: 'group',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group']);
    expect(groupValues.length).toBe(1);
    expect(groupValues[0].stacked).toEqual([spec1, spec2]);
    expect(groupValues[0].nonStacked).toEqual([]);
  });
  test('Should 3 split specs by groupId, 2 group, semi/stacked', () => {
    const spec1: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec1',
      groupId: 'group1',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec2',
      groupId: 'group1',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec3: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec3',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2, spec3]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group1', 'group2']);
    expect(groupValues.length).toBe(2);
    expect(groupValues[0].stacked).toEqual([spec1, spec2]);
    expect(groupValues[0].nonStacked).toEqual([]);
    expect(groupValues[1].stacked).toEqual([spec3]);
    expect(groupValues[0].nonStacked).toEqual([]);
  });

  test('Should return a default Scale Linear for YScaleType when there are no specs', () => {
    const specs: Pick<BasicSeriesSpec, 'yScaleType'>[] = [];
    expect(coerceYScaleTypes(specs)).toBe(ScaleType.Linear);
  });

  test('Should getDataSeriesOnGroup for matching specs', () => {
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('b', dataSeries);

    const specs: YBasicSeriesSpec[] = [
      {
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Linear,
        groupId: 'a',
        id: 'a',
        stackAccessors: ['a'],
        yScaleToDataExtent: true,
      },
    ];

    const rawDataSeries = getDataSeriesOnGroup(specDataSeries, specs);
    expect(rawDataSeries).toEqual([]);
  });
  test('Should merge Y domain accounting for custom domain limits: complete bounded domain', () => {
    const groupId = 'a';
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 0, max: 20 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId,
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [0, 20],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should merge Y domain accounting for custom domain limits: partial lower bounded domain', () => {
    const groupId = 'a';
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 0 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId,
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [0, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should not merge Y domain with invalid custom domain limits: partial lower bounded domain', () => {
    const groupId = 'a';
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 20 });

    const attemptToMerge = () => {
      mergeYDomain(
        specDataSeries,
        [
          {
            seriesType: SeriesTypes.Area,
            yScaleType: ScaleType.Linear,
            groupId,
            id: 'a',
            stackAccessors: ['a'],
            yScaleToDataExtent: true,
          },
        ],
        domainsByGroupId,
      );
    };

    const errorMessage = 'custom yDomain for a is invalid, custom min is greater than computed max';
    expect(attemptToMerge).toThrowError(errorMessage);
  });
  test('Should merge Y domain accounting for custom domain limits: partial upper bounded domain', () => {
    const groupId = 'a';
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { max: 20 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId,
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [2, 20],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should not merge Y domain with invalid custom domain limits: partial upper bounded domain', () => {
    const groupId = 'a';
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { max: -1 });

    const attemptToMerge = () => {
      mergeYDomain(
        specDataSeries,
        [
          {
            seriesType: SeriesTypes.Area,
            yScaleType: ScaleType.Linear,
            groupId,
            id: 'a',
            stackAccessors: ['a'],
            yScaleToDataExtent: true,
          },
        ],
        domainsByGroupId,
      );
    };

    const errorMessage = 'custom yDomain for a is invalid, computed min is greater than custom max';
    expect(attemptToMerge).toThrowError(errorMessage);
  });
  test('Should merge Y domain with stacked as percentage', () => {
    const dataSeries1 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const dataSeries2 = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 10 },
          { x: 2, y1: 10 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries1);
    specDataSeries.set('b', dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId: 'a',
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
          stackAsPercentage: true,
        },
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Log,
          groupId: 'a',
          id: 'b',
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [0, 1],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y domain with as percentage regadless of custom domains', () => {
    const groupId = 'a';
    const dataSeries = MockRawDataSeries.fromData(
      [
        [
          { x: 1, y1: 2 },
          { x: 2, y1: 2 },
          { x: 3, y1: 2 },
          { x: 4, y1: 5 },
        ],
        [
          { x: 1, y1: 2 },
          { x: 4, y1: 7 },
        ],
      ],
      {
        specId: 'a',
        yAccessor: 'y1',
        seriesKeys: [''],
        key: '',
      },
    );
    const specDataSeries = new Map<string, RawDataSeries[]>();
    specDataSeries.set('a', dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 2, max: 20 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: SeriesTypes.Area,
          yScaleType: ScaleType.Linear,
          groupId,
          id: 'a',
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
          stackAsPercentage: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [0, 1],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
});
