/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAssistantClient } from '../../services/index';
import { DATA2SUMMARY_AGENT_CONFIG_ID } from './constant';

export async function getIsSummaryAgent(dataSourceID: string) {
  const assistantClient = getAssistantClient();
  const res = await assistantClient.agentConfigExists(DATA2SUMMARY_AGENT_CONFIG_ID, {
    dataSourceId: dataSourceID,
  });
  return res.exists;
}
