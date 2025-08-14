/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { BannerPluginSetup, BannerPluginStart } from './types';
import { GlobalBanner } from './components/global_banner';

export class BannerPlugin implements Plugin<BannerPluginSetup, BannerPluginStart> {
  constructor() {}

  public setup(core: CoreSetup): BannerPluginSetup {
    return {};
  }

  public async start(core: CoreStart): Promise<BannerPluginStart> {
    // Set the global banner in the chrome service
    core.chrome.setGlobalBanner({
      component: React.createElement(GlobalBanner, { http: core.http }),
    });

    return {};
  }

  public stop() {}
}
