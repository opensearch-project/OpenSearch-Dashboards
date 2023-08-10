/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { History } from 'history';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { useDiscoverContext } from '../context';
import { addDiscoverColumn, removeDiscoverColumn, setDiscoverColumns, setDiscoverSort, useDispatch, useSelector } from '../../utils/state_management';
import { SearchData } from '../utils/use_search';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';

interface Props {
  history: History;
}

export const DiscoverTable = ({ history }: Props) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { filterManager } = services.data.query;
  const { data$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    rows: [],
  });

  const { columns, sort } = useSelector((state) => state.discover);
  const dispatch = useDispatch();
  const onAddColumn=(column:string) => dispatch(addDiscoverColumn({column,}));
  const onRemoveColumn=(column:string) => dispatch(removeDiscoverColumn(column));
  const onSetColumns=(columns:string[]) => dispatch(setDiscoverColumns({ timefield: indexPattern.timeFieldName, columns: columns}));
  const onSetSort=(sort:Array<[string, string]>) => dispatch(setDiscoverSort(sort));
  const onAddFilter = useCallback(
    (field: IndexPatternField, values: string, operation: '+' | '-') => {
      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id
      );
    return filterManager.addFilters(newFilters);
  }, [filterManager, opensearchFilters, indexPattern]);

  const { rows } = fetchState || {};

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
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
      onResize={() => {}}
      sort={sort}
      rows={rows}
      displayTimeColumn={true}
      services={services}
    />
  );
};
