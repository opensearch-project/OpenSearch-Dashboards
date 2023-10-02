/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ViewProps } from '../../../../../data_explorer/public';
import {
  addColumn,
  removeColumn,
  reorderColumn,
  useDispatch,
  useSelector,
} from '../../utils/state_management';
import { DiscoverSidebar } from '../../components/sidebar';
import { useDiscoverContext } from '../context';
import { ResultStatus, SearchData } from '../utils/use_search';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';

// eslint-disable-next-line import/no-default-export
export default function DiscoverPanel(props: ViewProps) {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager },
    },
  } = services;
  const { data$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>(data$.getValue());

  const { columns } = useSelector((state) => ({
    columns: state.discover.columns,
  }));
  const dispatch = useDispatch();

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      if (next.status === ResultStatus.LOADING) return;
      setFetchState(next);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  const onAddFilter = useCallback(
    (field: string | IndexPatternField, values: string, operation: '+' | '-') => {
      if (!indexPattern) return;

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id ?? ''
      );
      return filterManager.addFilters(newFilters);
    },
    [filterManager, indexPattern]
  );

  return (
    <DiscoverSidebar
      columns={columns || []}
      fieldCounts={fetchState.fieldCounts || {}}
      hits={fetchState.rows || []}
      onAddField={(fieldName, index) => {
        dispatch(
          addColumn({
            column: fieldName,
            index,
          })
        );
      }}
      onRemoveField={(fieldName) => {
        dispatch(removeColumn(fieldName));
      }}
      onReorderFields={(source, destination) => {
        dispatch(
          reorderColumn({
            source,
            destination,
          })
        );
      }}
      selectedIndexPattern={indexPattern}
      onAddFilter={onAddFilter}
    />
  );
}
