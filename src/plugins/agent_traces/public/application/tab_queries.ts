/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TabDefinition } from '../services/tab_registry/tab_registry_service';
import { defaultPrepareQueryString } from './utils/state_management/actions/query_actions';
import { buildPplSortClause, splitPplWhereAndTail } from './pages/traces/table_shared';
import { aiRootCondition } from './utils/ai_root';

type PrepareQuery = NonNullable<TabDefinition['prepareQuery']>;

/**
 * AI root spans: a GenAI trace root, or the outermost GenAI span marked under a non-GenAI root
 * (an agent behind an HTTP handler). Shared by Traces and Sessions so they share a cache key.
 */
export const prepareRootSpansQuery: PrepareQuery = (query, sort) => {
  const baseQuery = defaultPrepareQueryString(query);
  const { whereQuery, tailCommands } = splitPplWhereAndTail(baseQuery);
  const sortClause = sort?.length ? ` ${buildPplSortClause(sort[0][0], sort[0][1])}` : '';
  return `${whereQuery} | where ${aiRootCondition(query.dataset?.id)} ${tailCommands}${sortClause}`;
};

/** All gen_ai spans (not just root spans). */
export const prepareAgentSpansQuery: PrepareQuery = (query, sort) => {
  const baseQuery = defaultPrepareQueryString(query);
  const { whereQuery, tailCommands } = splitPplWhereAndTail(baseQuery);
  const sortClause = sort?.length ? ` ${buildPplSortClause(sort[0][0], sort[0][1])}` : '';
  return `${whereQuery} | where isnotnull(\`attributes.gen_ai.operation.name\`) ${tailCommands}${sortClause}`;
};
