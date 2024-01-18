/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  IScopedClusterClient,
  Logger,
  OnPreResponseHandler,
} from '../../../core/server';
import { ConfigurationClient } from './types';

export function createCspRulesPreResponseHandler(
  core: CoreSetup,
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient,
  logger: Logger
): OnPreResponseHandler {
  return async (request, response, toolkit) => {
    try {
      const shouldCheckDest = ['document', 'frame', 'iframe', 'embed', 'object'];

      const currentDest = request.headers['sec-fetch-dest'];

      if (!shouldCheckDest.includes(currentDest)) {
        return toolkit.next({});
      }

      const [coreStart] = await core.getStartServices();

      const myClient = getConfigurationClient(coreStart.opensearch.client.asScoped(request));

      const existsValue = await myClient.existsCspRules();

      if (!existsValue) {
        return toolkit.next({});
      }

      const cspRules = await myClient.getCspRules();

      if (!cspRules) {
        return toolkit.next({});
      }

      const additionalHeaders = {
        'content-security-policy': cspRules,
      };

      return toolkit.next({ headers: additionalHeaders });
    } catch (e) {
      logger.error(`Failure happened in CSP rules pre response handler due to ${e}`);
      return toolkit.next({});
    }
  };
}
