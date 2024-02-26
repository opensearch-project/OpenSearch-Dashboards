/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ViewProps } from '../../../../../data_explorer/public';
import {
  addColumn,
  removeColumn,
  reorderColumn,
  setColumns,
  useDispatch,
  useSelector,
} from '../../utils/state_management';
import { DiscoverSidebar } from '../../components/sidebar';
import { useDiscoverContext } from '../context';
import { ResultStatus, SearchData } from '../utils/use_search';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { popularizeField } from '../../helpers/popularize_field';
import { buildColumns } from '../../utils/columns';

// eslint-disable-next-line import/no-default-export
export default function DiscoverPanel(props: ViewProps) {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager },
    },
    capabilities,
    indexPatterns,
  } = services;
  const { data$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>(data$.getValue());

  const { columns } = useSelector((state) => ({
    columns: state.discover.columns,
  }));

  const prevColumns = useRef(columns);
  const dispatch = useDispatch();
  useEffect(() => {
    const timeFieldname = indexPattern?.timeFieldName;

    if (columns !== prevColumns.current) {
      let updatedColumns = buildColumns(columns);
      if (
        timeFieldname &&
        !prevColumns.current.includes(timeFieldname) &&
        columns.includes(timeFieldname)
      ) {
        // Remove timeFieldname from columns if previously chosen columns does not include time field
        updatedColumns = columns.filter((column) => column !== timeFieldname);
      }
      // Update the ref with the new columns
      dispatch(setColumns({ columns: updatedColumns }));
      prevColumns.current = columns;
    }
  }, [columns, dispatch, indexPattern?.timeFieldName]);

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
        if (indexPattern && capabilities.discover?.save) {
          popularizeField(indexPattern, fieldName, indexPatterns);
        }

        dispatch(
          addColumn({
            column: fieldName,
            index,
          })
        );
      }}
      onRemoveField={(fieldName) => {
        if (indexPattern && capabilities.discover?.save) {
          popularizeField(indexPattern, fieldName, indexPatterns);
        }

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
