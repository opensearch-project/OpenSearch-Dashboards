/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../common';

export interface QuerySnippetItem {
  id: string;
  query: Query;
  title?: string;
  description?: string;
  timestamp?: number;
  source: 'Saved Query' | 'Recent Query' | 'Saved Search';
}
