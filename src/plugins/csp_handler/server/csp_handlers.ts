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
const CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY = 'csp.rules.frame-ancestors';

// add new directives to this Map when onboarding.
const SUPPORTED_DIRECTIVES = new Map([
  [
    CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY,
    {
      directiveName: FRAME_ANCESTORS_DIRECTIVE,
      defaultValue: ["'self'"],
    },
  ],
]);

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

      await updateDirectivesFromConfigurationClient(parsedCspHeader, client, request, logger);

      return updateNext(parsedCspHeader, toolkit);
    } catch (e) {
      logger.error(`Failure happened in CSP rules pre response handler due to ${e}`);

      updateDirectivesFromDefault(parsedCspHeader);
      return updateNext(parsedCspHeader, toolkit);
    }
  };
}

async function updateDirectivesFromConfigurationClient(
  parsedCspHeader: Map<string, string[]>,
  client: ConfigurationClient,
  request: OpenSearchDashboardsRequest,
  logger: Logger
) {
  for (const [configKey, directive] of SUPPORTED_DIRECTIVES) {
    try {
      const value = await client.getEntityConfig(configKey, {
        headers: request.headers,
      });

      if (!value || !value.trim()) {
        return addDirectiveWhenMissing(parsedCspHeader, directive);
      }

      parsedCspHeader.set(directive.directiveName, value.trim().split(' '));
    } catch (e) {
      logger.error(
        `Failure happened when handling CSP directive ${directive.directiveName} due to ${e}`
      );

      addDirectiveWhenMissing(parsedCspHeader, directive);
    }
  }
}

function updateDirectivesFromDefault(parsedCspHeader: Map<string, string[]>) {
  SUPPORTED_DIRECTIVES.forEach(async (directive) => {
    addDirectiveWhenMissing(parsedCspHeader, directive);
  });
}

function addDirectiveWhenMissing(parsedCspHeader: Map<string, string[]>, directive) {
  if (parsedCspHeader.has(directive.directiveName)) {
    return;
  }

  parsedCspHeader.set(directive.directiveName, directive.defaultValue);
}

function updateNext(parsedCspHeader: Map<string, string[]>, toolkit: OnPreResponseToolkit) {
  const additionalHeaders = {
    'content-security-policy': stringifyCspHeader(parsedCspHeader),
  };

  return toolkit.next({ headers: additionalHeaders });
}
