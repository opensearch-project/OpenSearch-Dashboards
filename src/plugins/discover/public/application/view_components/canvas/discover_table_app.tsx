/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPageContent } from '@elastic/eui';
import { DataGridTable } from '../../components/data_grid/data_grid_table';

export const DiscoverTableApplication = ({ data$, indexPattern, savedSearch, services }) => {
  const [fetchState, setFetchState] = useState<any>({
    status: data$.getValue().status,
    fetchCounter: 0,
    fieldCounts: {},
    rows: [],
  });

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

  // ToDo: implement columns, onAddColumn, onRemoveColumn, onMoveColumn, onSetColumns using config, indexPattern, appState

  if (rows.length === 0) {
    return <div>{'loading...'}</div>;
  } else {
    return (
      <EuiFlexGroup className="dscCanvasAppPageBody__contents">
        <EuiFlexItem>
          <EuiPageContent>
            <div className="dscDiscoverGrid">
              <DataGridTable
                columns={['_source']}
                indexPattern={indexPattern}
                onAddColumn={() => {}}
                onFilter={() => {}}
                onRemoveColumn={() => {}}
                onSetColumns={() => {}}
                onSort={() => {}}
                sort={[]}
                rows={rows}
                displayTimeColumn={true}
                services={services}
              />
            </div>
          </EuiPageContent>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
};
