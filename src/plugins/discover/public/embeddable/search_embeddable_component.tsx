/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SearchProps } from './search_embeddable';
import {
  DataGridTable,
  DataGridTableProps,
} from '../application/components/data_grid/data_grid_table';
import { VisualizationNoResults } from '../../../visualizations/public';

interface SearchEmbeddableProps {
  searchProps: SearchProps;
}
export interface DiscoverEmbeddableProps extends DataGridTableProps {
  totalHitCount: number;
}

export const DataGridTableMemoized = React.memo((props: DataGridTableProps) => (
  <DataGridTable {...props} />
));

export function SearchEmbeddableComponent({ searchProps }: SearchEmbeddableProps) {
  const discoverEmbeddableProps = {
    columns: searchProps.columns,
    indexPattern: searchProps.indexPattern,
    onAddColumn: searchProps.onAddColumn,
    onFilter: searchProps.onFilter,
    onRemoveColumn: searchProps.onRemoveColumn,
    onSort: searchProps.onSort,
    rows: searchProps.rows,
    onSetColumns: searchProps.onSetColumns,
    sort: searchProps.sort,
    displayTimeColumn: searchProps.displayTimeColumn,
    services: searchProps.services,
    totalHitCount: searchProps.totalHitCount,
    title: searchProps.title,
    description: searchProps.description,
  } as DiscoverEmbeddableProps;

  return (
    <I18nProvider>
      <EuiFlexGroup
        gutterSize="xs"
        direction="column"
        responsive={false}
        data-test-subj="embeddedSavedSearchDocTable"
      >
        {discoverEmbeddableProps.totalHitCount !== 0 ? (
          <EuiFlexItem>
            <DataGridTableMemoized {...discoverEmbeddableProps} />
          </EuiFlexItem>
        ) : (
          <EuiFlexItem>
            <VisualizationNoResults />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </I18nProvider>
  );
}
