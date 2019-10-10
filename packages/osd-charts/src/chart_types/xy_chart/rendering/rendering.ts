import { area, line } from 'd3-shape';

import { CanvasTextBBoxCalculator } from '../../../utils/bbox/canvas_text_bbox_calculator';
import {
  AreaSeriesStyle,
  AreaStyle,
  LineSeriesStyle,
  LineStyle,
  PointStyle,
  SharedGeometryStyle,
  BarSeriesStyle,
} from '../../../utils/themes/theme';
import { SpecId } from '../../../utils/ids';
import { isLogarithmicScale } from '../../../utils/scales/scale_continuous';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import { CurveType, getCurveFactory } from '../../../utils/curves';
import { LegendItem } from '../legend/legend';
import { DataSeriesDatum } from '../utils/series';
import { belongsToDataSeries } from '../utils/series_utils';
import { DisplayValueSpec, BarStyleAccessor, PointStyleAccessor } from '../utils/specs';
import { mergePartial } from '../../../utils/commons';

export interface GeometryId {
  specId: SpecId;
  seriesKey: any[];
}

/**
 * The accessor type
 */
export const AccessorType = Object.freeze({
  Y0: 'y0' as 'y0',
  Y1: 'y1' as 'y1',
});

export type AccessorType = typeof AccessorType.Y0 | typeof AccessorType.Y1;

export interface GeometryValue {
  y: any;
  x: any;
  accessor: AccessorType;
}

