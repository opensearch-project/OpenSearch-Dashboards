import { ChartTypes } from '../chart_types';

export interface Spec {
  /** unique Spec identifier */
  id: string;
  /** Chart type define the type of chart that use this spec */
  chartType: ChartTypes;
  /** The type of spec, can be series, axis, annotation, settings etc*/
  specType: string;
}
export * from './settings';

export * from '../chart_types/specs';
