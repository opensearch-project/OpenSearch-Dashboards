import { area, line } from 'd3-shape';
import { CanvasTextBBoxCalculator } from '../axes/canvas_text_bbox_calculator';
import {
  AreaSeriesStyle,
  AreaStyle,
  CustomBarSeriesStyle,
  LineSeriesStyle,
  LineStyle,
  PointStyle,
  SharedGeometryStyle,
} from '../themes/theme';
import { SpecId } from '../utils/ids';
import { isLogarithmicScale } from '../utils/scales/scale_continuous';
import { Scale, ScaleType } from '../utils/scales/scales';
import { CurveType, getCurveFactory } from './curves';
import { LegendItem } from './legend';
import { DataSeriesDatum } from './series';
import { belongsToDataSeries } from './series_utils';
import { DisplayValueSpec } from './specs';

export interface GeometryId {
  specId: SpecId;
  seriesKey: any[];
}

export interface GeometryValue {
  y: any;
  x: any;
  accessor: 'y1' | 'y0';
}

/** Shared style properties for varies geometries */
export interface GeometryStyle {
  opacity: number;
}

export type IndexedGeometry = PointGeometry | BarGeometry;

export interface PointGeometry {
  x: number;
  y: number;
  radius: number;
  color: string;
  transform: {
    x: number;
    y: number;
  };
  geometryId: GeometryId;
  value: GeometryValue;
}
export interface BarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  displayValue?: {
    text: any;
    width: number;
    height: number;
    hideClippedValue?: boolean;
    isValueContainedInElement?: boolean;
  };
  geometryId: GeometryId;
  value: GeometryValue;
  seriesStyle?: CustomBarSeriesStyle;
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
  seriesLineStyle?: LineStyle;
  seriesPointStyle?: PointStyle;
}
export interface AreaGeometry {
  area: string;
  lines: string[];
  points: PointGeometry[];
  color: string;
  transform: {
    x: number;
    y: number;
  };
  geometryId: GeometryId;
  seriesAreaStyle?: AreaStyle;
  seriesAreaLineStyle?: LineStyle;
  seriesPointStyle?: PointStyle;
}

export function isPointGeometry(ig: IndexedGeometry): ig is PointGeometry {
  return ig.hasOwnProperty('radius');
}
export function isBarGeometry(ig: IndexedGeometry): ig is BarGeometry {
  return ig.hasOwnProperty('width') && ig.hasOwnProperty('height');
}

export function mutableIndexedGeometryMapUpsert(
  mutableGeometriesIndex: Map<any, IndexedGeometry[]>,
  key: any,
  geometry: IndexedGeometry | IndexedGeometry[],
) {
  const existing = mutableGeometriesIndex.get(key);
  const upsertGeometry: IndexedGeometry[] = Array.isArray(geometry) ? geometry : [geometry];
  if (existing === undefined) {
    mutableGeometriesIndex.set(key, upsertGeometry);
  } else {
    mutableGeometriesIndex.set(key, [...upsertGeometry, ...existing]);
  }
}

