import { TooltipValue } from '../utils/interactions';
import { getColorValuesAsString } from '../utils/series';
import {
  AxisSpec,
  BasicSeriesSpec,
  isBandedSpec,
  isAreaSeriesSpec,
  isBarSeriesSpec,
  TickFormatterOptions,
} from '../utils/specs';
import { IndexedGeometry, AccessorType } from '../../../utils/geometry';
import { getAccessorFormatLabel } from '../../../utils/accessor';

export interface TooltipLegendValue {
  y0: any;
  y1: any;
}

export const Y0_ACCESSOR_POSTFIX = ' - lower';
export const Y1_ACCESSOR_POSTFIX = ' - upper';

export function getSeriesTooltipValues(
  tooltipValues: TooltipValue[],
  defaultValue?: string,
): Map<string, TooltipLegendValue> {
  // map from seriesKey to TooltipLegendValue
  const seriesTooltipValues = new Map<string, TooltipLegendValue>();

  // First TooltipLegendValue is the header
  if (tooltipValues.length <= 1) {
    return seriesTooltipValues;
  }

  tooltipValues.slice(1).forEach(({ seriesKey, value, yAccessor }) => {
    const seriesValue = defaultValue ? defaultValue : value;
    const current = seriesTooltipValues.get(seriesKey) || {};

    seriesTooltipValues.set(seriesKey, {
      y0: defaultValue,
      y1: defaultValue,
      ...current,
      [yAccessor]: seriesValue,
    });
  });

  return seriesTooltipValues;
}

export function formatTooltip(
  { color, value: { x, y, accessor }, geometryId: { seriesKey } }: IndexedGeometry,
  spec: BasicSeriesSpec,
  isXValue: boolean,
  isHighlighted: boolean,
  axisSpec?: AxisSpec,
): TooltipValue {
  const seriesKeyAsString = getColorValuesAsString(seriesKey, spec.id);
  let displayName: string | undefined;
  if (seriesKey.length > 0) {
    displayName = seriesKey.join(' - ');
  } else {
    displayName = spec.name || `${spec.id}`;
  }

  if (isBandedSpec(spec.y0Accessors) && (isAreaSeriesSpec(spec) || isBarSeriesSpec(spec))) {
    const { y0AccessorFormat = Y0_ACCESSOR_POSTFIX, y1AccessorFormat = Y1_ACCESSOR_POSTFIX } = spec;
    const formatter = accessor === AccessorType.Y0 ? y0AccessorFormat : y1AccessorFormat;
    displayName = getAccessorFormatLabel(formatter, displayName);
  }

  const value = isXValue ? x : y;
  const tickFormatOptions: TickFormatterOptions | undefined = spec.timeZone ? { timeZone: spec.timeZone } : undefined;
  return {
    seriesKey: seriesKeyAsString,
    name: displayName,
    value: axisSpec ? axisSpec.tickFormat(value, tickFormatOptions) : emptyFormatter(value),
    color,
    isHighlighted: isXValue ? false : isHighlighted,
    isXValue,
    yAccessor: accessor,
  };
}

function emptyFormatter<T>(value: T): T {
  return value;
}
