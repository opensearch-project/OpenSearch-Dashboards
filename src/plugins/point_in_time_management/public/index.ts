/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PointInTimeManagementPlugin } from './plugin';

export function plugin() {
  return new PointInTimeManagementPlugin();
}

export { PointInTimeManagementPluginSetup, PointInTimeManagementPluginStart } from './types';
