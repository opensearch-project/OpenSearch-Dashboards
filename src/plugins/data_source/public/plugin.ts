/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataSourcePluginStart } from './types';

export class DataSourcePlugin implements Plugin<void, DataSourcePluginStart> {
  public setup(core: CoreSetup) {}

  public start(core: CoreStart): DataSourcePluginStart {
    return {};
  }

  public stop() {}
}
