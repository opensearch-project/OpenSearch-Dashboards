import { SpecList } from './chart_state';
import { Spec } from '../specs';
import { ChartTypes } from '../chart_types';

export function getSpecsFromStore<U extends Spec>(specs: SpecList, chartType: ChartTypes, specType?: string): U[] {
  return Object.keys(specs)
    .filter((specId) => {
      const currentSpec = specs[specId];
      if (specType) {
        return currentSpec.specType === specType && currentSpec.chartType === chartType;
      } else {
        return currentSpec.chartType === chartType;
      }
    })
    .map((specId) => {
      return specs[specId] as U;
    });
}
