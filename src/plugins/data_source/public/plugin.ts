/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataSourcePublicPluginSetup, DataSourcePublicPluginStart } from './types';

export class DataSourcePublicPlugin
  implements Plugin<DataSourcePublicPluginSetup, DataSourcePublicPluginStart> {
  public setup(core: CoreSetup): DataSourcePublicPluginSetup {
    return {};
  }

  public start(core: CoreStart): DataSourcePublicPluginStart {
    return {};
  }

  public stop() {}
}
