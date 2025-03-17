/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { useDiscoverContext } from '../context';
import {
  addColumn,
  moveColumn,
  removeColumn,
  setColumns,
  setSort,
  useDispatch,
  useSelector,
} from '../../utils/state_management';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { SortOrder } from '../../../saved_searches/types';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { popularizeField } from '../../helpers/popularize_field';
import { buildColumns } from '../../utils/columns';

interface Props {
  rows?: OpenSearchSearchHit[];
  scrollToTop?: () => void;
}

export const DiscoverTable = ({ rows, scrollToTop }: Props) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager },
    },
    capabilities,
    indexPatterns,
  } = services;

  const { refetch$, indexPattern, savedSearch } = useDiscoverContext();
  const { columns } = useSelector((state) => {
    const stateColumns = state.discover.columns;
    // check if state columns is not undefined, otherwise use buildColumns
    return {
      columns: stateColumns !== undefined ? stateColumns : buildColumns([]),
    };
  });
  const { sort } = useSelector((state) => {
    const stateSort = state.discover.sort;
    // check if state sort is not undefined, otherwise assign an empty array
    return {
      sort: stateSort !== undefined ? stateSort : [],
    };
  });
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

  const onMoveColumn = (col: string, destination: number) => {
    if (indexPattern && capabilities.discover?.save) {
      popularizeField(indexPattern, col, indexPatterns);
    }
    dispatch(moveColumn({ columnName: col, destination }));
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
      onMoveColumn={onMoveColumn}
      onRemoveColumn={onRemoveColumn}
      onSetColumns={onSetColumns}
      onSort={onSetSort}
      sort={sort}
      rows={rows}
      title={savedSearch?.id ? savedSearch.title : ''}
      description={savedSearch?.id ? savedSearch.description : ''}
      scrollToTop={scrollToTop}
    />
  );
};
