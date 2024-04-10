/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MultipleDataSourceExamplesPlugin } from './plugin';

export function plugin() {
  return new MultipleDataSourceExamplesPlugin();
}

export {
  MultipleDataSourceExamplesPluginSetup,
  MultipleDataSourceExamplesPluginStart,
} from './types';
