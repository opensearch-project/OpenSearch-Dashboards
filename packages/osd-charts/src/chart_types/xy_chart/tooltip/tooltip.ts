import { TooltipValue, isFollowTooltipType, TooltipType, TooltipValueFormatter } from '../utils/interactions';
import { IndexedGeometry, isPointOnGeometry } from '../rendering/rendering';
import { getColorValuesAsString } from '../utils/series';
import { AxisSpec, BasicSeriesSpec, Rotation } from '../utils/specs';
import { SpecId, AxisId, GroupId } from '../../../utils/ids';
import { getAxesSpecForSpecId } from '../store/utils';
import { Scale } from '../../../utils/scales/scales';
import { Point } from '../store/chart_state';

export function getSeriesTooltipValues(tooltipValues: TooltipValue[], defaultValue?: string): Map<string, any> {
  // map from seriesKey to tooltipValue
  const seriesTooltipValues = new Map();

  // First tooltipValue is the header
  if (tooltipValues.length <= 1) {
    return seriesTooltipValues;
  }

  tooltipValues.slice(1).forEach((tooltipValue: TooltipValue) => {
    const { seriesKey, value } = tooltipValue;
    seriesTooltipValues.set(seriesKey, defaultValue ? defaultValue : value);
  });

  return seriesTooltipValues;
}

export function formatTooltip(
  searchIndexValue: IndexedGeometry,
  spec: BasicSeriesSpec,
  isXValue: boolean,
  isHighlighted: boolean,
  axisSpec?: AxisSpec,
): TooltipValue {
  const { id } = spec;
  const {
    color,
    value: { x, y, accessor },
    geometryId: { seriesKey },
  } = searchIndexValue;
  const seriesKeyAsString = getColorValuesAsString(seriesKey, id);
  let name: string | undefined;
  if (seriesKey.length > 0) {
    name = seriesKey.join(' - ');
  } else {
    name = spec.name || `${spec.id}`;
  }

  const value = isXValue ? x : y;
  return {
    seriesKey: seriesKeyAsString,
    name,
    value: axisSpec ? axisSpec.tickFormat(value) : emptyFormatter(value),
    color,
    isHighlighted: isXValue ? false : isHighlighted,
    isXValue,
    yAccessor: accessor,
  };
}

function emptyFormatter<T>(value: T): T {
  return value;
}

export function getTooltipAndHighlightFromXValue(
  axisCursorPosition: Point,
  seriesSpecs: Map<SpecId, BasicSeriesSpec>,
  axesSpecs: Map<AxisId, AxisSpec>,
  geometriesIndex: Map<any, IndexedGeometry[]>,
  xValue: {
    value: any;
    withinBandwidth: boolean;
  },
  isActiveChart: boolean,
  tooltipType: TooltipType,
  chartRotation: Rotation,
  yScales?: Map<GroupId, Scale>,
  tooltipHeaderFormatter?: TooltipValueFormatter,
):
  | {
      tooltipData: TooltipValue[];
      highlightedGeometries: IndexedGeometry[];
    }
  | undefined {
  // get the elements on at this cursor position
  const elements = geometriesIndex.get(xValue.value);

  // if no element, hide everything
  if (!elements || elements.length === 0) {
    return;
  }

  // build the tooltip value list
  let xValueInfo: TooltipValue | null = null;
  const highlightedGeometries: IndexedGeometry[] = [];
  const tooltipData = elements.reduce<TooltipValue[]>((acc, indexedGeometry) => {
    const {
      geometryId: { specId },
    } = indexedGeometry;
    const spec = seriesSpecs.get(specId);

    // safe guard check
    if (!spec) {
      return acc;
    }
    const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);

    // yScales is ensured by the enclosing if
    const yScale = yScales!.get(spec.groupId);
    if (!yScale) {
      return acc;
    }

    // check if the pointer is on the geometry
    let isHighlighted = false;
    if (isActiveChart && isPointOnGeometry(axisCursorPosition.x, axisCursorPosition.y, indexedGeometry)) {
      isHighlighted = true;
      highlightedGeometries.push(indexedGeometry);
    }

    // if it's a follow tooltip, and no element is highlighted
    // not add that element into the tooltip list
    if (!isHighlighted && isFollowTooltipType(tooltipType)) {
      return acc;
    }
    // format the tooltip values
    const yAxisFormatSpec = [0, 180].includes(chartRotation) ? yAxis : xAxis;
    const formattedTooltip = formatTooltip(indexedGeometry, spec, false, isHighlighted, yAxisFormatSpec);
    // format only one time the x value
    if (!xValueInfo) {
      // if we have a tooltipHeaderFormatter, then don't pass in the xAxis as the user will define a formatter
      const xAxisFormatSpec = [0, 180].includes(chartRotation) ? xAxis : yAxis;
      const formatterAxis = tooltipHeaderFormatter ? undefined : xAxisFormatSpec;
      xValueInfo = formatTooltip(indexedGeometry, spec, true, false, formatterAxis);
      return [xValueInfo, ...acc, formattedTooltip];
    }

    return [...acc, formattedTooltip];
  }, []);
  return {
    tooltipData,
    highlightedGeometries,
  };
}
