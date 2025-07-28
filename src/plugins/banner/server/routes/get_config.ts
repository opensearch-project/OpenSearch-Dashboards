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

import { IRouter } from '../../../../core/server';
import { BannerPluginSetup } from '../types';
import { BannerConfig } from '../../common';

export function defineRoutes(router: IRouter, bannerSetup: BannerPluginSetup) {
  router.get(
    {
      path: '/api/_plugins/_banner/content',
      validate: false,
    },
    async (context, request, response) => {
      // Get UI settings client
      const uiSettingsClient = context.core.uiSettings.client;

      const settings = await uiSettingsClient.getAll();

      // Extract banner settings from the result
      const content = settings['banner:content'];
      const color = settings['banner:color'];
      const iconType = settings['banner:iconType'];
      const isVisible = settings['banner:active'];
      const useMarkdown = settings['banner:useMarkdown'];
      const size = settings['banner:size'];

      // Combine UI settings with base config
      const config: BannerConfig = {
        content,
        color: color as BannerConfig['color'],
        iconType,
        isVisible: Boolean(isVisible),
        useMarkdown: Boolean(useMarkdown),
        size: size as BannerConfig['size'],
      };

      return response.ok({
        body: {
          content: config.content,
          color: config.color,
          iconType: config.iconType,
          isVisible: config.isVisible,
          useMarkdown: config.useMarkdown,
          size: config.size,
        },
      });
    }
  );
}
