import { SpecList } from './chart_state';
import { Spec } from '../specs';
import { ChartTypes } from '../chart_types';

export function getSpecsFromStore<U extends Spec>(specs: SpecList, chartType: ChartTypes, specType?: string): U[] {
  return Object.keys(specs)
    .filter((specId) => {
      const currentSpec = specs[specId];
      const sameChartType = currentSpec.chartType === chartType;
      const sameSpecType = specType ? currentSpec.specType === specType : true;
      return sameChartType && sameSpecType;
    })
    .map((specId) => {
      return specs[specId] as U;
    });
}
