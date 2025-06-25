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

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { BannerPluginSetup, BannerPluginStart } from './types';
import { BannerPluginConfigType } from './config';
import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/server';

export class BannerPlugin implements Plugin<BannerPluginSetup, BannerPluginStart> {
  private readonly config$: Observable<BannerPluginConfigType>;

  constructor(private initializerContext: PluginInitializerContext) {
    this.config$ = this.initializerContext.config.create<BannerPluginConfigType>();
  }

  public async setup(core: CoreSetup<BannerPluginStart>) {
    const pluginConfig: BannerPluginConfigType = await this.config$.pipe(first()).toPromise();

    return {
      bannerEnabled: () => pluginConfig.enabled,
      getConfig: () => ({
        text: pluginConfig.text,
        color: pluginConfig.color,
        iconType: pluginConfig.iconType,
        isVisible: pluginConfig.isVisible,
        useMarkdown: pluginConfig.useMarkdown,
      }),
    };
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
