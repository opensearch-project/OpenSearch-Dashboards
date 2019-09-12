import { isVerticalAxis } from '../utils/axis_utils';
import { CurveType } from '../../../utils/curves';
import { mergeXDomain, XDomain } from '../domains/x_domain';
import { mergeYDomain, YDomain } from '../domains/y_domain';
import {
  AreaGeometry,
  BarGeometry,
  IndexedGeometry,
  LineGeometry,
  mutableIndexedGeometryMapUpsert,
  PointGeometry,
  renderArea,
  renderBars,
  renderLine,
} from '../rendering/rendering';
import { computeXScale, computeYScales, countBarsInCluster } from '../utils/scales';
import {
  DataSeries,
  DataSeriesColorsValues,
  findDataSeriesByColorValues,
  FormattedDataSeries,
  getColorValuesAsString,
  getFormattedDataseries,
  getSplittedSeries,
} from '../utils/series';
import {
  AreaSeriesSpec,
  AxisSpec,
  BasicSeriesSpec,
  DomainRange,
  HistogramModeAlignment,
  HistogramModeAlignments,
  isAreaSeriesSpec,
  isBarSeriesSpec,
  isLineSeriesSpec,
  LineSeriesSpec,
  Rotation,
} from '../utils/specs';
import { ColorConfig, Theme } from '../../../utils/themes/theme';
import { identity, mergePartial } from '../../../utils/commons';
import { Dimensions } from '../../../utils/dimensions';
import { Domain } from '../../../utils/domain';
import { AxisId, GroupId, SpecId } from '../../../utils/ids';
import { Scale } from '../../../utils/scales/scales';
import { SeriesDomainsAndData } from './chart_state';
import { LegendItem } from '../legend/legend';

const MAX_ANIMATABLE_BARS = 300;
const MAX_ANIMATABLE_LINES_AREA_POINTS = 600;

