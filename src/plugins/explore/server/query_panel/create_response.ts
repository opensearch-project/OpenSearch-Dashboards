/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentResponse } from './assist_routes';

const createPPLResponseBody = (agentResponse: AgentResponse) => {
  if (!agentResponse.body.inference_results[0].output[0].result)
    throw new Error('Generated query not found.');
  const result = JSON.parse(agentResponse.body.inference_results[0].output[0].result!) as {
    ppl: string;
  };
  const ppl = result.ppl
    .replace(/[\r\n]/g, ' ')
    .trim()
    .replace(/ISNOTNULL/g, 'isnotnull') // https://github.com/opensearch-project/sql/issues/2431
    .replace(/\bSPAN\(/g, 'span('); // https://github.com/opensearch-project/dashboards-observability/issues/759
  return { query: ppl };
};

export const createResponseBody = (language: string, agentResponse: AgentResponse) => {
  switch (language) {
    case 'PPL':
      return createPPLResponseBody(agentResponse);

    default:
      if (!agentResponse.body.inference_results[0].output[0].result)
        throw new Error('Generated query not found.');
      const result = JSON.parse(
        agentResponse.body.inference_results[0].output[0].result!
      ) as Record<string, string>;
      const query = Object.values(result).at(0);
      if (typeof query !== 'string') throw new Error('Generated query not found.');
      return { query };
  }
};
