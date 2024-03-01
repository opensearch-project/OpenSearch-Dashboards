/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  IScopedClusterClient,
  Logger,
  OnPreResponseHandler,
  OnPreResponseInfo,
  OnPreResponseToolkit,
  OpenSearchDashboardsRequest,
} from '../../../core/server';
import { ConfigurationClient } from './types';

export function createCspRulesPreResponseHandler(
  core: CoreSetup,
  cspHeader: string,
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient,
  logger: Logger
): OnPreResponseHandler {
  return async (
    request: OpenSearchDashboardsRequest,
    response: OnPreResponseInfo,
    toolkit: OnPreResponseToolkit
  ) => {
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
        return updateFrameAncestors(cspHeader, toolkit);
      }

      const cspRules = await myClient.getCspRules();

      if (!cspRules) {
        return updateFrameAncestors(cspHeader, toolkit);
      }

      const additionalHeaders = {
        'content-security-policy': cspRules,
      };

      return toolkit.next({ headers: additionalHeaders });
    } catch (e) {
      logger.error(`Failure happened in CSP rules pre response handler due to ${e}`);
      return updateFrameAncestors(cspHeader, toolkit);
    }
  };
}

function updateFrameAncestors(cspHeader: string, toolkit: OnPreResponseToolkit) {
  if (cspHeader.includes('frame-ancestors')) {
    return toolkit.next({});
  }

  const additionalHeaders = {
    'content-security-policy': "frame-ancestors 'self'; " + cspHeader,
  };

  return toolkit.next({ headers: additionalHeaders });
}
