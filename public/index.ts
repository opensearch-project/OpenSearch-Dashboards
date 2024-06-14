/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { QueryEnhancementsPlugin } from './plugin';

export function plugin() {
  return new QueryEnhancementsPlugin();
}

export { QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart } from './types';
