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

import { SeriesKey, SeriesIdentifier } from '../../../../commons/series_id';
import { Scale } from '../../../../scales';
import { identity, mergePartial, Rotation, Color, isUniqueArray } from '../../../../utils/commons';
import { CurveType } from '../../../../utils/curves';
import { Dimensions } from '../../../../utils/dimensions';
import { Domain } from '../../../../utils/domain';
import { PointGeometry, BarGeometry, AreaGeometry, LineGeometry, BubbleGeometry } from '../../../../utils/geometry';
import { GroupId, SpecId } from '../../../../utils/ids';
import { ColorConfig, Theme } from '../../../../utils/themes/theme';
import { XDomain, YDomain } from '../../domains/types';
import { mergeXDomain } from '../../domains/x_domain';
import { mergeYDomain } from '../../domains/y_domain';
import { renderArea, renderBars, renderLine, renderBubble } from '../../rendering/rendering';
import { IndexedGeometryMap } from '../../utils/indexed_geometry_map';
import { computeXScale, computeYScales, countBarsInCluster } from '../../utils/scales';
import {
  DataSeries,
  SeriesCollectionValue,
  getSeriesIndex,
  FormattedDataSeries,
  getFormattedDataseries,
  getSplittedSeries,
  getSeriesKey,
  XYChartSeriesIdentifier,
} from '../../utils/series';
import {
  AxisSpec,
  BasicSeriesSpec,
  DomainRange,
  HistogramModeAlignment,
  HistogramModeAlignments,
  isAreaSeriesSpec,
  isBarSeriesSpec,
  isLineSeriesSpec,
  isBandedSpec,
  Fit,
  FitConfig,
  isBubbleSeriesSpec,
} from '../../utils/specs';
import { getSpecsById, getAxesSpecForSpecId } from './spec';
import { SeriesDomainsAndData, ComputedGeometries, GeometriesCounts, Transform, LastValues } from './types';

export const MAX_ANIMATABLE_BARS = 300;
export const MAX_ANIMATABLE_LINES_AREA_POINTS = 600;

/**
 * Adds or removes series from array or series
 * @param series
 * @param target
 * @internal
 */
export function updateDeselectedDataSeries(
  series: XYChartSeriesIdentifier[],
  target: XYChartSeriesIdentifier,
): XYChartSeriesIdentifier[] {
  const seriesIndex = getSeriesIndex(series, target);
  const updatedSeries = series ? [...series] : [];

  if (seriesIndex > -1) {
    updatedSeries.splice(seriesIndex, 1);
  } else {
    updatedSeries.push(target);
  }
  return updatedSeries;
}

/**
 * Return map assocition between `seriesKey` and only the custom colors string
 * @param seriesSpecs
 * @param seriesCollection
 * @param seriesColorOverrides color override from legend
 * @internal
 */
export function getCustomSeriesColors(
  seriesSpecs: BasicSeriesSpec[],
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>,
): Map<SeriesKey, Color> {
  const updatedCustomSeriesColors = new Map<SeriesKey, Color>();
  const counters = new Map<SpecId, number>();

  seriesCollection.forEach(({ seriesIdentifier }, seriesKey) => {
    const spec = getSpecsById(seriesSpecs, seriesIdentifier.specId);

    if (!spec || !spec.color) {
      return;
    }

    let color: Color | undefined | null;

    if (!color && spec.color) {
      if (typeof spec.color === 'string') {
        // eslint-disable-next-line prefer-destructuring
        color = spec.color;
      } else {
        const counter = counters.get(seriesIdentifier.specId) || 0;
        color = Array.isArray(spec.color) ? spec.color[counter % spec.color.length] : spec.color(seriesIdentifier);
        counters.set(seriesIdentifier.specId, counter + 1);
      }
    }

    if (color) {
      updatedCustomSeriesColors.set(seriesKey, color);
    }
  });
  return updatedCustomSeriesColors;
}

