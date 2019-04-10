import { Accessor } from '../utils/accessor';
import { SpecId } from '../utils/ids';
import { TooltipValue } from '../utils/interactions';
import { IndexedGeometry } from './rendering';
import { getColorValuesAsString } from './series';
import { AxisSpec, BasicSeriesSpec, Datum, TickFormatter } from './specs';

export function getSeriesTooltipValues(
  tooltipValues: TooltipValue[],
): Map<string, any> {
  // map from seriesKey to tooltipValue
  const seriesTooltipValues = new Map();

  // First tooltipValue is the header
  if (tooltipValues.length <= 1) {
    return seriesTooltipValues;
  }

  tooltipValues.slice(1).forEach((tooltipValue: TooltipValue) => {
    const { seriesKey, value } = tooltipValue;
    seriesTooltipValues.set(seriesKey, value);
  });

  return seriesTooltipValues;
}

export function formatTooltip(
  searchIndexValue: IndexedGeometry,
  spec: BasicSeriesSpec,
  color: string,
  isHighlighted: boolean,
  yAxis?: AxisSpec,
): TooltipValue[] {
  const { seriesKey, datum } = searchIndexValue;
  let yAccessors = spec.yAccessors;
  if (yAccessors.length > 1) {
    // the last element of the seriesKey is the yAccessor
    yAccessors = seriesKey.slice(-1);
  }
  let name: string | undefined;
  if (seriesKey.length > 0) {
    name = searchIndexValue.seriesKey.join(' - ');
  } else {
    name = spec.name || `${spec.id}`;
  }
  // format y value
  return formatAccessor(
    spec.id,
    seriesKey,
    datum,
    yAccessors,
    color,
    yAxis ? yAxis.tickFormat : emptyFormatter,
    isHighlighted,
    false,
    name,
  );
}

/**
 * Format the x value for the tooltip.
 * Use the following sequence to get the name:
 * 1. (series key combination if > 1 series)
 * 2. use series id
 */
export function formatXTooltipValue(
  searchIndexValue: IndexedGeometry,
  spec: BasicSeriesSpec,
  color: string,
  xAxis?: AxisSpec,
): TooltipValue {
  let name: string | undefined;
  if (searchIndexValue.seriesKey.length > 0) {
    name = searchIndexValue.seriesKey.join(' - ');
  } else {
    name = spec.name || `${spec.id}`;
  }
  const xValues = formatAccessor(
    spec.id,
    searchIndexValue.seriesKey,
    searchIndexValue.datum,
    [spec.xAccessor],
    color,
    xAxis ? xAxis.tickFormat : emptyFormatter,
    false, // never highlighted
    true, // always x value
    name,
  );
  return xValues[0];
}

export function formatAccessor(
  specId: SpecId,
  seriesKeys: any[],
  datum: Datum,
  accessors: Accessor[] = [],
  color: string,
  formatter: TickFormatter,
  isHighlighted: boolean,
  isXValue: boolean,
  name?: string,
): TooltipValue[] {
  const seriesKey = getColorValuesAsString(seriesKeys, specId);

  return accessors.map(
    (accessor): TooltipValue => {
      return {
        seriesKey,
        name: name || `${accessor}`,
        value: formatter(datum[accessor]),
        color,
        isHighlighted,
        isXValue,
      };
    },
  );
}

function emptyFormatter(value: any): any {
  return value;
}
