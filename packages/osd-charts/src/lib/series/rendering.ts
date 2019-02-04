import { area, line } from 'd3-shape';
import { DEFAULT_THEME } from '../themes/theme';
import { SpecId } from '../utils/ids';
import { Scale, ScaleType } from '../utils/scales/scales';
import { CurveType, getCurveFactory } from './curves';
import { LegendItem } from './legend';
import { DataSeriesDatum } from './series';
import { belongsToDataSeries } from './series_utils';

export interface GeometryId {
  specId: SpecId;
  seriesKey: any[];
}

export interface GeometryValue extends GeometryId {
  datum: any;
}

/** Shared style properties for varies geometries */
export interface GeometryStyle {
  opacity: number;
}

export interface PointGeometry {
  x: number;
  y: number;
  color: string;
  value: GeometryValue;
  transform: {
    x: number;
    y: number;
  };
}
export interface BarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  value: GeometryValue;
  geometryId: GeometryId;
}
export interface LineGeometry {
  line: string;
  points: PointGeometry[];
  color: string;
  transform: {
    x: number;
    y: number;
  };
  geometryId: GeometryId;
}
export interface AreaGeometry {
  area: string;
  line: string;
  points: PointGeometry[];
  color: string;
  transform: {
    x: number;
    y: number;
  };
  geometryId: GeometryId;
}

export function renderPoints(
  shift: number,
  dataset: DataSeriesDatum[],
  xScale: Scale,
  yScale: Scale,
  color: string,
  specId: SpecId,
  seriesKey: any[],
): PointGeometry[] {
  return dataset.map((datum) => {
    return {
      x: xScale.scale(datum.x),
      y: yScale.scale(datum.y1),
      color,
      value: {
        specId,
        datum: datum.datum,
        seriesKey,
      },
      transform: {
        x: shift,
        y: 0,
      },
    };
  });
}

export function renderBars(
  orderIndex: number,
  dataset: DataSeriesDatum[],
  xScale: Scale,
  yScale: Scale,
  color: string,
  specId: SpecId,
  seriesKey: any[],
): BarGeometry[] {
  return dataset.map((datum, i) => {
    const { x, y0, y1 } = datum;
    let height = 0;
    let y = 0;
    if (yScale.type === ScaleType.Log) {
      y = y1 === 0 ? yScale.range[0] : yScale.scale(y1);
      let y0Scaled;
      if (yScale.isInverted) {
        y0Scaled = y0 === 0 ? yScale.range[1] : yScale.scale(y0);
      } else {
        y0Scaled = y0 === 0 ? yScale.range[0] : yScale.scale(y0);
      }
      height = y0Scaled - y;
    } else {
      y = yScale.scale(y1);
      height = yScale.scale(y0) - y;
    }

    return {
      x: xScale.scale(x) + xScale.bandwidth * orderIndex,
      y, // top most value
      width: xScale.bandwidth,
      height,
      color,
      value: {
        specId,
        datum: datum.datum,
        seriesKey,
      },
      geometryId: {
        specId,
        seriesKey,
      },
    };
  });
}

export function renderLine(
  shift: number,
  dataset: DataSeriesDatum[],
  xScale: Scale,
  yScale: Scale,
  color: string,
  curve: CurveType,
  specId: SpecId,
  seriesKey: any[],
): LineGeometry {
  const pathGenerator = line<DataSeriesDatum>()
    .x((datum: DataSeriesDatum) => xScale.scale(datum.x))
    .y((datum: DataSeriesDatum) => yScale.scale(datum.y1))
    .curve(getCurveFactory(curve));
  const y = 0;
  const x = shift;
  return {
    line: pathGenerator(dataset) || '',
    points: renderPoints(shift, dataset, xScale, yScale, color, specId, seriesKey),
    color,
    transform: {
      x,
      y,
    },
    geometryId: {
      specId,
      seriesKey,
    },
  };
}

export function renderArea(
  shift: number,
  dataset: DataSeriesDatum[],
  xScale: Scale,
  yScale: Scale,
  color: string,
  curve: CurveType,
  specId: SpecId,
  seriesKey: any[],
): AreaGeometry {
  const pathGenerator = area<DataSeriesDatum>()
    .x((datum: DataSeriesDatum) => xScale.scale(datum.x))
    .y1((datum: DataSeriesDatum) => yScale.scale(datum.y1))
    .y0((datum: DataSeriesDatum) => yScale.scale(datum.y0))
    .curve(getCurveFactory(curve));
  const lineGeometry = renderLine(shift, dataset, xScale, yScale, color, curve, specId, seriesKey);
  return {
    area: pathGenerator(dataset) || '',
    line: lineGeometry.line,
    points: lineGeometry.points,
    color,
    transform: lineGeometry.transform,
    geometryId: {
      specId,
      seriesKey,
    },
  };
}

export function getGeometryStyle(
  geometryId: GeometryId,
  highlightedLegendItem: LegendItem | null,
  individualHighlight?: { [key: string]: boolean },
): GeometryStyle {
  const { shared } = DEFAULT_THEME.chart.styles;

  if (highlightedLegendItem != null) {
    const isPartOfHighlightedSeries = belongsToDataSeries(geometryId, highlightedLegendItem.value);

    return isPartOfHighlightedSeries ? shared.highlighted : shared.unhighlighted;
  }

  if (individualHighlight) {
    const { hasHighlight, hasGeometryHover } = individualHighlight;
    if (!hasGeometryHover) {
      return shared.highlighted;
    }
    return hasHighlight ? shared.highlighted : shared.unhighlighted;
  }

  return shared.default;
}
