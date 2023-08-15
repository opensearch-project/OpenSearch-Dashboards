/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History } from 'history';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { useDiscoverContext } from '../context';
import { addColumn, removeColumn, useDispatch, useSelector } from '../../utils/state_management';
import { ResultStatus, SearchData } from '../utils/use_search';

interface Props {
  history: History;
}

export const DiscoverTable = ({ history }: Props) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { data$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    rows: [],
  });

  const { columns } = useSelector((state) => state.discover);
  const dispatch = useDispatch();

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
      onAddColumn={(column) =>
        dispatch(
          addColumn({
            column,
          })
        )
      }
      onFilter={() => {}}
      onRemoveColumn={(column) => dispatch(removeColumn(column))}
      onSetColumns={() => {}}
      onSort={() => {}}
      sort={[]}
      rows={rows}
      displayTimeColumn={true}
      services={services}
    />
  );
};
