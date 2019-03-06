import { isVertical } from '../lib/axes/axis_utils';
import { CurveType } from '../lib/series/curves';
import { mergeXDomain, XDomain } from '../lib/series/domains/x_domain';
import { mergeYDomain, YDomain } from '../lib/series/domains/y_domain';
import { LegendItem } from '../lib/series/legend';
import {
  AreaGeometry,
  BarGeometry,
  LineGeometry,
  PointGeometry,
  renderArea,
  renderBars,
  renderLine,
  renderPoints,
} from '../lib/series/rendering';
import { computeXScale, computeYScales, countClusteredSeries } from '../lib/series/scales';
import {
  DataSeries,
  DataSeriesColorsValues,
  FormattedDataSeries,
  getFormattedDataseries,
  getSplittedSeries,
  RawDataSeries,
} from '../lib/series/series';
import { isEqualSeriesKey } from '../lib/series/series_utils';
import {
  AreaSeriesSpec,
  AxisSpec,
  BasicSeriesSpec,
  LineSeriesSpec,
  Rotation,
} from '../lib/series/specs';
import { ColorConfig } from '../lib/themes/theme';
import { Dimensions } from '../lib/utils/dimensions';
import { AxisId, GroupId, SpecId } from '../lib/utils/ids';
import { Scale } from '../lib/utils/scales/scales';

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

export function getLegendItemByIndex(items: LegendItem[], index: number): LegendItem | null {
  if (index < 0 || index >= items.length) {
    return null;
  }
  return items[index];
}

export function findSelectedDataSeries(
  series: DataSeriesColorsValues[] | null,
  value: DataSeriesColorsValues,
): number {
  if (!series) {
    return -1;
  }

  return series.findIndex((item: DataSeriesColorsValues) => {
    return isEqualSeriesKey(item.colorValues, value.colorValues) && item.specId === value.specId;
  });
}

export function getAllDataSeriesColorValues(
  seriesColors: Map<string, DataSeriesColorsValues>,
): DataSeriesColorsValues[] {
  return Array.from(seriesColors.values());
}

export function updateSelectedDataSeries(
  series: DataSeriesColorsValues[] | null,
  value: DataSeriesColorsValues,
): DataSeriesColorsValues[] {

  const seriesIndex = findSelectedDataSeries(series, value);
  const updatedSeries = series ? [...series] : [];

  if (seriesIndex > -1) {
    updatedSeries.splice(seriesIndex, 1);
  } else {
    updatedSeries.push(value);
  }
  return updatedSeries;
}

