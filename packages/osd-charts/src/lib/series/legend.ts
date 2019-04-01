import { findDataSeriesByColorValues } from '../../state/utils';
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
  deselectedDataSeries?: DataSeriesColorsValues[] | null,
): Map<string, LegendItem> {
  const legendItems: Map<string, LegendItem> = new Map();
  seriesColor.forEach((series, key) => {
    const spec = specs.get(series.specId);

    const color = seriesColorMap.get(key) || defaultColor;
    const hasSingleSeries = seriesColor.size === 1;
    const label = getSeriesColorLabel(series.colorValues, hasSingleSeries, spec);
    const isVisible = deselectedDataSeries
      ? findDataSeriesByColorValues(deselectedDataSeries, series) < 0
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
  colorValues: any[],
  hasSingleSeries: boolean,
  spec?: BasicSeriesSpec,
): string | undefined {
  let label = '';

  if (hasSingleSeries || colorValues.length === 0 || !colorValues[0]) {
    if (!spec) {
      return;
    }
    label = spec.name || `${spec.id}`;
  } else {
    label = colorValues.join(' - ');
  }

  return label;
}
