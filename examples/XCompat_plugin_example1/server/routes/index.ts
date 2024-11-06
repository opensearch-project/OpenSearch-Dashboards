/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../src/core/server';
import { ExamplePlugin1Plugin } from '../plugin';

export function defineRoutes(router: IRouter, pluginInstance: ExamplePlugin1Plugin) {
  router.get(
    {
      path: '/api/example_plugin_1/verify_crosscompatability',
      validate: false,
    },
    async (context, request, response) => {
      const { message, status } = await pluginInstance.exampleCompatibilityCheck();
      return response.ok({
        body: {
          time: new Date().toISOString(),
          message,
          status,
        },
      });
    }
  );
}