export function renderPoints(
  shift: number,
  dataset: DataSeriesDatum[],
  xScale: Scale,
  yScale: Scale,
  color: string,
  specId: SpecId,
  hasY0Accessors: boolean,
  seriesKey: any[],
): {
  pointGeometries: PointGeometry[];
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const indexedGeometries: Map<any, IndexedGeometry[]> = new Map();
  const isLogScale = isLogarithmicScale(yScale);

  const pointGeometries = dataset.reduce(
    (acc, datum) => {
      const x = xScale.scale(datum.x);
      const points: PointGeometry[] = [];
      const yDatums = [datum.y1];
      if (hasY0Accessors) {
        yDatums.unshift(datum.y0);
      }
      yDatums.forEach((yDatum, index) => {
        // skip rendering point if y1 is null
        if (datum.y1 === null) {
          return;
        }
        let y;
        let radius = 10;
        const isHidden = yDatum === null || (isLogScale && yDatum <= 0);
        // we fix 0 and negative values at y = 0
        if (isHidden) {
          y = yScale.range[0];
          radius = 0;
        } else {
          y = yScale.scale(yDatum);
        }
        const originalY = hasY0Accessors && index === 0 ? datum.initialY0 : datum.initialY1;
        const pointGeometry: PointGeometry = {
          radius,
          x,
          y,
          color,
          value: {
            x: datum.x,
            y: originalY,
            accessor: hasY0Accessors && index === 0 ? 'y0' : 'y1',
          },
          transform: {
            x: shift,
            y: 0,
          },
          geometryId: {
            specId,
            seriesKey,
          },
        };
        mutableIndexedGeometryMapUpsert(indexedGeometries, datum.x, pointGeometry);
        if (!isHidden) {
          points.push(pointGeometry);
        }
      });
      return [...acc, ...points];
    },
    [] as PointGeometry[],
  );
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
  displayValueSettings?: DisplayValueSpec,
  seriesStyle?: CustomBarSeriesStyle,
): {
  barGeometries: BarGeometry[];
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const indexedGeometries: Map<any, IndexedGeometry[]> = new Map();
  const xDomain = xScale.domain;
  const xScaleType = xScale.type;
  const barGeometries: BarGeometry[] = [];

  const bboxCalculator = new CanvasTextBBoxCalculator();
  // default padding to 1 for now
  const padding = 1;
  const fontSize = seriesStyle && seriesStyle.displayValue ? seriesStyle.displayValue.fontSize : undefined;
  const fontFamily = seriesStyle && seriesStyle.displayValue ? seriesStyle.displayValue.fontFamily : undefined;

  dataset.forEach((datum) => {
    const { y0, y1, initialY1 } = datum;
    // don't create a bar if the initialY1 value is null.
    if (initialY1 === null) {
      return;
    }
    // don't create a bar if the x value is not part of the ordinal scale
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

    const formattedDisplayValue =
      displayValueSettings && displayValueSettings.valueFormatter
        ? displayValueSettings.valueFormatter(initialY1)
        : undefined;

    // only show displayValue for even bars if showOverlappingValue
    const displayValueText =
      displayValueSettings && displayValueSettings.isAlternatingValueLabel
        ? barGeometries.length % 2 === 0
          ? formattedDisplayValue
          : undefined
        : formattedDisplayValue;

    const computedDisplayValueWidth = bboxCalculator
      .compute(displayValueText || '', padding, fontSize, fontFamily)
      .getOrElse({
        width: 0,
        height: 0,
      }).width;
    const displayValueWidth =
      displayValueSettings && displayValueSettings.isValueContainedInElement ? width : computedDisplayValueWidth;

    const hideClippedValue = displayValueSettings ? displayValueSettings.hideClippedValue : undefined;

    const displayValue =
      displayValueSettings && displayValueSettings.showValueLabel
        ? {
            text: displayValueText,
            width: displayValueWidth,
            height: fontSize || 0,
            hideClippedValue,
            isValueContainedInElement: displayValueSettings.isValueContainedInElement,
          }
        : undefined;

    const barGeometry: BarGeometry = {
      displayValue,
      x,
      y, // top most value
      width,
      height,
      color,
      value: {
        x: datum.x,
        y: initialY1,
        accessor: 'y1',
      },
      geometryId: {
        specId,
        seriesKey,
      },
      seriesStyle,
    };
    mutableIndexedGeometryMapUpsert(indexedGeometries, datum.x, barGeometry);
    barGeometries.push(barGeometry);
  });

  bboxCalculator.destroy();

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
  hasY0Accessors: boolean,
  seriesKey: any[],
  xScaleOffset: number,
  seriesStyle?: LineSeriesStyle,
): {
  lineGeometry: LineGeometry;
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const isLogScale = isLogarithmicScale(yScale);

  const pathGenerator = line<DataSeriesDatum>()
    .x((datum: DataSeriesDatum) => xScale.scale(datum.x) - xScaleOffset)
    .y((datum: DataSeriesDatum) => yScale.scale(datum.y1))
    .defined((datum: DataSeriesDatum) => datum.y1 !== null && !(isLogScale && datum.y1 <= 0))
    .curve(getCurveFactory(curve));
  const y = 0;
  const x = shift;

  const seriesPointStyle = seriesStyle ? seriesStyle.point : undefined;
  const seriesLineStyle = seriesStyle ? seriesStyle.line : undefined;

  const { pointGeometries, indexedGeometries } = renderPoints(
    shift - xScaleOffset,
    dataset,
    xScale,
    yScale,
    color,
    specId,
    hasY0Accessors,
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
    seriesLineStyle,
    seriesPointStyle,
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
  hasY0Accessors: boolean,
  seriesKey: any[],
  xScaleOffset: number,
  seriesStyle?: AreaSeriesStyle,
): {
  areaGeometry: AreaGeometry;
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const isLogScale = isLogarithmicScale(yScale);

  const pathGenerator = area<DataSeriesDatum>()
    .x((datum: DataSeriesDatum) => xScale.scale(datum.x) - xScaleOffset)
    .y1((datum: DataSeriesDatum) => yScale.scale(datum.y1))
    .y0((datum: DataSeriesDatum) => {
      if (datum.y0 === null || (isLogScale && datum.y0 <= 0)) {
        return yScale.range[0];
      }
      return yScale.scale(datum.y0);
    })
    .defined((datum: DataSeriesDatum) => datum.y1 !== null && !(isLogScale && datum.y1 <= 0))
    .curve(getCurveFactory(curve));

  const y1Line = pathGenerator.lineY1()(dataset);

  const lines: string[] = [];
  if (y1Line) {
    lines.push(y1Line);
  }
  if (hasY0Accessors) {
    const y0Line = pathGenerator.lineY0()(dataset);
    if (y0Line) {
      lines.push(y0Line);
    }
  }

  const seriesPointStyle = seriesStyle ? seriesStyle.point : undefined;
  const seriesAreaStyle = seriesStyle ? seriesStyle.area : undefined;
  const seriesAreaLineStyle = seriesStyle ? seriesStyle.line : undefined;

  const { pointGeometries, indexedGeometries } = renderPoints(
    shift - xScaleOffset,
    dataset,
    xScale,
    yScale,
    color,
    specId,
    hasY0Accessors,
    seriesKey,
  );

  const areaGeometry = {
    area: pathGenerator(dataset) || '',
    lines,
    points: pointGeometries,
    color,
    transform: {
      y: 0,
      x: shift,
    },
    geometryId: {
      specId,
      seriesKey,
    },
    seriesAreaStyle,
    seriesAreaLineStyle,
    seriesPointStyle,
  };
  return {
    areaGeometry,
    indexedGeometries,
  };
}

export function getGeometryStyle(
  geometryId: GeometryId,
  highlightedLegendItem: LegendItem | null,
  sharedThemeStyle: SharedGeometryStyle,
  specOpacity?: number,
  individualHighlight?: { [key: string]: boolean },
): GeometryStyle {
  const sharedStyle =
    specOpacity == null
      ? sharedThemeStyle
      : {
          ...sharedThemeStyle,
          highlighted: { opacity: specOpacity },
          default: { opacity: specOpacity },
        };

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

export function isPointOnGeometry(
  xCoordinate: number,
  yCoordinate: number,
  indexedGeometry: BarGeometry | PointGeometry,
) {
  const { x, y } = indexedGeometry;
  if (isPointGeometry(indexedGeometry)) {
    const { radius, transform } = indexedGeometry;
    return (
      yCoordinate >= y - radius &&
      yCoordinate <= y + radius &&
      xCoordinate >= x + transform.x - radius &&
      xCoordinate <= x + transform.x + radius
    );
  }
  const { width, height } = indexedGeometry;
  return yCoordinate >= y && yCoordinate <= y + height && xCoordinate >= x && xCoordinate <= x + width;
}
