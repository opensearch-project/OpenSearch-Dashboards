import { findSelectedDataSeries } from '../../state/utils';
import { SpecId } from '../utils/ids';
import { DataSeriesColorsValues } from './series';
import { BasicSeriesSpec } from './specs';

export interface LegendItem {
  key: string;
  color: string;
  label: string;
  value: DataSeriesColorsValues;
  isVisible?: boolean;
}
export function computeLegend(
  seriesColor: Map<string, DataSeriesColorsValues>,
  seriesColorMap: Map<string, string>,
  specs: Map<SpecId, BasicSeriesSpec>,
  defaultColor: string,
  selectedDataSeries?: DataSeriesColorsValues[] | null,
): Map<string, LegendItem> {
  const legendItems: Map<string, LegendItem> = new Map();
  seriesColor.forEach((series, key) => {
    const spec = specs.get(series.specId);

    const color = seriesColorMap.get(key) || defaultColor;
    const hasSingleSeries = seriesColor.size === 1;
    const label = getSeriesColorLabel(series, hasSingleSeries, spec);
    const isVisible = selectedDataSeries
      ? findSelectedDataSeries(selectedDataSeries, series) > -1
      : true;

    if (!label) {
      return;
    }

    legendItems.set(key, {
      key,
      color,
      label,
      value: series,
      isVisible,
    });
  });
  return legendItems;
}

export function getSeriesColorLabel(
  series: DataSeriesColorsValues,
  hasSingleSeries: boolean,
  spec: BasicSeriesSpec | undefined,
): string | undefined {
  let label = '';

  if (hasSingleSeries || series.colorValues.length === 0 || !series.colorValues[0]) {
    if (!spec) {
      return;
    }
    label = `${spec.id}`;
  } else {
    label = series.colorValues.join(' - ');
  }

  return label;
}
