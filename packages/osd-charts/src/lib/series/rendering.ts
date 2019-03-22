import { area, line } from 'd3-shape';
import { mutableIndexedGeometryMapUpsert } from '../../state/utils';
import { SharedGeometryStyle } from '../themes/theme';
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

export interface IndexedGeometry extends GeometryValue {
  color: string;
  geom: {
    x: number;
    y: number;
    width: number;
    height: number;
    isPoint?: true;
  };
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
): {
  pointGeometries: PointGeometry[];
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const indexedGeometries: Map<any, IndexedGeometry[]> = new Map();

  const pointGeometries = dataset.map((datum) => {
    const x = xScale.scale(datum.x);
    const y = yScale.scale(datum.y1);
    const indexedGeometry: IndexedGeometry = {
      specId,
      datum: datum.datum,
      color,
      seriesKey,
      geom: {
        x: x + shift,
        y,
        width: 10,
        height: 10,
        isPoint: true,
      },
    };
    mutableIndexedGeometryMapUpsert(indexedGeometries, datum.x, indexedGeometry);
    return {
      x,
      y,
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
  return {
    pointGeometries,
    indexedGeometries,
  };
}

export function renderBars(
  orderIndex: number,
  dataset: DataSeriesDatum[],
  xScale: Scale,
  yScale: Scale,
  color: string,
  specId: SpecId,
  seriesKey: any[],
): {
  barGeometries: BarGeometry[];
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const indexedGeometries: Map<any, IndexedGeometry[]> = new Map();
  const xDomain = xScale.domain;
  const xScaleType = xScale.type;
  const barGeometries: BarGeometry[] = [];
  dataset.forEach((datum) => {
    const { y0, y1 } = datum;

    if (xScaleType === ScaleType.Ordinal && !xDomain.includes(datum.x)) {
      return;
    }

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
    const x = xScale.scale(datum.x) + xScale.bandwidth * orderIndex;
    const width = xScale.bandwidth;
    const indexedGeometry: IndexedGeometry = {
      specId,
      datum: datum.datum,
      geom: {
        x,
        y,
        width,
        height,
      },
      color,
      seriesKey,
    };
    mutableIndexedGeometryMapUpsert(indexedGeometries, datum.x, indexedGeometry);
    const barGeometry = {
      x,
      y, // top most value
      width,
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
    barGeometries.push(barGeometry);
  });
  return {
    barGeometries,
    indexedGeometries,
  };
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
): {
  lineGeometry: LineGeometry;
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const pathGenerator = line<DataSeriesDatum>()
    .x((datum: DataSeriesDatum) => xScale.scale(datum.x))
    .y((datum: DataSeriesDatum) => yScale.scale(datum.y1))
    .curve(getCurveFactory(curve));
  const y = 0;
  const x = shift;
  const { pointGeometries, indexedGeometries } = renderPoints(
    shift,
    dataset,
    xScale,
    yScale,
    color,
    specId,
    seriesKey,
  );
  const lineGeometry = {
    line: pathGenerator(dataset) || '',
    points: pointGeometries,
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
  return {
    lineGeometry,
    indexedGeometries,
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
): {
  areaGeometry: AreaGeometry;
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const pathGenerator = area<DataSeriesDatum>()
    .x((datum: DataSeriesDatum) => xScale.scale(datum.x))
    .y1((datum: DataSeriesDatum) => yScale.scale(datum.y1))
    .y0((datum: DataSeriesDatum) => yScale.scale(datum.y0))
    .curve(getCurveFactory(curve));
  const { lineGeometry, indexedGeometries } = renderLine(
    shift,
    dataset,
    xScale,
    yScale,
    color,
    curve,
    specId,
    seriesKey,
  );
  const areaGeometry = {
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
  return {
    areaGeometry,
    indexedGeometries,
  };
}

export function getGeometryStyle(
  geometryId: GeometryId,
  highlightedLegendItem: LegendItem | null,
  sharedStyle: SharedGeometryStyle,
  individualHighlight?: { [key: string]: boolean },
): GeometryStyle {
  if (highlightedLegendItem != null) {
    const isPartOfHighlightedSeries = belongsToDataSeries(geometryId, highlightedLegendItem.value);

    return isPartOfHighlightedSeries ? sharedStyle.highlighted : sharedStyle.unhighlighted;
  }

  if (individualHighlight) {
    const { hasHighlight, hasGeometryHover } = individualHighlight;
    if (!hasGeometryHover) {
      return sharedStyle.highlighted;
    }
    return hasHighlight ? sharedStyle.highlighted : sharedStyle.unhighlighted;
  }

  return sharedStyle.default;
}

export function isPointOnGeometry(x: number, y: number, { geom }: Pick<IndexedGeometry, 'geom'>) {
  if (geom.isPoint) {
    return (
      y >= geom.y - geom.height &&
      y <= geom.y + geom.height &&
      x >= geom.x - geom.width &&
      x <= geom.x + geom.width
    );
  }
  return y >= geom.y && y <= geom.y + geom.height && x >= geom.x && x <= geom.x + geom.width;
}
