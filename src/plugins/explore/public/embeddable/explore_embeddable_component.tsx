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
  exploreProps: ExploreProps;
}
export type DiscoverEmbeddableProps = DataGridTableProps;

export const DataGridTableMemoized = React.memo((props: DataGridTableProps) => (
  <DataGridTable {...props} />
));

export function ExploreEmbeddableComponent({ exploreProps }: ExploreEmbeddableProps) {
  const services = getServices();
  const discoverEmbeddableProps = {
    columns: exploreProps.columns,
    indexPattern: exploreProps.indexPattern,
    onAddColumn: exploreProps.onAddColumn,
    onFilter: exploreProps.onFilter,
    onMoveColumn: exploreProps.onMoveColumn,
    onRemoveColumn: exploreProps.onRemoveColumn,
    onReorderColumn: exploreProps.onReorderColumn,
    onSort: exploreProps.onSort,
    rows: exploreProps.rows,
    onSetColumns: exploreProps.onSetColumns,
    sort: exploreProps.sort,
    displayTimeColumn: exploreProps.displayTimeColumn,
    services: exploreProps.services,
    hits: exploreProps.hits,
    title: exploreProps.title,
    description: exploreProps.description,
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
