/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
export { useGenerateQuery } from './query_assist/hooks/use_generate';
import './index.scss';
import { QueryEnhancementsPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new QueryEnhancementsPlugin(initializerContext);
}

export { QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart } from './types';
