/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardContainerInput } from '../../../dashboard/public';

export type DashboardContainerExplicitInput = Partial<
  Pick<DashboardContainerInput, 'filters' | 'timeRange' | 'query'>
>;