/** Shared style properties for varies geometries */
export interface GeometryStyle {
  /**
   * Opacity multiplier
   *
   * if set to `0.5` all given opacities will be halfed
   */
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
  styleOverrides?: Partial<PointStyle>;
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
  seriesStyle: BarSeriesStyle;
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
  seriesLineStyle: LineStyle;
  seriesPointStyle: PointStyle;
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
  seriesAreaStyle: AreaStyle;
  seriesAreaLineStyle: LineStyle;
  seriesPointStyle: PointStyle;
  isStacked: boolean;
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

export function getPointStyleOverrides(
  datum: DataSeriesDatum,
  geometryId: GeometryId,
  pointStyleAccessor?: PointStyleAccessor,
): Partial<PointStyle> | undefined {
  const styleOverride = pointStyleAccessor && pointStyleAccessor(datum, geometryId);

  if (!styleOverride) {
    return;
  }

  if (typeof styleOverride === 'string') {
    return {
      stroke: styleOverride,
    };
  }

  return styleOverride;
}

export function getBarStyleOverrides(
  datum: DataSeriesDatum,
  geometryId: GeometryId,
  seriesStyle: BarSeriesStyle,
  styleAccessor?: BarStyleAccessor,
): BarSeriesStyle {
  const styleOverride = styleAccessor && styleAccessor(datum, geometryId);

  if (!styleOverride) {
    return seriesStyle;
  }

  if (typeof styleOverride === 'string') {
    return {
      ...seriesStyle,
      rect: {
        ...seriesStyle.rect,
        fill: styleOverride,
      },
    };
  }

  return mergePartial(seriesStyle, styleOverride, {
    mergeOptionalPartialValues: true,
  });
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
  styleAccessor?: PointStyleAccessor,
): {
  pointGeometries: PointGeometry[];
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const indexedGeometries: Map<any, IndexedGeometry[]> = new Map();
  const isLogScale = isLogarithmicScale(yScale);
  const pointGeometries = dataset.reduce(
    (acc, datum) => {
      const { x: xValue, y0, y1, initialY0, initialY1, filled } = datum;
      // don't create the point if not within the xScale domain or it that point was filled
      if (!xScale.isValueInDomain(xValue) || (filled && filled.y1 !== undefined)) {
        return acc;
      }
      const x = xScale.scale(xValue);
      const points: PointGeometry[] = [];
      const yDatums = hasY0Accessors ? [y0, y1] : [y1];

      yDatums.forEach((yDatum, index) => {
        // skip rendering point if y1 is null
        if (y1 === null) {
          return;
        }
        let y;
        let radius = 10;
        // we fix 0 and negative values at y = 0
        if (yDatum === null || (isLogScale && yDatum <= 0)) {
          y = yScale.range[0];
          radius = 0;
        } else {
          y = yScale.scale(yDatum);
        }
        const originalY = hasY0Accessors && index === 0 ? initialY0 : initialY1;
        const geometryId = {
          specId,
          seriesKey,
        };
        const styleOverrides = getPointStyleOverrides(datum, geometryId, styleAccessor);
        const pointGeometry: PointGeometry = {
          radius,
          x,
          y,
          color,
          value: {
            x: xValue,
            y: originalY,
            accessor: hasY0Accessors && index === 0 ? AccessorType.Y0 : AccessorType.Y1,
          },
          transform: {
            x: shift,
            y: 0,
          },
          geometryId,
          styleOverrides,
        };
        mutableIndexedGeometryMapUpsert(indexedGeometries, xValue, pointGeometry);
        // use the geometry only if the yDatum in contained in the current yScale domain
        const isHidden = yDatum === null || (isLogScale && yDatum <= 0);
        if (!isHidden && yScale.isValueInDomain(yDatum)) {
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
  sharedSeriesStyle: BarSeriesStyle,
  displayValueSettings?: DisplayValueSpec,
  styleAccessor?: BarStyleAccessor,
): {
  barGeometries: BarGeometry[];
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const indexedGeometries: Map<any, IndexedGeometry[]> = new Map();
  const barGeometries: BarGeometry[] = [];

  const bboxCalculator = new CanvasTextBBoxCalculator();

  // default padding to 1 for now
  const padding = 1;
  const fontSize = sharedSeriesStyle.displayValue.fontSize;
  const fontFamily = sharedSeriesStyle.displayValue.fontFamily;

  dataset.forEach((datum) => {
    const { y0, y1, initialY1, filled } = datum;
    // don't create a bar if the initialY1 value is null.
    if (y1 === null || initialY1 === null || (filled && filled.y1 !== undefined)) {
      return;
    }
    // don't create a bar if not within the xScale domain
    if (!xScale.isValueInDomain(datum.x)) {
      return;
    }

    let y = 0;
    let y0Scaled;
    if (yScale.type === ScaleType.Log) {
      y = y1 === 0 || y1 === null ? yScale.range[0] : yScale.scale(y1);
      if (yScale.isInverted) {
        y0Scaled = y0 === 0 || y0 === null ? yScale.range[1] : yScale.scale(y0);
      } else {
        y0Scaled = y0 === 0 || y0 === null ? yScale.range[0] : yScale.scale(y0);
      }
    } else {
      y = yScale.scale(y1);
      if (yScale.isInverted) {
        // use always zero as baseline if y0 is null
        y0Scaled = y0 === null ? yScale.scale(0) : yScale.scale(y0);
      } else {
        y0Scaled = y0 === null ? yScale.scale(0) : yScale.scale(y0);
      }
    }
    const height = y0Scaled - y;

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
            height: fontSize,
            hideClippedValue,
            isValueContainedInElement: displayValueSettings.isValueContainedInElement,
          }
        : undefined;

    const geometryId = {
      specId,
      seriesKey,
    };

    const seriesStyle = getBarStyleOverrides(datum, geometryId, sharedSeriesStyle, styleAccessor);

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
        accessor: AccessorType.Y1,
      },
      geometryId,
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
  seriesStyle: LineSeriesStyle,
  pointStyleAccessor?: PointStyleAccessor,
): {
  lineGeometry: LineGeometry;
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const isLogScale = isLogarithmicScale(yScale);

  const pathGenerator = line<DataSeriesDatum>()
    .x(({ x }) => xScale.scale(x) - xScaleOffset)
    .y(({ y1 }) => {
      if (y1 !== null) {
        return yScale.scale(y1);
      }
      // this should never happen thanks to the defined function
      return yScale.isInverted ? yScale.range[1] : yScale.range[0];
    })
    .defined(({ x, y1 }) => {
      return y1 !== null && !(isLogScale && y1 <= 0) && xScale.isValueInDomain(x);
    })
    .curve(getCurveFactory(curve));
  const y = 0;
  const x = shift;

  const { pointGeometries, indexedGeometries } = renderPoints(
    shift - xScaleOffset,
    dataset,
    xScale,
    yScale,
    color,
    specId,
    hasY0Accessors,
    seriesKey,
    pointStyleAccessor,
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
    seriesLineStyle: seriesStyle.line,
    seriesPointStyle: seriesStyle.point,
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
  seriesStyle: AreaSeriesStyle,
  isStacked = false,
  pointStyleAccessor?: PointStyleAccessor,
): {
  areaGeometry: AreaGeometry;
  indexedGeometries: Map<any, IndexedGeometry[]>;
} {
  const isLogScale = isLogarithmicScale(yScale);

  const pathGenerator = area<DataSeriesDatum>()
    .x(({ x }) => xScale.scale(x) - xScaleOffset)
    .y1(({ y1 }) => {
      if (y1 !== null) {
        return yScale.scale(y1);
      }
      // this should never happen thanks to the defined function
      return yScale.isInverted ? yScale.range[1] : yScale.range[0];
    })
    .y0(({ y0 }) => {
      if (y0 === null || (isLogScale && y0 <= 0)) {
        return yScale.range[0];
      }
      return yScale.scale(y0);
    })
    .defined(({ y1, x }) => {
      return y1 !== null && !(isLogScale && y1 <= 0) && xScale.isValueInDomain(x);
    })
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

  const { pointGeometries, indexedGeometries } = renderPoints(
    shift - xScaleOffset,
    dataset,
    xScale,
    yScale,
    color,
    specId,
    hasY0Accessors,
    seriesKey,
    pointStyleAccessor,
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
    seriesAreaStyle: seriesStyle.area,
    seriesAreaLineStyle: seriesStyle.line,
    seriesPointStyle: seriesStyle.point,
    isStacked,
  };
  return {
    areaGeometry,
    indexedGeometries,
  };
}

export function getGeometryStyle(
  geometryId: GeometryId,
  highlightedLegendItem: LegendItem | null,
  sharedGeometryStyle: SharedGeometryStyle,
  individualHighlight?: { [key: string]: boolean },
): GeometryStyle {
  const { default: defaultStyles, highlighted, unhighlighted } = sharedGeometryStyle;

  if (highlightedLegendItem != null) {
    const isPartOfHighlightedSeries = belongsToDataSeries(geometryId, highlightedLegendItem.value);

    return isPartOfHighlightedSeries ? highlighted : unhighlighted;
  }

  if (individualHighlight) {
    const { hasHighlight, hasGeometryHover } = individualHighlight;
    if (!hasGeometryHover) {
      return highlighted;
    }
    return hasHighlight ? highlighted : unhighlighted;
  }

  return defaultStyles;
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

export function getGeometryIdKey(geometryId: GeometryId, prefix?: string, postfix?: string) {
  return `${prefix || ''}spec:${geometryId.specId}_${geometryId.seriesKey.join('::-::')}${postfix || ''}`;
}