function getLastValues(formattedDataSeries: {
  stacked: FormattedDataSeries[];
  nonStacked: FormattedDataSeries[];
}): Map<SeriesKey, LastValues> {
  const lastValues = new Map<SeriesKey, LastValues>();

  // we need to get the latest
  formattedDataSeries.stacked.forEach((ds) => {
    ds.dataSeries.forEach((series) => {
      const seriesKey = getSeriesKey(series as XYChartSeriesIdentifier);
      if (series.data.length > 0) {
        const last = series.data[series.data.length - 1];
        if (last !== null) {
          const { initialY1: y1, initialY0: y0 } = last;

          if (!last.filled && (y1 !== null || y0 !== null)) {
            lastValues.set(seriesKey, { y0, y1 });
          }
        }
      }
    });
  });
  formattedDataSeries.nonStacked.forEach((ds) => {
    ds.dataSeries.forEach((series) => {
      const seriesKey = getSeriesKey(series as XYChartSeriesIdentifier);
      if (series.data.length > 0) {
        const last = series.data[series.data.length - 1];
        if (last !== null) {
          const { initialY1: y1, initialY0: y0 } = last;
          if (y1 !== null || y0 !== null) {
            lastValues.set(seriesKey, { y0, y1 });
          }
        }
      }
    });
  });
  return lastValues;
}

/**
 * Compute data domains for all specified specs.
 * @param seriesSpecs a map of all the series specs
 * @param customYDomainsByGroupId custom Y domains grouped by GroupId
 * @param customXDomain if specified in <Settings />, the custom X domain
 * @param deselectedDataSeries is optional; if not supplied,
 * then all series will be factored into computations. Otherwise, selectedDataSeries
 * is used to restrict the computation for just the selected series
 * @returns `SeriesDomainsAndData`
 * @internal
 */
export function computeSeriesDomains(
  seriesSpecs: BasicSeriesSpec[],
  customYDomainsByGroupId: Map<GroupId, DomainRange> = new Map(),
  deselectedDataSeries: SeriesIdentifier[] = [],
  customXDomain?: DomainRange | Domain,
): SeriesDomainsAndData {
  const {
    splittedSeries,
    xValues, seriesCollection,
    fallbackScale,
  } = getSplittedSeries(seriesSpecs, deselectedDataSeries);
  const splittedDataSeries = [...splittedSeries.values()];
  const specsArray = [...seriesSpecs.values()];

  const xDomain = mergeXDomain(specsArray, xValues, customXDomain, fallbackScale);
  const yDomain = mergeYDomain(splittedSeries, specsArray, customYDomainsByGroupId);

  const formattedDataSeries = getFormattedDataseries(
    specsArray,
    splittedSeries,
    xValues,
    xDomain.scaleType,
    seriesSpecs,
  );

  // we need to get the last values from the formatted dataseries
  // because we change the format if we are on percentage mode
  const lastValues = getLastValues(formattedDataSeries);
  const updatedSeriesCollection = new Map<SeriesKey, SeriesCollectionValue>();
  seriesCollection.forEach((value, key) => {
    const lastValue = lastValues.get(key);
    const updatedColorSet: SeriesCollectionValue = {
      ...value,
      lastValue,
    };
    updatedSeriesCollection.set(key, updatedColorSet);
  });

  return {
    xDomain,
    yDomain,
    splittedDataSeries,
    formattedDataSeries,
    seriesCollection: updatedSeriesCollection,
  };
}

