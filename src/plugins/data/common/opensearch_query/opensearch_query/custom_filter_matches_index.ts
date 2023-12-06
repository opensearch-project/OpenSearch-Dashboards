/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IIndexPattern } from '../../index_patterns';
import { Filter } from '../filters';

export function customFilterMatchesIndex(filter: Filter, indexPattern?: IIndexPattern | null) {
  if (!filter.meta?.key || !indexPattern) {
    return true;
  }
  if (filter.meta?.type !== 'custom') {
    return false;
  }
  return filter.meta.index === indexPattern.id;
}
