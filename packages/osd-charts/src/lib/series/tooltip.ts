import { Accessor } from '../utils/accessor';
import { TooltipValue } from '../utils/interactions';
import { IndexedGeometry } from './rendering';
import { AxisSpec, BasicSeriesSpec, Datum, TickFormatter } from './specs';

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
    name = `${spec.id}`;
  }
  // format y value
  return formatAccessor(
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
    name = `${spec.id}`;
  }
  const xValues = formatAccessor(
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
function formatAccessor(
  datum: Datum,
  accessors: Accessor[] = [],
  color: string,
  formatter: TickFormatter,
  isHighlighted: boolean,
  isXValue: boolean,
  name?: string,
): TooltipValue[] {
  return accessors.map(
    (accessor): TooltipValue => {
      return {
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