/** @internal */
export function computeSeriesGeometries(
  seriesSpecs: BasicSeriesSpec[],
  xDomain: XDomain,
  yDomain: YDomain[],
  formattedDataSeries: {
    stacked: FormattedDataSeries[];
    nonStacked: FormattedDataSeries[];
  },
  seriesColorMap: Map<SeriesKey, Color>,
  chartTheme: Theme,
  chartDims: Dimensions,
  chartRotation: Rotation,
  axesSpecs: AxisSpec[],
  enableHistogramMode: boolean,
): ComputedGeometries {
  const chartColors: ColorConfig = chartTheme.colors;
  const barsPadding = enableHistogramMode ? chartTheme.scales.histogramPadding : chartTheme.scales.barsPadding;

  const width = [0, 180].includes(chartRotation) ? chartDims.width : chartDims.height;
  const height = [0, 180].includes(chartRotation) ? chartDims.height : chartDims.width;
  // const { width, height } = chartDims;
  const { stacked, nonStacked } = formattedDataSeries;

  // compute how many series are clustered
  const { stackedBarsInCluster, totalBarsInCluster } = countBarsInCluster(stacked, nonStacked);
  // compute scales
  const xScale = computeXScale({
    xDomain,
    totalBarsInCluster,
    range: [0, width],
    barsPadding,
    enableHistogramMode,
  });
  const yScales = computeYScales({ yDomains: yDomain, range: [height, 0] });

  // compute colors

  // compute geometries
  const points: PointGeometry[] = [];
  const areas: AreaGeometry[] = [];
  const bars: BarGeometry[] = [];
  const lines: LineGeometry[] = [];
  const bubbles: BubbleGeometry[] = [];
  const geometriesIndex = new IndexedGeometryMap();
  let orderIndex = 0;
  const geometriesCounts: GeometriesCounts = {
    points: 0,
    bars: 0,
    areas: 0,
    areasPoints: 0,
    lines: 0,
    linePoints: 0,
    bubbles: 0,
    bubblePoints: 0,
  };
  formattedDataSeries.stacked.forEach((dataSeriesGroup) => {
    const { groupId, dataSeries, counts } = dataSeriesGroup;
    const yScale = yScales.get(groupId);
    if (!yScale) {
      return;
    }

    const geometries = renderGeometries(
      orderIndex,
      totalBarsInCluster,
      true,
      dataSeries,
      xScale,
      yScale,
      seriesSpecs,
      seriesColorMap,
      chartColors.defaultVizColor,
      axesSpecs,
      chartTheme,
      enableHistogramMode,
    );
    orderIndex = counts.barSeries > 0 ? orderIndex + 1 : orderIndex;
    areas.push(...geometries.areas);
    lines.push(...geometries.lines);
    bars.push(...geometries.bars);
    bubbles.push(...geometries.bubbles);
    points.push(...geometries.points);
    geometriesIndex.merge(geometries.indexedGeometryMap);
    // update counts
    geometriesCounts.points += geometries.geometriesCounts.points;
    geometriesCounts.bars += geometries.geometriesCounts.bars;
    geometriesCounts.areas += geometries.geometriesCounts.areas;
    geometriesCounts.areasPoints += geometries.geometriesCounts.areasPoints;
    geometriesCounts.lines += geometries.geometriesCounts.lines;
    geometriesCounts.linePoints += geometries.geometriesCounts.linePoints;
    geometriesCounts.bubbles += geometries.geometriesCounts.bubbles;
    geometriesCounts.bubblePoints += geometries.geometriesCounts.bubblePoints;
  });
  formattedDataSeries.nonStacked.forEach((dataSeriesGroup) => {
    const { groupId, dataSeries } = dataSeriesGroup;
    const yScale = yScales.get(groupId);
    if (!yScale) {
      return;
    }
    const geometries = renderGeometries(
      stackedBarsInCluster,
      totalBarsInCluster,
      false,
      dataSeries,
      xScale,
      yScale,
      seriesSpecs,
      seriesColorMap,
      chartColors.defaultVizColor,
      axesSpecs,
      chartTheme,
      enableHistogramMode,
    );

    areas.push(...geometries.areas);
    lines.push(...geometries.lines);
    bars.push(...geometries.bars);
    bubbles.push(...geometries.bubbles);
    points.push(...geometries.points);

    geometriesIndex.merge(geometries.indexedGeometryMap);
    // update counts
    geometriesCounts.points += geometries.geometriesCounts.points;
    geometriesCounts.bars += geometries.geometriesCounts.bars;
    geometriesCounts.areas += geometries.geometriesCounts.areas;
    geometriesCounts.areasPoints += geometries.geometriesCounts.areasPoints;
    geometriesCounts.lines += geometries.geometriesCounts.lines;
    geometriesCounts.linePoints += geometries.geometriesCounts.linePoints;
    geometriesCounts.bubbles += geometries.geometriesCounts.bubbles;
    geometriesCounts.bubblePoints += geometries.geometriesCounts.bubblePoints;
  });
  return {
    scales: {
      xScale,
      yScales,
    },
    geometries: {
      points,
      areas,
      bars,
      lines,
      bubbles,
    },
    geometriesIndex,
    geometriesCounts,
  };
}

/** @internal */
export function setBarSeriesAccessors(isHistogramMode: boolean, seriesSpecs: Map<SpecId, BasicSeriesSpec>): void {
  if (!isHistogramMode) {
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const [, spec] of seriesSpecs) {
    if (isBarSeriesSpec(spec)) {
      let stackAccessors = spec.stackAccessors ? [...spec.stackAccessors] : spec.yAccessors;

      if (spec.splitSeriesAccessors) {
        stackAccessors = [...stackAccessors, ...spec.splitSeriesAccessors];
      }

      spec.stackAccessors = stackAccessors;
    }
  }
}

