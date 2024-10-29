/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { API } from '../../../common/constants';

export async function checkAgentsExist(
  http: HttpSetup,
  agentConfigName: string | string[],
  dataSourceId: string
) {
  try {
    const queryParams = new URLSearchParams();
    if (Array.isArray(agentConfigName)) {
      agentConfigName.forEach((name) => queryParams.append('agentConfigName', name));
    } else {
      queryParams.append('agentConfigName', agentConfigName);
    }
    queryParams.append('dataSourceId', dataSourceId);

    const response = await http.get(API.AGENT_API.CONFIG_EXISTS, {
      query: Object.fromEntries(queryParams),
    });
    return response;
  } catch (error) {
    throw error;
  }
}