export function computeSeriesDomains(
  seriesSpecs: Map<SpecId, BasicSeriesSpec>,
  selectedDataSeries?: DataSeriesColorsValues[] | null,
): {
  xDomain: XDomain;
  yDomain: YDomain[];
  splittedDataSeries: RawDataSeries[][];
  formattedDataSeries: {
    stacked: FormattedDataSeries[];
    nonStacked: FormattedDataSeries[];
  };
  seriesColors: Map<string, DataSeriesColorsValues>;
} {
  const { splittedSeries, xValues, seriesColors } = getSplittedSeries(seriesSpecs, selectedDataSeries);
  // tslint:disable-next-line:no-console
  // console.log({ splittedSeries, xValues, seriesColors });
  const splittedDataSeries = [...splittedSeries.values()];
  const specsArray = [...seriesSpecs.values()];
  const xDomain = mergeXDomain(specsArray, xValues);
  const yDomain = mergeYDomain(splittedSeries, specsArray);
  const formattedDataSeries = getFormattedDataseries(specsArray, splittedSeries);
  // tslint:disable-next-line:no-console
  // console.log({ formattedDataSeries, xDomain, yDomain });

  return {
    xDomain,
    yDomain,
    splittedDataSeries,
    formattedDataSeries,
    seriesColors,
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
  chartColors: ColorConfig,
  chartDims: Dimensions,
  chartRotation: Rotation,
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
} {
  const width = [0, 180].includes(chartRotation) ? chartDims.width : chartDims.height;
  const height = [0, 180].includes(chartRotation) ? chartDims.height : chartDims.width;
  // const { width, height } = chartDims;
  const { stacked, nonStacked } = formattedDataSeries;

  // compute how many series are clustered
  const { stackedGroupCount, totalGroupCount } = countClusteredSeries(stacked, nonStacked);

  // compute scales
  const xScale = computeXScale(xDomain, totalGroupCount, 0, width);
  const yScales = computeYScales(yDomain, height, 0);

  // compute colors

  // compute geometries
  const points: PointGeometry[] = [];
  const areas: AreaGeometry[] = [];
  const bars: BarGeometry[] = [];
  const lines: LineGeometry[] = [];
  let orderIndex = 0;
  formattedDataSeries.stacked.forEach((dataSeriesGroup, index) => {
    const { groupId, dataSeries, counts } = dataSeriesGroup;
    const yScale = yScales.get(groupId);
    if (!yScale) {
      return;
    }

    const geometries = renderGeometries(
      orderIndex,
      totalGroupCount,
      true,
      dataSeries,
      xScale,
      yScale,
      seriesSpecs,
      seriesColorMap,
      chartColors.defaultVizColor,
    );
    orderIndex = counts.barSeries > 0 ? orderIndex + 1 : orderIndex;
    areas.push(...geometries.areas);
    lines.push(...geometries.lines);
    bars.push(...geometries.bars);
    points.push(...geometries.points);

    // console.log(geometries);
  });
  formattedDataSeries.nonStacked.map((dataSeriesGroup, index) => {
    const { groupId, dataSeries } = dataSeriesGroup;
    const yScale = yScales.get(groupId);
    if (!yScale) {
      return;
    }
    const geometries = renderGeometries(
      stackedGroupCount,
      totalGroupCount,
      false,
      dataSeries,
      xScale,
      yScale,
      seriesSpecs,
      seriesColorMap,
      chartColors.defaultVizColor,
    );

    areas.push(...geometries.areas);
    lines.push(...geometries.lines);
    bars.push(...geometries.bars);
    points.push(...geometries.points);
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
    },
  };
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
): {
  points: PointGeometry[];
  bars: BarGeometry[];
  areas: AreaGeometry[];
  lines: LineGeometry[];
} {
  const len = dataSeries.length;
  let i;
  const points = [];
  const bars = [];
  const areas = [];
  const lines = [];
  for (i = 0; i < len; i++) {
    const ds = dataSeries[i];
    const spec = getSpecById(seriesSpecs, ds.specId);
    if (spec === undefined) {
      continue;
    }
    const color = seriesColorsMap.get(ds.seriesColorKey) || defaultColor;
    switch (spec.seriesType) {
      case 'basic':
        const pointShift = clusteredCount > 0 ? clusteredCount : 1;

        const point = renderPoints(
          (xScale.bandwidth * pointShift) / 2,
          ds.data,
          xScale,
          yScale,
          color,
          ds.specId,
          ds.key,
        );
        points.push(...point);
        break;
      case 'bar':
        const shift = isStacked ? indexOffset : indexOffset + i;
        const bar = renderBars(shift, ds.data, xScale, yScale, color, ds.specId, ds.key);
        bars.push(...bar);
        break;
      case 'line':
        const lineShift = clusteredCount > 0 ? clusteredCount : 1;
        const line = renderLine(
          (xScale.bandwidth * lineShift) / 2,
          ds.data,
          xScale,
          yScale,
          color,
          (spec as LineSeriesSpec).curve || CurveType.LINEAR,
          ds.specId,
          ds.key,
        );
        lines.push(line);
        break;
      case 'area':
        const areaShift = clusteredCount > 0 ? clusteredCount : 1;
        const area = renderArea(
          (xScale.bandwidth * areaShift) / 2,
          ds.data,
          xScale,
          yScale,
          color,
          (spec as AreaSeriesSpec).curve || CurveType.LINEAR,
          ds.specId,
          ds.key,
        );
        areas.push(area);
        break;
    }
  }
  return {
    points,
    bars,
    areas,
    lines,
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
    if (isVertical(axisSpec.position)) {
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

export function computeChartTransform(
  chartDimensions: Dimensions,
  chartRotation: Rotation,
): Transform {
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
