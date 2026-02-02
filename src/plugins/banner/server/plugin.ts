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
import { defineRoutes } from './routes/get_config';
import { BannerConfig } from '../common';
import { getDefaultBannerSettings } from './ui_settings';

export class BannerPlugin implements Plugin<BannerPluginSetup, BannerPluginStart> {
  private readonly config$: Observable<BannerPluginConfigType>;
  private pluginConfig!: BannerPluginConfigType;

  constructor(private initializerContext: PluginInitializerContext) {
    this.config$ = this.initializerContext.config.create<BannerPluginConfigType>();
  }

  public async setup(core: CoreSetup<BannerPluginStart>) {
    this.pluginConfig = await this.config$.pipe(first()).toPromise();

    // Get the default UI settings
    const bannerSettings = getDefaultBannerSettings();

    // Override the default values with values from YAML config
    if (bannerSettings['banner:content']) {
      bannerSettings['banner:content'].value = this.pluginConfig.content;
    }
    if (bannerSettings['banner:color']) {
      bannerSettings['banner:color'].value = this.pluginConfig.color;
    }
    if (bannerSettings['banner:iconType']) {
      bannerSettings['banner:iconType'].value = this.pluginConfig.iconType;
    }
    if (bannerSettings['banner:active']) {
      bannerSettings['banner:active'].value = this.pluginConfig.isVisible;
    }
    if (bannerSettings['banner:useMarkdown']) {
      bannerSettings['banner:useMarkdown'].value = this.pluginConfig.useMarkdown;
    }

    // Register UI settings with updated default values
    core.uiSettings.register(bannerSettings);

    const bannerSetup = {
      bannerEnabled: () => this.pluginConfig.enabled,
      getConfig: (): BannerConfig => ({
        ...this.pluginConfig,
      }),
    };

    // Register server routes
    const router = core.http.createRouter();
    defineRoutes(router, bannerSetup);

    return bannerSetup;
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
