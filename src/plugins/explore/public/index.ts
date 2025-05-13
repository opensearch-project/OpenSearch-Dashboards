/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { ExplorePlugin } from './plugin';

export function plugin() {
  return new ExplorePlugin();
}
export { ExplorePluginSetup, ExplorePluginStart } from './types';
