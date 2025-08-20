/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SearchProps } from './explore_embeddable';
import { VisualizationNoResults } from '../../../visualizations/public';
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';
import {
  DataGridTable,
  DataGridTableProps,
} from '../application/legacy/discover/application/components/data_grid/data_grid_table';
import { TableVis } from '../components/visualizations/table/table_vis';
import { TableChartStyleControls } from '../components/visualizations/table/table_vis_config';
interface ExploreEmbeddableProps {
  searchProps: SearchProps;
}

const DataGridTableMemoized = React.memo((props: DataGridTableProps) => (
  <DataGridTable {...props} />
));

export const ExploreEmbeddableComponent = ({ searchProps }: ExploreEmbeddableProps) => {
  const services = getServices();
  const {
    expressions: { ReactExpressionRenderer },
  } = services;
  const tableProps = {
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
  } as DataGridTableProps;

  const getEmbeddableContent = () => {
    if (searchProps?.rows?.length === 0) {
      return (
        <EuiFlexItem>
          <VisualizationNoResults />
        </EuiFlexItem>
      );
    }

    if (searchProps.activeTab === 'logs') {
      return <DataGridTableMemoized {...tableProps} />;
    }

    if (searchProps.chartType === 'table') {
      return (
        <TableVis
          columns={searchProps.tableData?.columns ?? []}
          rows={searchProps.tableData?.rows ?? []}
          styleOptions={searchProps.styleOptions as TableChartStyleControls}
        />
      );
    }

    return (
      <ReactExpressionRenderer
        expression={searchProps.expression ?? ''}
        searchContext={searchProps.searchContext}
        key={JSON.stringify(searchProps.searchContext) + searchProps.expression}
      />
    );
  };

  return (
    <EuiFlexGroup
      gutterSize="xs"
      direction="column"
      responsive={false}
      data-test-subj="embeddedSavedExplore"
      className="eui-xScrollWithShadows eui-yScrollWithShadows"
    >
      <EuiFlexItem style={{ minHeight: 0 }} data-test-subj="osdExploreContainer">
        {getEmbeddableContent()}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
