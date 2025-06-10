/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ExploreProps } from './explore_embeddable';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { VisualizationNoResults } from '../../../visualizations/public';
import {
  DataGridTable,
  DataGridTableProps,
} from '../application/legacy/discover/application/components/data_grid/data_grid_table';
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';

interface ExploreEmbeddableProps {
  searchProps: ExploreProps;
}
export type DiscoverEmbeddableProps = DataGridTableProps;

export const DataGridTableMemoized = React.memo((props: DataGridTableProps) => (
  <DataGridTable {...props} />
));

export function ExploreEmbeddableComponent({ searchProps }: ExploreEmbeddableProps) {
  const services = getServices();
  const discoverEmbeddableProps = {
    columns: searchProps.columns,
    indexPattern: searchProps.indexPattern,
    onAddColumn: searchProps.onAddColumn,
    onFilter: searchProps.onFilter,
    onMoveColumn: searchProps.onMoveColumn,
    onRemoveColumn: searchProps.onRemoveColumn,
    onReorderColumn: searchProps.onReorderColumn,
    onSort: searchProps.onSort,
    rows: searchProps.rows,
    onSetColumns: searchProps.onSetColumns,
    sort: searchProps.sort,
    displayTimeColumn: searchProps.displayTimeColumn,
    services: searchProps.services,
    hits: searchProps.hits,
    title: searchProps.title,
    description: searchProps.description,
    showPagination: true,
  } as DiscoverEmbeddableProps;

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <EuiFlexGroup
          gutterSize="xs"
          direction="column"
          responsive={false}
          data-test-subj="embeddedSavedExploreDocTable"
          className="eui-xScrollWithShadows eui-yScrollWithShadows"
        >
          {discoverEmbeddableProps.hits !== 0 ? (
            <EuiFlexItem
              style={{ minHeight: 0 }}
              className="osdDocTable__container"
              data-test-subj="osdDocTableContainer"
            >
              <DataGridTableMemoized {...discoverEmbeddableProps} />
            </EuiFlexItem>
          ) : (
            <EuiFlexItem>
              <VisualizationNoResults />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}
