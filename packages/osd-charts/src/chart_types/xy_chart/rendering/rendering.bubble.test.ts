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

import { computeSeriesDomains } from '../state/utils';
import { ScaleType } from '../../../scales';
import { renderBubble } from './rendering';
import { computeXScale, computeYScales } from '../utils/scales';
import { BubbleSeriesSpec, DomainRange, SeriesTypes } from '../utils/specs';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { BubbleGeometry, PointGeometry } from '../../../utils/geometry';
import { GroupId } from '../../../utils/ids';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';
import { IndexedGeometryMap } from '../utils/indexed_geometry_map';

const SPEC_ID = 'spec_1';
const GROUP_ID = 'group_1';

describe('Rendering points - bubble', () => {
  describe('Empty bubble for missing data', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        { ...pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0], data: [] },
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('Can render the geometry without a bubble', () => {
      const { bubbleGeometry } = renderedBubble;
      expect(bubbleGeometry.points).toHaveLength(0);
      expect(bubbleGeometry.color).toBe('red');
      expect(bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
    });
  });
  describe('Single series bubble chart - ordinal', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('Can render a bubble', () => {
      const { bubbleGeometry } = renderedBubble;
      expect(bubbleGeometry.points).toHaveLength(2);
      expect(bubbleGeometry.color).toBe('red');
      expect(bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
    });
    test('Can render two points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = renderedBubble;

      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        styleOverrides: undefined,
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 50,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
  });
  describe('Multi series bubble chart - ordinal', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 20],
        [1, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec1, pointSeriesSpec2];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let firstBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };
    let secondBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      firstBubble = renderBubble(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
      secondBubble = renderBubble(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1],
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });

    test('Can render two ordinal bubbles', () => {
      expect(firstBubble.bubbleGeometry.points).toHaveLength(2);
      expect(firstBubble.bubbleGeometry.color).toBe('red');
      expect(firstBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(spec1Id);

      expect(secondBubble.bubbleGeometry.points).toHaveLength(2);
      expect(secondBubble.bubbleGeometry.color).toBe('blue');
      expect(secondBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(spec2Id);
    });
    test('can render first spec points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = firstBubble;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 50,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 75,
        color: 'red',
        radius: 0,
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = secondBubble;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        color: 'blue',
        radius: 0,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 20,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 50,
        color: 'blue',
        radius: 0,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 10,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
  });
  describe('Single series bubble chart - linear', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('Can render a linear bubble', () => {
      expect(renderedBubble.bubbleGeometry.points).toHaveLength(2);
      expect(renderedBubble.bubbleGeometry.color).toBe('red');
      expect(renderedBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
    });
    test('Can render two points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = renderedBubble;
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        color: 'red',
        radius: 0,
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        color: 'red',
        radius: 0,
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
  });
  describe('Multi series bubble chart - linear', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 20],
        [1, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec1, pointSeriesSpec2];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let firstBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };
    let secondBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      firstBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
      secondBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1],
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('can render two linear bubbles', () => {
      expect(firstBubble.bubbleGeometry.points).toHaveLength(2);
      expect(firstBubble.bubbleGeometry.color).toBe('red');
      expect(firstBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(spec1Id);

      expect(secondBubble.bubbleGeometry.points).toHaveLength(2);
      expect(secondBubble.bubbleGeometry.color).toBe('blue');
      expect(secondBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(spec2Id);
    });
    test('can render first spec points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = firstBubble;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 50,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 75,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = secondBubble;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        color: 'blue',
        radius: 0,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 20,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        color: 'blue',
        radius: 0,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 10,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
  });
  describe('Single series bubble chart - time', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('Can render a time bubble', () => {
      expect(renderedBubble.bubbleGeometry.points).toHaveLength(2);
      expect(renderedBubble.bubbleGeometry.color).toBe('red');
      expect(renderedBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
    });
    test('Can render two points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = renderedBubble;
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 10,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 5,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
  });
  describe('Multi series bubble chart - time', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [1546300800000, 20],
        [1546387200000, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec1, pointSeriesSpec2];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let firstBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };
    let secondBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      firstBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
      secondBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1],
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('can render first spec points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = firstBubble;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 50,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 10,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 75,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 5,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = secondBubble;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        radius: 0,
        color: 'blue',
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 20,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        radius: 0,
        color: 'blue',
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 10,
          mark: null,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(indexedGeometryMap.size).toEqual(points.length);
    });
  });
  describe('Single series bubble chart - y log', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
        [2, null],
        [3, 5],
        [4, 5],
        [5, 0],
        [6, 10],
        [7, 10],
        [8, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Log,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 90],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('Can render a splitted bubble', () => {
      expect(renderedBubble.bubbleGeometry.points).toHaveLength(7);
      expect(renderedBubble.bubbleGeometry.color).toBe('red');
      expect(renderedBubble.bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedBubble.bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
    });
    test('Can render points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = renderedBubble;
      // all the points minus the undefined ones on a log scale
      expect(points.length).toBe(7);
      // all the points expect null geometries
      expect(indexedGeometryMap.size).toEqual(8);

      const zeroValueIndexdGeometry = indexedGeometryMap.find(null, {
        x: 56.25,
        y: 100,
      });
      expect(zeroValueIndexdGeometry).toBeDefined();
      expect(zeroValueIndexdGeometry.length).toBe(5);
      expect(zeroValueIndexdGeometry.find(({ value: { x } }) => x === 5)).toBeDefined();
      // moved to the bottom of the chart
      expect((zeroValueIndexdGeometry[0] as PointGeometry).y).toBe(100);
      // 0 radius point
      expect((zeroValueIndexdGeometry[0] as PointGeometry).radius).toBe(0);
    });
  });
  describe('Remove points datum is not in domain', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 0],
        [1, 1],
        [2, 10],
        [3, 3],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const customYDomain = new Map<GroupId, DomainRange>();
    customYDomain.set(GROUP_ID, {
      max: 1,
    });
    const pointSeriesDomains = computeSeriesDomains([pointSeriesSpec], customYDomain, [], {
      max: 2,
    });
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: 1,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });
    test('Can render two points', () => {
      const {
        bubbleGeometry: { points },
        indexedGeometryMap,
      } = renderedBubble;
      // will not render the 3rd point that is out of y domain
      expect(points.length).toBe(2);
      // will keep the 3rd point as an indexedGeometry
      expect(indexedGeometryMap.size).toEqual(3);
      expect(points[0]).toEqual(({
        x: 0,
        y: 100,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 0,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 0,
        radius: 0,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 1,
          mark: null,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
    });
  });

  describe('Error guards for scaled values', () => {
    const pointSeriesSpec: BubbleSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bubble,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedBubble: {
      bubbleGeometry: BubbleGeometry;
      indexedGeometryMap: IndexedGeometryMap;
    };

    beforeEach(() => {
      renderedBubble = renderBubble(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        false,
        LIGHT_THEME.bubbleSeriesStyle,
        {
          enabled: false,
        },
        false,
      );
    });

    describe('xScale values throw error', () => {
      beforeAll(() => {
        jest.spyOn(xScale, 'scaleOrThrow').mockImplementation(() => {
          throw new Error();
        });
      });

      it('Should have empty bubble', () => {
        const { bubbleGeometry } = renderedBubble;
        expect(bubbleGeometry.points).toHaveLength(2);
        expect(bubbleGeometry.color).toBe('red');
        expect(bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
        expect(bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      });
    });

    describe('yScale values throw error', () => {
      beforeAll(() => {
        jest.spyOn(yScales.get(GROUP_ID)!, 'scaleOrThrow').mockImplementation(() => {
          throw new Error();
        });
      });

      it('Should have empty bubble', () => {
        const { bubbleGeometry } = renderedBubble;
        expect(bubbleGeometry.points).toHaveLength(2);
        expect(bubbleGeometry.color).toBe('red');
        expect(bubbleGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
        expect(bubbleGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      });
    });
  });
});
