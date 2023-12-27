/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, OnPreResponseHandler, OpenSearchClient } from '../../../core/server';
import { CspClient } from './types';

const OPENSEARCH_DASHBOARDS_CONFIG_INDEX_NAME = '.opensearch_dashboards_config';
const OPENSEARCH_DASHBOARDS_CONFIG_DOCUMENT_NAME = 'csp.rules';

export function createCspRulesPreResponseHandler(
  core: CoreSetup,
  getCspClient: (inputOpenSearchClient: OpenSearchClient) => CspClient
): OnPreResponseHandler {
  return async (request, response, toolkit) => {
    const shouldCheckDest = ['document', 'frame', 'iframe', 'embed', 'object'];

    const currentDest = request.headers['sec-fetch-dest'];

    if (!shouldCheckDest.includes(currentDest)) {
      return toolkit.next({});
    }

    const [coreStart] = await core.getStartServices();

    const myClient = getCspClient(coreStart.opensearch.client.asInternalUser);

    const existsData = await myClient.exists(OPENSEARCH_DASHBOARDS_CONFIG_INDEX_NAME);

    let header;
    const defaultHeader = core.http.csp.header;

    if (!existsData) {
      header = defaultHeader;
    } else {
      const data = await myClient.get(
        OPENSEARCH_DASHBOARDS_CONFIG_INDEX_NAME,
        OPENSEARCH_DASHBOARDS_CONFIG_DOCUMENT_NAME
      );
      header = data || defaultHeader;
    }

    const additionalHeaders = {
      ['content-security-policy']: header,
    };

    return toolkit.next({ headers: additionalHeaders });
  };
}
