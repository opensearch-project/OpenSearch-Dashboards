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

import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { BannerPluginSetup, BannerPluginStart } from './types';
import { BannerService } from './services/banner_service';
import { renderBanner, unmountBanner, setInitialBannerHeight } from './services/render_banner';

export class BannerPlugin implements Plugin<BannerPluginSetup, BannerPluginStart> {
  private readonly bannerService = new BannerService();

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup): BannerPluginSetup {
    // Get configuration from server
    const config = this.initializerContext.config.get() as any;

    // Setup banner with configuration values
    this.bannerService.setup({
      text: config.text,
      color: config.color,
      iconType: config.iconType,
      isVisible: config.isVisible,
      useMarkdown: config.useMarkdown,
    });

    return {};
  }

  public start(core: CoreStart): BannerPluginStart {
    const currentConfig = this.bannerService.getCurrentConfig();

    // Set initial height to prevent layout shifts
    setInitialBannerHeight(currentConfig.isVisible);

    // Render the banner component
    renderBanner(this.bannerService);

    return {
      bannerService: this.bannerService,
    };
  }

  public stop() {
    unmountBanner();
  }
}
