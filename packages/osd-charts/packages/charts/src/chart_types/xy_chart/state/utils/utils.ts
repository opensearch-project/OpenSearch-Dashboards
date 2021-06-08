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

import { getPredicateFn, Predicate } from '../../../../common/predicate';
import { SeriesKey, SeriesIdentifier } from '../../../../common/series_id';
import { Scale } from '../../../../scales';
import { SortSeriesByConfig } from '../../../../specs';
import { OrderBy } from '../../../../specs/settings';
import { mergePartial, Rotation, Color, isUniqueArray } from '../../../../utils/common';
import { CurveType } from '../../../../utils/curves';
import { Dimensions, Size } from '../../../../utils/dimensions';
import {
  PointGeometry,
  BarGeometry,
  AreaGeometry,
  LineGeometry,
  BubbleGeometry,
  PerPanel,
} from '../../../../utils/geometry';
import { GroupId, SpecId } from '../../../../utils/ids';
import { getRenderingCompareFn, SeriesCompareFn } from '../../../../utils/series_sort';
import { ColorConfig, Theme } from '../../../../utils/themes/theme';
import { XDomain } from '../../domains/types';
import { mergeXDomain } from '../../domains/x_domain';
import { isStackedSpec, mergeYDomain } from '../../domains/y_domain';
import { renderArea } from '../../rendering/area';
import { renderBars } from '../../rendering/bars';
import { renderBubble } from '../../rendering/bubble';
import { renderLine } from '../../rendering/line';
import { defaultTickFormatter } from '../../utils/axis_utils';
import { defaultXYSeriesSort } from '../../utils/default_series_sort_fn';
import { fillSeries } from '../../utils/fill_series';
import { groupBy } from '../../utils/group_data_series';
import { IndexedGeometryMap } from '../../utils/indexed_geometry_map';
import { computeXScale, computeYScales } from '../../utils/scales';
import { DataSeries, getFormattedDataSeries, getDataSeriesFromSpecs, getSeriesKey } from '../../utils/series';
import {
  AxisSpec,
  BasicSeriesSpec,
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
import { SmallMultipleScales } from '../selectors/compute_small_multiple_scales';
import { ScaleConfigs } from '../selectors/get_api_scale_configs';
import { SmallMultiplesGroupBy } from '../selectors/get_specs';
import { isHorizontalRotation } from './common';
import { getSpecsById, getAxesSpecForSpecId, getSpecDomainGroupId } from './spec';
import { SeriesDomainsAndData, ComputedGeometries, GeometriesCounts, Transform } from './types';

/**
 * Return map association between `seriesKey` and only the custom colors string
 * @internal
 * @param dataSeries
 */
export function getCustomSeriesColors(dataSeries: DataSeries[]): Map<SeriesKey, Color> {
  const updatedCustomSeriesColors = new Map<SeriesKey, Color>();
  const counters = new Map<SpecId, number>();

  dataSeries.forEach((ds) => {
    const { spec, specId } = ds;
    const dataSeriesKey = {
      specId: ds.specId,
      yAccessor: ds.yAccessor,
      splitAccessors: ds.splitAccessors,
      smVerticalAccessorValue: undefined,
      smHorizontalAccessorValue: undefined,
    };
    const seriesKey = getSeriesKey(dataSeriesKey, ds.groupId);

    if (!spec || !spec.color) {
      return;
    }

    let color: Color | undefined | null;

    if (!color && spec.color) {
      if (typeof spec.color === 'string') {
        // eslint-disable-next-line prefer-destructuring
        color = spec.color;
      } else {
        const counter = counters.get(specId) || 0;
        color = Array.isArray(spec.color) ? spec.color[counter % spec.color.length] : spec.color(ds);
        counters.set(specId, counter + 1);
      }
    }

    if (color) {
      updatedCustomSeriesColors.set(seriesKey, color);
    }
  });
  return updatedCustomSeriesColors;
}

/**
 * Compute data domains for all specified specs.
 * @internal
 */
export function computeSeriesDomains(
  seriesSpecs: BasicSeriesSpec[],
  scaleConfigs: ScaleConfigs,
  deselectedDataSeries: SeriesIdentifier[] = [],
  orderOrdinalBinsBy?: OrderBy,
  smallMultiples?: SmallMultiplesGroupBy,
  sortSeriesBy?: SeriesCompareFn | SortSeriesByConfig,
): SeriesDomainsAndData {
  const { dataSeries, xValues, fallbackScale, smHValues, smVValues } = getDataSeriesFromSpecs(
    seriesSpecs,
    deselectedDataSeries,
    orderOrdinalBinsBy,
    smallMultiples,
  );
  // compute the x domain merging any custom domain
  const xDomain = mergeXDomain(scaleConfigs.x, xValues, fallbackScale);

  // fill series with missing x values
  const filledDataSeries = fillSeries(dataSeries, xValues, xDomain.type);

  const seriesSortFn = getRenderingCompareFn(sortSeriesBy, (a: SeriesIdentifier, b: SeriesIdentifier) => {
    return defaultXYSeriesSort(a as DataSeries, b as DataSeries);
  });

  const formattedDataSeries = getFormattedDataSeries(seriesSpecs, filledDataSeries, xValues, xDomain.type).sort(
    seriesSortFn,
  );

  // let's compute the yDomains after computing all stacked values
  const yDomains = mergeYDomain(formattedDataSeries, scaleConfigs.y);

  // sort small multiples values
  const horizontalPredicate = smallMultiples?.horizontal?.sort ?? Predicate.DataIndex;
  const smHDomain = [...smHValues].sort(getPredicateFn(horizontalPredicate));

  const verticalPredicate = smallMultiples?.vertical?.sort ?? Predicate.DataIndex;
  const smVDomain = [...smVValues].sort(getPredicateFn(verticalPredicate));

  return {
    xDomain,
    yDomains,
    smHDomain,
    smVDomain,
    formattedDataSeries,
  };
}

/** @internal */
export function computeSeriesGeometries(
  seriesSpecs: BasicSeriesSpec[],
  { xDomain, yDomains, formattedDataSeries: nonFilteredDataSeries }: SeriesDomainsAndData,
  seriesColorMap: Map<SeriesKey, Color>,
  chartTheme: Theme,
  chartRotation: Rotation,
  axesSpecs: AxisSpec[],
  smallMultiplesScales: SmallMultipleScales,
  enableHistogramMode: boolean,
): ComputedGeometries {
  const chartColors: ColorConfig = chartTheme.colors;
  const formattedDataSeries = nonFilteredDataSeries.filter(({ isFiltered }) => !isFiltered);
  const barDataSeries = formattedDataSeries.filter(({ spec }) => isBarSeriesSpec(spec));
  // compute max bar in cluster per panel
  const dataSeriesGroupedByPanel = groupBy(
    barDataSeries,
    ['smVerticalAccessorValue', 'smHorizontalAccessorValue'],
    false,
  );

  const barIndexByPanel = Object.keys(dataSeriesGroupedByPanel).reduce<Record<string, string[]>>((acc, panelKey) => {
    const panelBars = dataSeriesGroupedByPanel[panelKey];
    const barDataSeriesByBarIndex = groupBy(
      panelBars,
      (d) => {
        return getBarIndexKey(d, enableHistogramMode);
      },
      false,
    );

    acc[panelKey] = Object.keys(barDataSeriesByBarIndex);
    return acc;
  }, {});

  const { horizontal, vertical } = smallMultiplesScales;

  const yScales = computeYScales({
    yDomains,
    range: [isHorizontalRotation(chartRotation) ? vertical.bandwidth : horizontal.bandwidth, 0],
  });

  const computedGeoms = renderGeometries(
    formattedDataSeries,
    xDomain,
    yScales,
    vertical,
    horizontal,
    barIndexByPanel,
    seriesSpecs,
    seriesColorMap,
    chartColors.defaultVizColor,
    axesSpecs,
    chartTheme,
    enableHistogramMode,
    chartRotation,
  );

  const totalBarsInCluster = Object.values(barIndexByPanel).reduce((acc, curr) => {
    return Math.max(acc, curr.length);
  }, 0);

  const xScale = computeXScale({
    xDomain,
    totalBarsInCluster,
    range: [0, isHorizontalRotation(chartRotation) ? horizontal.bandwidth : vertical.bandwidth],
    barsPadding: enableHistogramMode ? chartTheme.scales.histogramPadding : chartTheme.scales.barsPadding,
    enableHistogramMode,
  });

  return {
    scales: {
      xScale,
      yScales,
    },
    ...computedGeoms,
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
  dataSeries: DataSeries[],
  xDomain: XDomain,
  yScales: Map<GroupId, Scale>,
  smVScale: Scale,
  smHScale: Scale,
  barIndexOrderPerPanel: Record<string, string[]>,
  seriesSpecs: BasicSeriesSpec[],
  seriesColorsMap: Map<SeriesKey, Color>,
  defaultColor: string,
  axesSpecs: AxisSpec[],
  chartTheme: Theme,
  enableHistogramMode: boolean,
  chartRotation: Rotation,
): Omit<ComputedGeometries, 'scales'> {
  const len = dataSeries.length;
  let i;
  const points: PointGeometry[] = [];
  const bars: Array<PerPanel<BarGeometry[]>> = [];
  const areas: Array<PerPanel<AreaGeometry>> = [];
  const lines: Array<PerPanel<LineGeometry>> = [];
  const bubbles: Array<PerPanel<BubbleGeometry>> = [];
  const geometriesIndex = new IndexedGeometryMap();
  const isMixedChart = isUniqueArray(seriesSpecs, ({ seriesType }) => seriesType) && seriesSpecs.length > 1;
  const fallBackTickFormatter = seriesSpecs.find(({ tickFormat }) => tickFormat)?.tickFormat ?? defaultTickFormatter;
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
  const barsPadding = enableHistogramMode ? chartTheme.scales.histogramPadding : chartTheme.scales.barsPadding;

  for (i = 0; i < len; i++) {
    const ds = dataSeries[i];
    const spec = getSpecsById<BasicSeriesSpec>(seriesSpecs, ds.specId);
    if (spec === undefined) {
      continue;
    }
    // compute the y scale
    const yScale = yScales.get(getSpecDomainGroupId(ds.spec));
    if (!yScale) {
      continue;
    }
    // compute the panel unique key
    const barPanelKey = [ds.smVerticalAccessorValue, ds.smHorizontalAccessorValue].join('|');
    const barIndexOrder = barIndexOrderPerPanel[barPanelKey];
    // compute x scale
    const xScale = computeXScale({
      xDomain,
      totalBarsInCluster: barIndexOrder?.length ?? 0,
      range: [0, isHorizontalRotation(chartRotation) ? smHScale.bandwidth : smVScale.bandwidth],
      barsPadding,
      enableHistogramMode,
    });

    const { stackMode } = ds;

    const leftPos = smHScale.scale(ds.smHorizontalAccessorValue) || 0;
    const topPos = smVScale.scale(ds.smVerticalAccessorValue) || 0;
    const panel: Dimensions = {
      width: smHScale.bandwidth,
      height: smVScale.bandwidth,
      top: topPos,
      left: leftPos,
    };
    const dataSeriesKey = getSeriesKey(
      {
        specId: ds.specId,
        yAccessor: ds.yAccessor,
        splitAccessors: ds.splitAccessors,
      },
      ds.groupId,
    );

    const color = seriesColorsMap.get(dataSeriesKey) || defaultColor;

    if (isBarSeriesSpec(spec)) {
      const key = getBarIndexKey(ds, enableHistogramMode);
      const shift = barIndexOrder.indexOf(key);

      if (shift === -1) {
        // skip bar dataSeries if index is not available
        continue;
      }
      const barSeriesStyle = mergePartial(chartTheme.barSeriesStyle, spec.barSeriesStyle, {
        mergeOptionalPartialValues: true,
      });

      const { yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);
      const valueFormatter = yAxis?.tickFormat ?? fallBackTickFormatter;

      const displayValueSettings = spec.displayValueSettings
        ? { valueFormatter, ...spec.displayValueSettings }
        : undefined;

      const renderedBars = renderBars(
        shift,
        ds,
        xScale,
        yScale,
        panel,
        color,
        barSeriesStyle,
        displayValueSettings,
        spec.styleAccessor,
        spec.minBarHeight,
        stackMode,
        chartRotation,
      );
      geometriesIndex.merge(renderedBars.indexedGeometryMap);
      bars.push({
        panel,
        value: renderedBars.barGeometries,
      });
      geometriesCounts.bars += renderedBars.barGeometries.length;
    } else if (isBubbleSeriesSpec(spec)) {
      const bubbleShift = barIndexOrder && barIndexOrder.length > 0 ? barIndexOrder.length : 1;
      const bubbleSeriesStyle = spec.bubbleSeriesStyle
        ? mergePartial(chartTheme.bubbleSeriesStyle, spec.bubbleSeriesStyle, { mergeOptionalPartialValues: true })
        : chartTheme.bubbleSeriesStyle;
      const xScaleOffset = computeXScaleOffset(xScale, enableHistogramMode);
      const renderedBubbles = renderBubble(
        (xScale.bandwidth * bubbleShift) / 2,
        ds,
        xScale,
        yScale,
        color,
        panel,
        isBandedSpec(spec.y0Accessors),
        xScaleOffset,
        bubbleSeriesStyle,
        {
          enabled: spec.markSizeAccessor !== undefined,
          ratio: chartTheme.markSizeRatio,
        },
        isMixedChart,
        spec.pointStyleAccessor,
      );
      geometriesIndex.merge(renderedBubbles.indexedGeometryMap);
      bubbles.push({
        panel,
        value: renderedBubbles.bubbleGeometry,
      });
      geometriesCounts.bubblePoints += renderedBubbles.bubbleGeometry.points.length;
      geometriesCounts.bubbles += 1;
    } else if (isLineSeriesSpec(spec)) {
      const lineShift = barIndexOrder && barIndexOrder.length > 0 ? barIndexOrder.length : 1;
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
        panel,
        color,
        spec.curve || CurveType.LINEAR,
        isBandedSpec(spec.y0Accessors),
        xScaleOffset,
        lineSeriesStyle,
        {
          enabled: spec.markSizeAccessor !== undefined && lineSeriesStyle.point.visible,
          ratio: chartTheme.markSizeRatio,
        },
        spec.pointStyleAccessor,
        hasFitFnConfigured(spec.fit),
      );

      geometriesIndex.merge(renderedLines.indexedGeometryMap);
      lines.push({
        panel,
        value: renderedLines.lineGeometry,
      });
      geometriesCounts.linePoints += renderedLines.lineGeometry.points.length;
      geometriesCounts.lines += 1;
    } else if (isAreaSeriesSpec(spec)) {
      const areaShift = barIndexOrder && barIndexOrder.length > 0 ? barIndexOrder.length : 1;
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
        panel,
        color,
        spec.curve || CurveType.LINEAR,
        isBandedSpec(spec.y0Accessors),
        xScaleOffset,
        areaSeriesStyle,
        {
          enabled: spec.markSizeAccessor !== undefined && areaSeriesStyle.point.visible,
          ratio: chartTheme.markSizeRatio,
        },
        spec.stackAccessors ? spec.stackAccessors.length > 0 : false,
        spec.pointStyleAccessor,
        hasFitFnConfigured(spec.fit),
      );
      geometriesIndex.merge(renderedAreas.indexedGeometryMap);
      areas.push({
        panel,
        value: renderedAreas.areaGeometry,
      });
      geometriesCounts.areasPoints += renderedAreas.areaGeometry.points.length;
      geometriesCounts.areas += 1;
    }
  }

  return {
    geometries: {
      points,
      bars,
      areas,
      lines,
      bubbles,
    },
    geometriesIndex,
    geometriesCounts,
  };
}

/** @internal */
export function computeChartTransform({ width, height }: Size, chartRotation: Rotation): Transform {
  if (chartRotation === 90) {
    return {
      x: width,
      y: 0,
      rotate: 90,
    };
  }
  if (chartRotation === -90) {
    return {
      x: 0,
      y: height,
      rotate: -90,
    };
  }
  if (chartRotation === 180) {
    return {
      x: width,
      y: height,
      rotate: 180,
    };
  }
  return {
    x: 0,
    y: 0,
    rotate: 0,
  };
}

function hasFitFnConfigured(fit?: Fit | FitConfig) {
  return Boolean(fit && ((fit as FitConfig).type || fit) !== Fit.None);
}

/** @internal */
export function getBarIndexKey(
  { spec, specId, groupId, yAccessor, splitAccessors }: DataSeries,
  histogramModeEnabled: boolean,
) {
  const isStacked = isStackedSpec(spec, histogramModeEnabled);
  if (isStacked) {
    return [groupId, '__stacked__'].join('__-__');
  }

  return [groupId, specId, ...splitAccessors.values(), yAccessor].join('__-__');
}
