/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { useIndexPatterns } from './use_index_pattern';

export const useOnAddFilter = () => {
  const {
    services: {
      data: {
        query: { filterManager },
      },
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const indexPattern = useIndexPatterns().selected;
  const { id = '' } = indexPattern ?? {};
  return useCallback(
    (fieldToFilter: IndexPatternField | string, value: string, operation: '+' | '-') => {
      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        fieldToFilter,
        value,
        operation,
        id
      );
      return filterManager.addFilters(newFilters);
    },
    [filterManager, id]
  );
};
