/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { VisualizationNoResults, VisualizationRequestError } from '../../../visualizations/public';
import { getDocViewsRegistry } from '../application/legacy/discover/opensearch_dashboards_services';
import { DataTable } from '../components/data_table/data_table';
import { TableVis } from '../components/visualizations/table/table_vis';
import { TableChartStyle } from '../components/visualizations/table/table_vis_config';
import { CommonVisualizationRender } from '../components/visualizations/visualization_render';
import { getLegacyDisplayedColumns } from '../helpers/data_table_helper';
import { ExploreEmbeddableContent, ExploreEmbeddableViewProps } from './explore_embeddable_state';

type LogsContent = Extract<ExploreEmbeddableContent, { kind: 'logs' }>;
type ExploreEmbeddableDataTableProps = Pick<
  ExploreEmbeddableViewProps,
  'selectedColumns' | 'hideTimeColumn' | 'onAddColumn' | 'onRemoveColumn' | 'onFilter'
> & {
  content: LogsContent;
};

const ExploreEmbeddableDataTable = ({
  content,
  selectedColumns,
  hideTimeColumn,
  onAddColumn,
  onRemoveColumn,
  onFilter,
}: ExploreEmbeddableDataTableProps) => {
  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);
  const displayedColumns = useMemo(() => {
    // Preserve the current argument order and effective display behavior. Correcting the legacy
    // helper call is a separate product-semantic change, not part of this structural refactor.
    return getLegacyDisplayedColumns(
      selectedColumns ?? [],
      content.dataset,
      !hideTimeColumn,
      false
    );
  }, [content.dataset, hideTimeColumn, selectedColumns]);

  return (
    <DataTable
      columns={displayedColumns}
      rows={content.rows}
      dataset={content.dataset}
      hits={content.hits}
      sampleSize={content.sampleSize}
      isShortDots={false}
      showPagination={true}
      docViewsRegistry={docViewsRegistry}
      onRemoveColumn={onRemoveColumn}
      onAddColumn={onAddColumn}
      onFilter={onFilter}
    />
  );
};

const hasResults = (content: ExploreEmbeddableContent) => {
  switch (content.kind) {
    case 'logs':
    case 'table':
      return content.rows.length > 0;
    case 'chart':
      return content.data.transformedData.length > 0;
  }
};

const renderContent = (
  content: ExploreEmbeddableContent,
  {
    onAddColumn,
    onRemoveColumn,
    onFilter,
    selectedColumns,
    hideTimeColumn,
    onSelectTimeRange,
    crosshairGroup,
  }: ExploreEmbeddableViewProps
) => {
  if (!hasResults(content)) {
    return <VisualizationNoResults />;
  }

  switch (content.kind) {
    case 'logs':
      return (
        <ExploreEmbeddableDataTable
          content={content}
          selectedColumns={selectedColumns}
          hideTimeColumn={hideTimeColumn}
          onAddColumn={onAddColumn}
          onRemoveColumn={onRemoveColumn}
          onFilter={onFilter}
        />
      );
    case 'table':
      return (
        <TableVis
          columns={content.columns}
          rows={content.rows}
          styleOptions={content.config.styles as TableChartStyle}
          disableActions={true}
        />
      );
    case 'chart':
      return (
        <CommonVisualizationRender
          query={content.query}
          visualizationData={content.data}
          visConfig={content.config}
          showRawTable={false}
          timeRange={content.timeRange}
          onSelectTimeRange={onSelectTimeRange}
          crosshairGroup={crosshairGroup}
        />
      );
  }
};

const ExploreEmbeddableView = (props: ExploreEmbeddableViewProps) => {
  const { state } = props;

  let content: React.ReactNode = null;
  if (state.status === 'error') {
    content = (
      <VisualizationRequestError
        error={state.error.message || state.error.name || 'An error occurred'}
      />
    );
  } else {
    content = renderContent(state.content, props);
  }

  return (
    <EuiFlexGroup
      gutterSize="xs"
      direction="column"
      responsive={false}
      data-test-subj="embeddedSavedExplore"
      style={{ overflowX: 'auto' }}
    >
      <EuiFlexItem style={{ minHeight: 0 }} data-test-subj="osdExploreContainer">
        {content}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const ExploreEmbeddableComponent = React.memo(ExploreEmbeddableView);
