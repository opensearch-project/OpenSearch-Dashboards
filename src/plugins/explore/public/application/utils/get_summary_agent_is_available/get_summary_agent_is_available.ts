/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../types';

const AGENT_EXISTS_API = '/api/assistant/agent_config/_exists';

export const getSummaryAgentIsAvailable = async (
  services: ExploreServices,
  dataSourceId: string
) => {
  try {
    // TODO: OSD core should not rely on plugin APIs, refactor this once this RFC is
    // implemented #9859
    const res = await services.http.fetch<{ exists: boolean }>({
      method: 'GET',
      path: AGENT_EXISTS_API,
      query: {
        dataSourceId,
        agentConfigName: 'os_data2summary',
      },
    });
    return res.exists;
  } catch (error) {
    return false;
  }
};
