/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { API } from '../../../common/constants';

export async function checkAgentsExist(
  http: HttpSetup,
  agentConfigName: string | string[],
  dataSourceId?: string
) {
  const response = await http.get(API.AGENT_API.CONFIG_EXISTS, {
    query: { agentConfigName, dataSourceId },
  });
  return response;
}
