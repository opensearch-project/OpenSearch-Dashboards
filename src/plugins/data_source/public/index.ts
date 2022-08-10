/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourcePlugin } from './plugin';

export function plugin() {
  return new DataSourcePlugin();
}

export { DataSourceStart } from './plugin';
