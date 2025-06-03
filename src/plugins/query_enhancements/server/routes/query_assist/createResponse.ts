/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryAssistResponse } from '../../../common/query_assist';
import { AgentResponse } from './agents';
import { createPPLResponseBody } from './ppl/create_response';

export const createResponseBody = (
  language: string,
  agentResponse: AgentResponse
): QueryAssistResponse => {
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
