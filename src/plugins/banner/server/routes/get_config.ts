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

export function defineRoutes(router: IRouter, bannerSetup: BannerPluginSetup) {
  router.get(
    {
      path: '/api/_plugins/_banner/content',
      validate: false,
    },
    async (context, request, response) => {
      const config = bannerSetup.getConfig();

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
