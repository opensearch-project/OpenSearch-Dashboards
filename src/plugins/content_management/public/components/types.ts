import { DashboardContainerInput } from '../../../dashboard/public';

export type DashboardContainerExplicitInput = Partial<
  Pick<DashboardContainerInput, 'filters' | 'timeRange' | 'query'>
>;
