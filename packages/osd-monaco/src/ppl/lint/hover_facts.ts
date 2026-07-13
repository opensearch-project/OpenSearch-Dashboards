/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Per-instance facts a detector extracts about a finding, surfaced in the hover card. */
export interface HoverFacts {
  field?: string;
  esType?: string;
  root?: string;
  literal?: string;
  aggName?: string;
  suggestion?: string;
  pattern?: string;
  candidateIndices?: string[];
  totalIndices?: number;
}
