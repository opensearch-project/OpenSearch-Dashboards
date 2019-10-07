import { TooltipValue, isFollowTooltipType, TooltipType, TooltipValueFormatter } from '../utils/interactions';
import { IndexedGeometry, isPointOnGeometry, AccessorType } from '../rendering/rendering';
import { getColorValuesAsString } from '../utils/series';
import { AxisSpec, BasicSeriesSpec, Rotation, isAreaSeriesSpec, isBandedSpec, isBarSeriesSpec } from '../utils/specs';
import { SpecId, AxisId, GroupId } from '../../../utils/ids';
import { getAxesSpecForSpecId } from '../store/utils';
import { Scale } from '../../../utils/scales/scales';
import { Point } from '../store/chart_state';
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
    displayName = name || `${spec.id}`;
  }

  if (isBandedSpec(spec.y0Accessors) && (isAreaSeriesSpec(spec) || isBarSeriesSpec(spec))) {
    const { y0AccessorFormat = Y0_ACCESSOR_POSTFIX, y1AccessorFormat = Y1_ACCESSOR_POSTFIX } = spec;
    const formatter = accessor === AccessorType.Y0 ? y0AccessorFormat : y1AccessorFormat;
    displayName = getAccessorFormatLabel(formatter, displayName);
  }

  const value = isXValue ? x : y;
  return {
    seriesKey: seriesKeyAsString,
    name: displayName,
    value: axisSpec ? axisSpec.tickFormat(value) : emptyFormatter(value),
    color,
    isHighlighted: isXValue ? false : isHighlighted,
    isXValue,
    yAccessor: accessor,
  };
}

export function emptyFormatter<T>(value: T): T {
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
  const tooltipData = elements
    .filter(({ value: { y } }) => y !== null)
    .reduce<TooltipValue[]>((acc, indexedGeometry) => {
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
