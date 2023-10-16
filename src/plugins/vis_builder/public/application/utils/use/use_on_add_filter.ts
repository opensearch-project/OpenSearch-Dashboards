/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderViewServices } from '../../../types';
import { useVisBuilderContext } from '../../view_components/context';

export const useOnAddFilter = () => {
  const {
    services: {
      data: {
        query: { filterManager },
      },
    },
  } = useOpenSearchDashboards<VisBuilderViewServices>();
  const { indexPattern } = useVisBuilderContext();
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
