/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import './index.scss';

import { DataImporterPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataImporterPlugin(initializerContext);
}

export { DataImporterPluginSetup, DataImporterPluginStart } from './types';
