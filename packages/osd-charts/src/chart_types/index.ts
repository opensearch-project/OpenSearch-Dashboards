import { $Values } from 'utility-types';

export const ChartTypes = Object.freeze({
  Global: 'global' as 'global',
  Partition: 'partition' as 'partition',
  XYAxis: 'xy_axis' as 'xy_axis',
});

export type ChartTypes = $Values<typeof ChartTypes>;
