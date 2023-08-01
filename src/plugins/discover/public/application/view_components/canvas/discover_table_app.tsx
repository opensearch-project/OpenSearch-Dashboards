/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { addColumn, removeColumn, useDispatch, useSelector } from '../../utils/state_management';

export const DiscoverTableApplication = ({ data$, indexPattern, savedSearch, services }) => {
  const [fetchState, setFetchState] = useState<any>({
    status: data$.getValue().status,
    fetchCounter: 0,
    fieldCounts: {},
    rows: [],
  });

  const { columns } = useSelector((state) => state.discover);
  const dispatch = useDispatch();

  const { rows } = fetchState;

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      if (
        (next.status && next.status !== fetchState.status) ||
        (next.rows && next.rows !== fetchState.rows)
      ) {
        setFetchState({ ...fetchState, ...next });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  // ToDo: implement columns, onMoveColumn, onSetColumns using config, indexPattern, appState

  if (rows.length === 0) {
    return <div>{'loading...'}</div>;
  } else {
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
  }
};