export interface Transform {
  x: number;
  y: number;
  rotate: number;
}
export interface BrushExtent {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface GeometriesCounts {
  points: number;
  bars: number;
  areas: number;
  areasPoints: number;
  lines: number;
  linePoints: number;
}

export function updateDeselectedDataSeries(
  series: DataSeriesColorsValues[] | null,
  value: DataSeriesColorsValues,
): DataSeriesColorsValues[] {
  const seriesIndex = findDataSeriesByColorValues(series, value);
  const updatedSeries = series ? [...series] : [];

  if (seriesIndex > -1) {
    updatedSeries.splice(seriesIndex, 1);
  } else {
    updatedSeries.push(value);
  }
  return updatedSeries;
}

export function getUpdatedCustomSeriesColors(seriesSpecs: Map<SpecId, BasicSeriesSpec>): Map<string, string> {
  const updatedCustomSeriesColors = new Map();
  seriesSpecs.forEach((spec: BasicSeriesSpec) => {
    if (spec.customSeriesColors) {
      spec.customSeriesColors.forEach((color: string, seriesColorValues: DataSeriesColorsValues) => {
        const { colorValues, specId } = seriesColorValues;
        const seriesLabel = getColorValuesAsString(colorValues, specId);
        updatedCustomSeriesColors.set(seriesLabel, color);
      });
    }
  });
  return updatedCustomSeriesColors;
}

export function getLastValues(formattedDataSeries: {
  stacked: FormattedDataSeries[];
  nonStacked: FormattedDataSeries[];
}): Map<string, number> {
  const lastValues = new Map<string, number>();

  // we need to get the latest
  formattedDataSeries.stacked.forEach((ds) => {
    ds.dataSeries.forEach((series) => {
      if (series.data.length > 0) {
        const last = series.data[series.data.length - 1];
        if (last !== null && last.initialY1 !== null) {
          lastValues.set(series.seriesColorKey, last.initialY1);
        }
      }
    });
  });
  formattedDataSeries.nonStacked.forEach((ds) => {
    ds.dataSeries.forEach((series) => {
      if (series.data.length > 0) {
        const last = series.data[series.data.length - 1];
        if (last !== null && last.initialY1 !== null) {
          lastValues.set(series.seriesColorKey, last.initialY1);
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
 */
export function computeSeriesDomains(
  seriesSpecs: Map<SpecId, BasicSeriesSpec>,
  customYDomainsByGroupId: Map<GroupId, DomainRange>,
  customXDomain?: DomainRange | Domain,
  deselectedDataSeries?: DataSeriesColorsValues[] | null,
): SeriesDomainsAndData {
  const { splittedSeries, xValues, seriesColors } = getSplittedSeries(seriesSpecs, deselectedDataSeries);

  const splittedDataSeries = [...splittedSeries.values()];
  const specsArray = [...seriesSpecs.values()];

  const xDomain = mergeXDomain(specsArray, xValues, customXDomain);
  const yDomain = mergeYDomain(splittedSeries, specsArray, customYDomainsByGroupId);

  const formattedDataSeries = getFormattedDataseries(specsArray, splittedSeries);

  // we need to get the last values from the formatted dataseries
  // because we change the format if we are on percentage mode
  const lastValues = getLastValues(formattedDataSeries);
  const updatedSeriesColors = new Map<string, DataSeriesColorsValues>();
  seriesColors.forEach((value, key) => {
    const lastValue = lastValues.get(key);
    const updatedColorSet = {
      ...value,
      lastValue,
    };
    updatedSeriesColors.set(key, updatedColorSet);
  });
  return {
    xDomain,
    yDomain,
    splittedDataSeries,
    formattedDataSeries,
    seriesColors: updatedSeriesColors,
  };
}

export function computeSeriesGeometries(
  seriesSpecs: Map<SpecId, BasicSeriesSpec>,
  xDomain: XDomain,
  yDomain: YDomain[],
  formattedDataSeries: {
    stacked: FormattedDataSeries[];
    nonStacked: FormattedDataSeries[];
  },
  seriesColorMap: Map<string, string>,
  chartTheme: Theme,
  chartDims: Dimensions,
  chartRotation: Rotation,
  axesSpecs: Map<AxisId, AxisSpec>,
  enableHistogramMode: boolean,
): {
  scales: {
    xScale: Scale;
    yScales: Map<GroupId, Scale>;
  };
  geometries: {
    points: PointGeometry[];
    bars: BarGeometry[];
    areas: AreaGeometry[];
    lines: LineGeometry[];
  };
  geometriesIndex: Map<any, IndexedGeometry[]>;
  geometriesCounts: GeometriesCounts;
} {
  const chartColors: ColorConfig = chartTheme.colors;
  const barsPadding = enableHistogramMode ? chartTheme.scales.histogramPadding : chartTheme.scales.barsPadding;

  const width = [0, 180].includes(chartRotation) ? chartDims.width : chartDims.height;
  const height = [0, 180].includes(chartRotation) ? chartDims.height : chartDims.width;
  // const { width, height } = chartDims;
  const { stacked, nonStacked } = formattedDataSeries;

  // compute how many series are clustered
  const { stackedBarsInCluster, totalBarsInCluster } = countBarsInCluster(stacked, nonStacked);

  // compute scales
  const xScale = computeXScale({ xDomain, totalBarsInCluster, range: [0, width], barsPadding, enableHistogramMode });
  const yScales = computeYScales({ yDomains: yDomain, range: [height, 0] });

  // compute colors

  // compute geometries
  const points: PointGeometry[] = [];
  const areas: AreaGeometry[] = [];
  const bars: BarGeometry[] = [];
  const lines: LineGeometry[] = [];
  let stackedGeometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  let nonStackedGeometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  let orderIndex = 0;
  const geometriesCounts = {
    points: 0,
    bars: 0,
    areas: 0,
    areasPoints: 0,
    lines: 0,
    linePoints: 0,
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
    points.push(...geometries.points);
    stackedGeometriesIndex = mergeGeometriesIndexes(stackedGeometriesIndex, geometries.geometriesIndex);
    // update counts
    geometriesCounts.points += geometries.geometriesCounts.points;
    geometriesCounts.bars += geometries.geometriesCounts.bars;
    geometriesCounts.areas += geometries.geometriesCounts.areas;
    geometriesCounts.areasPoints += geometries.geometriesCounts.areasPoints;
    geometriesCounts.lines += geometries.geometriesCounts.lines;
    geometriesCounts.linePoints += geometries.geometriesCounts.linePoints;
  });
  formattedDataSeries.nonStacked.map((dataSeriesGroup) => {
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
    points.push(...geometries.points);

    nonStackedGeometriesIndex = mergeGeometriesIndexes(nonStackedGeometriesIndex, geometries.geometriesIndex);
    // update counts
    geometriesCounts.points += geometries.geometriesCounts.points;
    geometriesCounts.bars += geometries.geometriesCounts.bars;
    geometriesCounts.areas += geometries.geometriesCounts.areas;
    geometriesCounts.areasPoints += geometries.geometriesCounts.areasPoints;
    geometriesCounts.lines += geometries.geometriesCounts.lines;
    geometriesCounts.linePoints += geometries.geometriesCounts.linePoints;
  });
  const geometriesIndex = mergeGeometriesIndexes(stackedGeometriesIndex, nonStackedGeometriesIndex);
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
    },
    geometriesIndex,
    geometriesCounts,
  };
}

export function setBarSeriesAccessors(isHistogramMode: boolean, seriesSpecs: Map<SpecId, BasicSeriesSpec>): void {
  if (!isHistogramMode) {
    return;
  }

  for (const [, spec] of seriesSpecs) {
    if (isBarSeriesSpec(spec)) {
      let stackAccessors = spec.stackAccessors ? [...spec.stackAccessors] : spec.yAccessors;

      if (spec.splitSeriesAccessors) {
        stackAccessors = [...stackAccessors, ...spec.splitSeriesAccessors];
      }

      spec.stackAccessors = stackAccessors;
    }
  }

  return;
}

export function isHistogramModeEnabled(seriesSpecs: Map<SpecId, BasicSeriesSpec>): boolean {
  for (const [, spec] of seriesSpecs) {
    if (isBarSeriesSpec(spec) && spec.enableHistogramMode) {
      return true;
    }
  }
  return false;
}

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

export function renderGeometries(
  indexOffset: number,
  clusteredCount: number,
  isStacked: boolean,
  dataSeries: DataSeries[],
  xScale: Scale,
  yScale: Scale,
  seriesSpecs: Map<SpecId, BasicSeriesSpec>,
  seriesColorsMap: Map<string, string>,
  defaultColor: string,
  axesSpecs: Map<AxisId, AxisSpec>,
  chartTheme: Theme,
  enableHistogramMode: boolean,
): {
  points: PointGeometry[];
  bars: BarGeometry[];
  areas: AreaGeometry[];
  lines: LineGeometry[];
  geometriesIndex: Map<any, IndexedGeometry[]>;
  geometriesCounts: GeometriesCounts;
} {
  const len = dataSeries.length;
  let i;
  const points: PointGeometry[] = [];
  const bars: BarGeometry[] = [];
  const areas: AreaGeometry[] = [];
  const lines: LineGeometry[] = [];
  const pointGeometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  let barGeometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  let lineGeometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  let areaGeometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  const geometriesCounts = {
    points: 0,
    bars: 0,
    areas: 0,
    areasPoints: 0,
    lines: 0,
    linePoints: 0,
  };
  let barIndexOffset = 0;
  for (i = 0; i < len; i++) {
    const ds = dataSeries[i];
    const spec = getSpecById(seriesSpecs, ds.specId);
    if (spec === undefined) {
      continue;
    }
    const color = seriesColorsMap.get(ds.seriesColorKey) || defaultColor;

    if (isBarSeriesSpec(spec)) {
      const shift = isStacked ? indexOffset : indexOffset + barIndexOffset;
      const barSeriesStyle = mergePartial(chartTheme.barSeriesStyle, spec.barSeriesStyle, {
        mergeOptionalPartialValues: true,
      });

      const { yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);
      const valueFormatter = yAxis && yAxis.tickFormat ? yAxis.tickFormat : identity;

      const displayValueSettings = spec.displayValueSettings
        ? {
            valueFormatter,
            ...spec.displayValueSettings,
          }
        : undefined;

      const renderedBars = renderBars(
        shift,
        ds.data,
        xScale,
        yScale,
        color,
        ds.specId,
        ds.key,
        barSeriesStyle,
        displayValueSettings,
        spec.styleAccessor,
      );
      barGeometriesIndex = mergeGeometriesIndexes(barGeometriesIndex, renderedBars.indexedGeometries);
      bars.push(...renderedBars.barGeometries);
      geometriesCounts.bars += renderedBars.barGeometries.length;
      barIndexOffset += 1;
    } else if (isLineSeriesSpec(spec)) {
      const lineShift = clusteredCount > 0 ? clusteredCount : 1;
      const lineSeriesStyle = spec.lineSeriesStyle
        ? mergePartial(chartTheme.lineSeriesStyle, spec.lineSeriesStyle, { mergeOptionalPartialValues: true })
        : chartTheme.lineSeriesStyle;

      const xScaleOffset = computeXScaleOffset(xScale, enableHistogramMode, spec.histogramModeAlignment);

      const renderedLines = renderLine(
        // move the point on half of the bandwidth if we have mixed bars/lines
        (xScale.bandwidth * lineShift) / 2,
        ds.data,
        xScale,
        yScale,
        color,
        (spec as LineSeriesSpec).curve || CurveType.LINEAR,
        ds.specId,
        Boolean(spec.y0Accessors),
        ds.key,
        xScaleOffset,
        lineSeriesStyle,
      );
      lineGeometriesIndex = mergeGeometriesIndexes(lineGeometriesIndex, renderedLines.indexedGeometries);
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
        ds.data,
        xScale,
        yScale,
        color,
        (spec as AreaSeriesSpec).curve || CurveType.LINEAR,
        ds.specId,
        Boolean(spec.y0Accessors),
        ds.key,
        xScaleOffset,
        areaSeriesStyle,
        isStacked,
      );
      areaGeometriesIndex = mergeGeometriesIndexes(areaGeometriesIndex, renderedAreas.indexedGeometries);
      areas.push(renderedAreas.areaGeometry);
      geometriesCounts.areasPoints += renderedAreas.areaGeometry.points.length;
      geometriesCounts.areas += 1;
    }
  }
  const geometriesIndex = mergeGeometriesIndexes(
    pointGeometriesIndex,
    lineGeometriesIndex,
    areaGeometriesIndex,
    barGeometriesIndex,
  );
  return {
    points,
    bars,
    areas,
    lines,
    geometriesIndex,
    geometriesCounts,
  };
}

export function getSpecById(seriesSpecs: Map<SpecId, BasicSeriesSpec>, specId: SpecId) {
  return seriesSpecs.get(specId);
}

export function getAxesSpecForSpecId(axesSpecs: Map<AxisId, AxisSpec>, groupId: GroupId) {
  let xAxis;
  let yAxis;
  for (const axisSpec of axesSpecs.values()) {
    if (axisSpec.groupId !== groupId) {
      continue;
    }
    if (isVerticalAxis(axisSpec.position)) {
      yAxis = axisSpec;
    } else {
      xAxis = axisSpec;
    }
  }
  return {
    xAxis,
    yAxis,
  };
}

export function computeChartTransform(chartDimensions: Dimensions, chartRotation: Rotation): Transform {
  if (chartRotation === 90) {
    return {
      x: chartDimensions.width,
      y: 0,
      rotate: 90,
    };
  } else if (chartRotation === -90) {
    return {
      x: 0,
      y: chartDimensions.height,
      rotate: -90,
    };
  } else if (chartRotation === 180) {
    return {
      x: chartDimensions.width,
      y: chartDimensions.height,
      rotate: 180,
    };
  } else {
    return {
      x: 0,
      y: 0,
      rotate: 0,
    };
  }
}

export function computeBrushExtent(
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  chartTransform: Transform,
): BrushExtent {
  const minX = [0, 180].includes(chartRotation)
    ? chartDimensions.left + chartTransform.x
    : chartDimensions.top + chartTransform.y;
  const minY = [0, 180].includes(chartRotation)
    ? chartDimensions.top + chartTransform.y
    : chartDimensions.left + chartTransform.x;
  const maxX = minX + chartDimensions.width;
  const maxY = minY + chartDimensions.height;
  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}

/**
 * Merge multiple geometry indexes maps together.
 * @param iterables a set of maps to be merged
 * @returns a new Map where each element with the same key are concatenated on a single
 * IndexedGemoetry array for that key
 */
export function mergeGeometriesIndexes(...iterables: Map<any, IndexedGeometry[]>[]) {
  const geometriesIndex: Map<any, IndexedGeometry[]> = new Map();

  for (const iterable of iterables) {
    for (const item of iterable) {
      mutableIndexedGeometryMapUpsert(geometriesIndex, item[0], item[1]);
    }
  }
  return geometriesIndex;
}

export function isHorizontalRotation(chartRotation: Rotation) {
  return chartRotation === 0 || chartRotation === 180;
}

export function isVerticalRotation(chartRotation: Rotation) {
  return chartRotation === -90 || chartRotation === 90;
}

/**
 * Check if a specs map contains only line or area specs
 * @param specs Map<SpecId, BasicSeriesSpec>
 */
export function isLineAreaOnlyChart(specs: Map<SpecId, BasicSeriesSpec>) {
  return ![...specs.values()].some((spec) => {
    return spec.seriesType === 'bar';
  });
}

export function isChartAnimatable(geometriesCounts: GeometriesCounts, animationEnabled: boolean): boolean {
  if (!animationEnabled) {
    return false;
  }
  const { bars, linePoints, areasPoints } = geometriesCounts;
  const isBarsAnimatable = bars <= MAX_ANIMATABLE_BARS;
  const isLinesAndAreasAnimatable = linePoints + areasPoints <= MAX_ANIMATABLE_LINES_AREA_POINTS;
  return isBarsAnimatable && isLinesAndAreasAnimatable;
}

export function isAllSeriesDeselected(legendItems: Map<string, LegendItem>): boolean {
  for (const [, legendItem] of legendItems) {
    if (legendItem.isSeriesVisible) {
      return false;
    }
  }
  return true;
}
