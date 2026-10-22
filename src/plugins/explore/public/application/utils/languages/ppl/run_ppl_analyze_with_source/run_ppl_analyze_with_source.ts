/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runPPLAnalyzeInBackground } from '../../../../../../../data/public';
import { addPPLSourceClause } from '../get_query_string_with_source';

type RunPPLAnalyzeParams = Parameters<typeof runPPLAnalyzeInBackground>[0];

/**
 * Runs PPL analyze with the same source clause and time filter as Run.
 *
 * The editor hides the `source = <dataset>` clause and the run path adds it back via
 * `addPPLSourceClause`. Analyze has to do the same, otherwise a query typed as
 * `| where ...` reaches the backend without a source and fails to parse. Doing it here
 * also lets `runPPLAnalyzeInBackground` recognise the query as a search query, so the
 * time filter gets injected.
 *
 * This is not an exact match: Run's results query also gets a default
 * `| sort - <time field>` appended (`PPLSearchInterceptor.appendDefaultSort`), which
 * analyze does not add.
 */
export const runPPLAnalyzeWithSource = (params: RunPPLAnalyzeParams) => {
  const { query } = params;
  // Without a dataset there is no source to add, and `addPPLSourceClause` would emit an
  // empty `source = ` clause.
  const shouldAddSource = query.language?.toLowerCase() === 'ppl' && !!query.dataset;

  runPPLAnalyzeInBackground({
    ...params,
    query: shouldAddSource ? addPPLSourceClause(query) : query,
  });
};
