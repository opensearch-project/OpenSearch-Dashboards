import { getAxesSpecForSpecId, LastValues } from '../store/utils';
import { identity } from '../../../utils/commons';
import { AxisId, SpecId } from '../../../utils/ids';
import {
  DataSeriesColorsValues,
  findDataSeriesByColorValues,
  getSortedDataSeriesColorsValuesMap,
} from '../utils/series';
import { AxisSpec, BasicSeriesSpec, Postfixes, isAreaSeriesSpec, isBarSeriesSpec } from '../utils/specs';
import { Y0_ACCESSOR_POSTFIX, Y1_ACCESSOR_POSTFIX } from '../tooltip/tooltip';

export interface FormatedLastValues {
  y0: number | string | null;
  y1: number | string | null;
}

export type LegendItem = Postfixes & {
  key: string;
  color: string;
  label: string;
  value: DataSeriesColorsValues;
  isSeriesVisible?: boolean;
  banded?: boolean;
  isLegendItemVisible?: boolean;
  displayValue: {
    raw: LastValues;
    formatted: FormatedLastValues;
  };
};

export function getPostfix(spec: BasicSeriesSpec): Postfixes {
  if (isAreaSeriesSpec(spec) || isBarSeriesSpec(spec)) {
    const { y0AccessorFormat = Y0_ACCESSOR_POSTFIX, y1AccessorFormat = Y1_ACCESSOR_POSTFIX } = spec;
    return {
      y0AccessorFormat,
      y1AccessorFormat,
    };
  }

  return {};
}

export function computeLegend(
  seriesColor: Map<string, DataSeriesColorsValues>,
  seriesColorMap: Map<string, string>,
  specs: Map<SpecId, BasicSeriesSpec>,
  defaultColor: string,
  axesSpecs: Map<AxisId, AxisSpec>,
  deselectedDataSeries?: DataSeriesColorsValues[] | null,
): Map<string, LegendItem> {
  const legendItems: Map<string, LegendItem> = new Map();
  const sortedSeriesColors = getSortedDataSeriesColorsValuesMap(seriesColor);

  sortedSeriesColors.forEach((series, key) => {
    const { banded, specId, lastValue, colorValues } = series;
    const spec = specs.get(specId);
    const color = seriesColorMap.get(key) || defaultColor;
    const hasSingleSeries = seriesColor.size === 1;
    const label = getSeriesColorLabel(colorValues, hasSingleSeries, spec);
    const isSeriesVisible = deselectedDataSeries ? findDataSeriesByColorValues(deselectedDataSeries, series) < 0 : true;

    if (!label || !spec) {
      return;
    }

    // Use this to get axis spec w/ tick formatter
    const { yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);
    const formatter = yAxis ? yAxis.tickFormat : identity;
    const { hideInLegend } = spec;

    const legendItem: LegendItem = {
      key,
      color,
      label,
      banded,
      value: series,
      isSeriesVisible,
      isLegendItemVisible: !hideInLegend,
      displayValue: {
        raw: {
          y0: lastValue && lastValue.y0 !== null ? lastValue.y0 : null,
          y1: lastValue && lastValue.y1 !== null ? lastValue.y1 : null,
        },
        formatted: {
          y0: isSeriesVisible && lastValue && lastValue.y0 !== null ? formatter(lastValue.y0) : null,
          y1: isSeriesVisible && lastValue && lastValue.y1 !== null ? formatter(lastValue.y1) : null,
        },
      },
      ...getPostfix(spec),
    };

    legendItems.set(key, legendItem);
  });
  return legendItems;
}

export function getSeriesColorLabel(
  colorValues: any[],
  hasSingleSeries: boolean,
  spec?: BasicSeriesSpec,
): string | undefined {
  let label = '';
  if (hasSingleSeries || colorValues.length === 0 || colorValues[0] == null) {
    if (!spec) {
      return;
    }
    label = spec.name || `${spec.id}`;
  } else {
    label = colorValues.join(' - ');
  }

  return label;
}
