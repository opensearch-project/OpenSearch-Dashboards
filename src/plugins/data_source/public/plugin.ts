/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataSourcePluginSetup, DataSourcePluginStart } from './types';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  public setup(core: CoreSetup): DataSourcePluginSetup {
    return {};
  }

  public start(core: CoreStart): DataSourcePluginStart {
    return {};
  }

  public stop() {}
}
