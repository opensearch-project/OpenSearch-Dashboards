import { TooltipValue } from '../utils/interactions';
import {
  AxisSpec,
  BasicSeriesSpec,
  isBandedSpec,
  isAreaSeriesSpec,
  isBarSeriesSpec,
  TickFormatterOptions,
} from '../utils/specs';
import { IndexedGeometry, BandedAccessorType } from '../../../utils/geometry';
import { getAccessorFormatLabel } from '../../../utils/accessor';
import { getSeriesKey, getSeriesLabel } from '../utils/series';

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

  tooltipValues.forEach(({ seriesKey, value, yAccessor }) => {
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
  { color, value: { x, y, accessor }, seriesIdentifier }: IndexedGeometry,
  spec: BasicSeriesSpec,
  isXValue: boolean,
  isHighlighted: boolean,
  hasSingleSeries: boolean,
  axisSpec?: AxisSpec,
): TooltipValue {
  const seriesKey = getSeriesKey(seriesIdentifier);
  let displayName = getSeriesLabel(seriesIdentifier, hasSingleSeries, true, spec);

  if (isBandedSpec(spec.y0Accessors) && (isAreaSeriesSpec(spec) || isBarSeriesSpec(spec))) {
    const { y0AccessorFormat = Y0_ACCESSOR_POSTFIX, y1AccessorFormat = Y1_ACCESSOR_POSTFIX } = spec;
    const formatter = accessor === BandedAccessorType.Y0 ? y0AccessorFormat : y1AccessorFormat;
    displayName = getAccessorFormatLabel(formatter, displayName);
  }
  const isFiltered = spec.filterSeriesInTooltip !== undefined ? spec.filterSeriesInTooltip(seriesIdentifier) : true;
  const isVisible = displayName === '' ? false : isFiltered;

  const value = isXValue ? x : y;
  const tickFormatOptions: TickFormatterOptions | undefined = spec.timeZone ? { timeZone: spec.timeZone } : undefined;
  return {
    seriesKey,
    name: displayName,
    value: axisSpec ? axisSpec.tickFormat(value, tickFormatOptions) : emptyFormatter(value),
    color,
    isHighlighted: isXValue ? false : isHighlighted,
    isXValue,
    yAccessor: accessor,
    isVisible,
  };
}

function emptyFormatter<T>(value: T): T {
  return value;
}
