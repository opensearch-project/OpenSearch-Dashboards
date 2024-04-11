/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigurationClient } from '../../application_config/server';
import {
  CoreSetup,
  Logger,
  OnPreResponseHandler,
  OnPreResponseInfo,
  OnPreResponseToolkit,
  OpenSearchDashboardsRequest,
} from '../../../core/server';
import { parseCspHeader, stringifyCspHeader } from './csp_header_utils';

const FRAME_ANCESTORS_DIRECTIVE = 'frame-ancestors';
const CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY = 'csp.rules.frame_ancestors';

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
  getConfigurationClient: (request?: OpenSearchDashboardsRequest) => ConfigurationClient,
  logger: Logger
): OnPreResponseHandler {
  return async (
    request: OpenSearchDashboardsRequest,
    response: OnPreResponseInfo,
    toolkit: OnPreResponseToolkit
  ) => {
    const parsedCspHeader = parseCspHeader(cspHeader);

    try {
      const shouldCheckDest = ['document', 'frame', 'iframe', 'embed', 'object'];

      const currentDest = request.headers['sec-fetch-dest'];

      if (!shouldCheckDest.includes(currentDest)) {
        return toolkit.next({});
      }

      const client = getConfigurationClient(request);

      const frameAncestors = await client.getEntityConfig(CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY, {
        headers: request.headers,
      });

      if (!frameAncestors || !frameAncestors.trim()) {
        return appendFrameAncestorsWhenMissing(parsedCspHeader, toolkit);
      }

      return updateNext(parsedCspHeader, frameAncestors.trim(), toolkit);
    } catch (e) {
      logger.error(`Failure happened in CSP rules pre response handler due to ${e}`);
      return appendFrameAncestorsWhenMissing(parsedCspHeader, toolkit);
    }
  };
}

function updateNext(
  parsedCspHeader: Map<string, string[]>,
  frameAncestors: string,
  toolkit: OnPreResponseToolkit
) {
  parsedCspHeader.set(FRAME_ANCESTORS_DIRECTIVE, frameAncestors.split(' '));

  const additionalHeaders = {
    'content-security-policy': stringifyCspHeader(parsedCspHeader),
  };

  return toolkit.next({ headers: additionalHeaders });
}

/**
 * Append frame-ancestors with default value 'self' when it is missing.
 */
function appendFrameAncestorsWhenMissing(
  parsedCspHeader: Map<string, string[]>,
  toolkit: OnPreResponseToolkit
) {
  if (parsedCspHeader.has(FRAME_ANCESTORS_DIRECTIVE)) {
    return toolkit.next({});
  }

  return updateNext(parsedCspHeader, "'self'", toolkit);
}
