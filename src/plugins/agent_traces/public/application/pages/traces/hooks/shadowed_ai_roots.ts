/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../../../data/common';
import {
  AI_ROOT_FIELD_PPL,
  GENAI_ROOT_CONDITION,
  PPLRunner,
  hasAiRootField,
} from '../../../utils/ai_root';
import { pplResponseToRecords } from '../../sessions/session_utils';
import { escapePPLValue } from '../trace_details/data_fetching/ppl_request_helpers';

/** Traces looked up for shadowed AI roots; beyond this the metrics may count a few twice. */
export const SHADOWED_TRACES_LIMIT = 1000;

const traceIds = (response: unknown): string[] =>
  pplResponseToRecords(response)
    .map((r) => r.traceId)
    .filter((id): id is string => typeof id === 'string');

/**
 * PPL condition that drops marked spans whose trace also has a GenAI root, as
 * `dropShadowedAiRoots` does for table rows, so the metrics count each AI root once. Empty when
 * the marker is not mapped or no such trace is in the time range.
 */
export const shadowedAiRootsExclusion = async (
  ppl: PPLRunner,
  dataset: Dataset,
  sourceCommand: string
): Promise<string> => {
  if (!hasAiRootField(dataset.id)) return '';
  try {
    const marked = traceIds(
      await ppl.executeQuery(
        dataset,
        `${sourceCommand} | where ${AI_ROOT_FIELD_PPL} = true and parentSpanId != "" | stats count() by traceId | head ${SHADOWED_TRACES_LIMIT}`
      )
    );
    if (marked.length === 0) return '';
    const shadowed = traceIds(
      await ppl.executeQuery(
        dataset,
        `${sourceCommand} | where ${GENAI_ROOT_CONDITION} and traceId in (${marked
          .map(escapePPLValue)
          .join(', ')}) | stats count() by traceId`
      )
    );
    if (shadowed.length === 0) return '';
    return ` AND NOT (parentSpanId != "" AND traceId in (${shadowed
      .map(escapePPLValue)
      .join(', ')}))`;
  } catch {
    return '';
  }
};
