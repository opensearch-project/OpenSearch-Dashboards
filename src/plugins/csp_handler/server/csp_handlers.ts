/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigurationClient } from '../../application_config/server';
import {
  CoreSetup,
  IScopedClusterClient,
  Logger,
  OnPreResponseHandler,
  OnPreResponseInfo,
  OnPreResponseToolkit,
  OpenSearchDashboardsRequest,
} from '../../../core/server';

const CSP_RULES_CONFIG_KEY = 'csp.rules';

/**
 * This function creates a pre-response handler to dynamically set the CSP rules.
 * It give precedence to the rules from application config plugin over those from YML.
 * In case no value from application config, it will ensure a default frame-ancestors is set.
 *
 * @param core Context passed to the plugins `setup` method
 * @param cspHeader The CSP header from YML
 * @param getConfigurationClient The function provided by application config plugin to retrieve configurations
 * @param logger The logger
 * @returns The pre-response handler
 */
export function createCspRulesPreResponseHandler(
  core: CoreSetup,
  cspHeader: string,
  getConfigurationClient: (scopedClusterClient: IScopedClusterClient) => ConfigurationClient,
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

      const client = getConfigurationClient(coreStart.opensearch.client.asScoped(request));

      const cspRules = await client.getEntityConfig(CSP_RULES_CONFIG_KEY, {
        headers: request.headers,
      });

      if (!cspRules) {
        return appendFrameAncestorsWhenMissing(cspHeader, toolkit);
      }

      const additionalHeaders = {
        'content-security-policy': cspRules,
      };

      return toolkit.next({ headers: additionalHeaders });
    } catch (e) {
      logger.error(`Failure happened in CSP rules pre response handler due to ${e}`);
      return appendFrameAncestorsWhenMissing(cspHeader, toolkit);
    }
  };
}

/**
 * Append frame-ancestors with default value 'self' when it is missing.
 */
function appendFrameAncestorsWhenMissing(cspHeader: string, toolkit: OnPreResponseToolkit) {
  if (cspHeader.includes('frame-ancestors')) {
    return toolkit.next({});
  }

  const additionalHeaders = {
    'content-security-policy': "frame-ancestors 'self'; " + cspHeader,
  };

  return toolkit.next({ headers: additionalHeaders });
}
