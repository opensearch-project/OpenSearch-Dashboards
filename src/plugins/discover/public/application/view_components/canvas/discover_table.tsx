/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
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
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { SortOrder } from '../../../saved_searches/types';
import { DOC_HIDE_TIME_COLUMN_SETTING } from '../../../../common';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { popularizeField } from '../../helpers/popularize_field';

interface Props {
  rows?: OpenSearchSearchHit[];
}

export const DiscoverTable = ({ rows }: Props) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    uiSettings,
    data: {
      query: { filterManager },
    },
    capabilities,
    indexPatterns,
  } = services;

  const { refetch$, indexPattern, savedSearch } = useDiscoverContext();
  const { columns, sort } = useSelector((state) => state.discover);
  const dispatch = useDispatch();
  const onAddColumn = (col: string) => {
    if (indexPattern && capabilities.discover?.save) {
      popularizeField(indexPattern, col, indexPatterns);
    }

    dispatch(addColumn({ column: col }));
  };
  const onRemoveColumn = (col: string) => {
    if (indexPattern && capabilities.discover?.save) {
      popularizeField(indexPattern, col, indexPatterns);
    }

    dispatch(removeColumn(col));
  };
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
      title={savedSearch?.id ? savedSearch.title : ''}
      description={savedSearch?.id ? savedSearch.description : ''}
    />
  );
};