/** @internal */
export function isHistogramModeEnabled(seriesSpecs: BasicSeriesSpec[]): boolean {
  return seriesSpecs.some((spec) => isBarSeriesSpec(spec) && spec.enableHistogramMode);
}

/** @internal */
export function computeXScaleOffset(
  xScale: Scale,
  enableHistogramMode: boolean,
  histogramModeAlignment: HistogramModeAlignment = HistogramModeAlignments.Start,
): number {
  if (!enableHistogramMode) {
    return 0;
  }

  const { bandwidth, barsPadding } = xScale;
  const band = bandwidth / (1 - barsPadding);
  const halfPadding = (band - bandwidth) / 2;

  const startAlignmentOffset = bandwidth / 2 + halfPadding;

  switch (histogramModeAlignment) {
    case HistogramModeAlignments.Center:
      return 0;
    case HistogramModeAlignments.End:
      return -startAlignmentOffset;
    default:
      return startAlignmentOffset;
  }
}

function renderGeometries(
  indexOffset: number,
  clusteredCount: number,
  isStacked: boolean,
  dataSeries: DataSeries[],
  xScale: Scale,
  yScale: Scale,
  seriesSpecs: BasicSeriesSpec[],
  seriesColorsMap: Map<SeriesKey, Color>,
  defaultColor: string,
  axesSpecs: AxisSpec[],
  chartTheme: Theme,
  enableHistogramMode: boolean,
): {
  points: PointGeometry[];
  bars: BarGeometry[];
  areas: AreaGeometry[];
  lines: LineGeometry[];
  bubbles: BubbleGeometry[];
  indexedGeometryMap: IndexedGeometryMap;
  geometriesCounts: GeometriesCounts;
} {
  const len = dataSeries.length;
  let i;
  const points: PointGeometry[] = [];
  const bars: BarGeometry[] = [];
  const areas: AreaGeometry[] = [];
  const lines: LineGeometry[] = [];
  const bubbles: BubbleGeometry[] = [];
  const indexedGeometryMap = new IndexedGeometryMap();
  const isMixedChart = isUniqueArray(seriesSpecs, ({ seriesType }) => seriesType) && seriesSpecs.length > 1;
  const geometriesCounts: GeometriesCounts = {
    points: 0,
    bars: 0,
    areas: 0,
    areasPoints: 0,
    lines: 0,
    linePoints: 0,
    bubbles: 0,
    bubblePoints: 0,
  };
  let barIndexOffset = 0;
  for (i = 0; i < len; i++) {
    const ds = dataSeries[i];
    const spec = getSpecsById<BasicSeriesSpec>(seriesSpecs, ds.specId);
    if (spec === undefined) {
      continue;
    }

    const color = seriesColorsMap.get(getSeriesKey(ds)) || defaultColor;

    if (isBarSeriesSpec(spec)) {
      const shift = isStacked ? indexOffset : indexOffset + barIndexOffset;
      const barSeriesStyle = mergePartial(chartTheme.barSeriesStyle, spec.barSeriesStyle, {
        mergeOptionalPartialValues: true,
      });

      const { yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);
      const valueFormatter = yAxis && yAxis.tickFormat ? yAxis.tickFormat : identity;

      const displayValueSettings = spec.displayValueSettings
        ? { valueFormatter, ...spec.displayValueSettings }
        : undefined;

      const renderedBars = renderBars(
        shift,
        ds,
        xScale,
        yScale,
        color,
        barSeriesStyle,
        displayValueSettings,
        spec.styleAccessor,
        spec.minBarHeight,
      );
      indexedGeometryMap.merge(renderedBars.indexedGeometryMap);
      bars.push(...renderedBars.barGeometries);
      geometriesCounts.bars += renderedBars.barGeometries.length;
      barIndexOffset += 1;
    } else if (isBubbleSeriesSpec(spec)) {
      const bubbleShift = clusteredCount > 0 ? clusteredCount : 1;
      const bubbleSeriesStyle = spec.bubbleSeriesStyle
        ? mergePartial(chartTheme.bubbleSeriesStyle, spec.bubbleSeriesStyle, { mergeOptionalPartialValues: true })
        : chartTheme.bubbleSeriesStyle;
      const renderedBubbles = renderBubble(
        (xScale.bandwidth * bubbleShift) / 2,
        ds,
        xScale,
        yScale,
        color,
        isBandedSpec(spec.y0Accessors),
        bubbleSeriesStyle,
        {
          enabled: spec.markSizeAccessor !== undefined,
          ratio: chartTheme.markSizeRatio,
        },
        isMixedChart,
        spec.pointStyleAccessor,
      );
      indexedGeometryMap.merge(renderedBubbles.indexedGeometryMap);
      bubbles.push(renderedBubbles.bubbleGeometry);
      geometriesCounts.bubblePoints += renderedBubbles.bubbleGeometry.points.length;
      geometriesCounts.bubbles += 1;
    } else if (isLineSeriesSpec(spec)) {
      const lineShift = clusteredCount > 0 ? clusteredCount : 1;
      const lineSeriesStyle = spec.lineSeriesStyle
        ? mergePartial(chartTheme.lineSeriesStyle, spec.lineSeriesStyle, { mergeOptionalPartialValues: true })
        : chartTheme.lineSeriesStyle;

      const xScaleOffset = computeXScaleOffset(xScale, enableHistogramMode, spec.histogramModeAlignment);

      const renderedLines = renderLine(
        // move the point on half of the bandwidth if we have mixed bars/lines
        (xScale.bandwidth * lineShift) / 2,
        ds,
        xScale,
        yScale,
        color,
        spec.curve || CurveType.LINEAR,
        isBandedSpec(spec.y0Accessors),
        xScaleOffset,
        lineSeriesStyle,
        {
          enabled: spec.markSizeAccessor !== undefined,
          ratio: chartTheme.markSizeRatio,
        },
        spec.pointStyleAccessor,
        Boolean(spec.fit && ((spec.fit as FitConfig).type || spec.fit) !== Fit.None),
      );
      indexedGeometryMap.merge(renderedLines.indexedGeometryMap);
      lines.push(renderedLines.lineGeometry);
      geometriesCounts.linePoints += renderedLines.lineGeometry.points.length;
      geometriesCounts.lines += 1;
    } else if (isAreaSeriesSpec(spec)) {
      const areaShift = clusteredCount > 0 ? clusteredCount : 1;
      const areaSeriesStyle = spec.areaSeriesStyle
        ? mergePartial(chartTheme.areaSeriesStyle, spec.areaSeriesStyle, { mergeOptionalPartialValues: true })
        : chartTheme.areaSeriesStyle;
      const xScaleOffset = computeXScaleOffset(xScale, enableHistogramMode, spec.histogramModeAlignment);
      const renderedAreas = renderArea(
        // move the point on half of the bandwidth if we have mixed bars/lines
        (xScale.bandwidth * areaShift) / 2,
        ds,
        xScale,
        yScale,
        color,
        spec.curve || CurveType.LINEAR,
        isBandedSpec(spec.y0Accessors),
        xScaleOffset,
        areaSeriesStyle,
        {
          enabled: spec.markSizeAccessor !== undefined,
          ratio: chartTheme.markSizeRatio,
        },
        isStacked,
        spec.pointStyleAccessor,
        Boolean(spec.fit && ((spec.fit as FitConfig).type || spec.fit) !== Fit.None),
      );
      indexedGeometryMap.merge(renderedAreas.indexedGeometryMap);
      areas.push(renderedAreas.areaGeometry);
      geometriesCounts.areasPoints += renderedAreas.areaGeometry.points.length;
      geometriesCounts.areas += 1;
    }
  }

  return {
    points,
    bars,
    areas,
    lines,
    bubbles,
    indexedGeometryMap,
    geometriesCounts,
  };
}

/** @internal */
export function computeChartTransform(chartDimensions: Dimensions, chartRotation: Rotation): Transform {
  if (chartRotation === 90) {
    return {
      x: chartDimensions.width,
      y: 0,
      rotate: 90,
    };
  }
  if (chartRotation === -90) {
    return {
      x: 0,
      y: chartDimensions.height,
      rotate: -90,
    };
  }
  if (chartRotation === 180) {
    return {
      x: chartDimensions.width,
      y: chartDimensions.height,
      rotate: 180,
    };
  }
  return {
    x: 0,
    y: 0,
    rotate: 0,
  };
}
