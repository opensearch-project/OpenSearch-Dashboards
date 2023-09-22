/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { History } from 'history';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { useDiscoverContext } from '../context';
import {
  addColumn,
  removeColumn,
  setColumns,
  setSort,
  useDispatch,
  useSelector,
} from '../../utils/state_management';
import { ResultStatus, SearchData } from '../utils/use_search';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { SortOrder } from '../../../saved_searches/types';
import { DOC_HIDE_TIME_COLUMN_SETTING } from '../../../../common';

interface Props {
  history: History;
}

export const DiscoverTable = ({ history }: Props) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    uiSettings,
    data: {
      query: { filterManager },
    },
  } = services;
  const { data$, refetch$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    rows: [],
  });

  const { columns, sort } = useSelector((state) => state.discover);
  const dispatch = useDispatch();
  const onAddColumn = (col: string) => dispatch(addColumn({ column: col }));
  const onRemoveColumn = (col: string) => dispatch(removeColumn(col));
  const onSetColumns = (cols: string[]) => dispatch(setColumns({ columns: cols }));
  const onSetSort = (s: SortOrder[]) => {
    dispatch(setSort(s));
    refetch$.next();
  };
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
  const displayTimeColumn = useMemo(
    () => !!(!uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false) && indexPattern?.isTimeBased()),
    [indexPattern, uiSettings]
  );

  const { rows } = fetchState || {};

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      if (next.status === ResultStatus.LOADING) return;
      if (next.status !== fetchState.status || (next.rows && next.rows !== fetchState.rows)) {
        setFetchState({ ...fetchState, ...next });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  if (indexPattern === undefined) {
    // TODO: handle better
    return null;
  }

  if (!rows || rows.length === 0) {
    // TODO: handle better
    return <div>{'loading...'}</div>;
  }

  return (
    <DataGridTable
      columns={columns}
      indexPattern={indexPattern}
      onAddColumn={onAddColumn}
      onFilter={onAddFilter as DocViewFilterFn}
      onRemoveColumn={onRemoveColumn}
      onSetColumns={onSetColumns}
      onSort={onSetSort}
      sort={sort}
      rows={rows}
      displayTimeColumn={displayTimeColumn}
      services={services}
    />
  );
};
