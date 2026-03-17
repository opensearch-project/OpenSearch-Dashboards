/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiResizableContainer,
  EuiTitle,
  EuiErrorBoundary,
  EuiIcon,
} from '@elastic/eui';
import { TimeRange } from 'src/plugins/data/common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';
import { ExploreServices } from '../../../types';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { CanvasPanel } from '../../../components/panel/canvas_panel';
import { DiscoverNoResults } from '../../../application/legacy/discover/application/components/no_results/no_results';
import { DiscoverUninitialized } from '../../../application/legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../../application/legacy/discover/application/components/loading_spinner/loading_spinner';
import { useSearchContext } from '../../../components/query_panel/utils/use_search_context';
import { QueryPanel } from './in_context_query_panel';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { ErrorCodeBlock } from '../../../components/tabs/error_guard/error_code_block';
import { VisActionBar } from './vis_action_bar';
import '../in_context_editor.scss';

const errorDefaultTitle = i18n.translate('explore.errorPanel.defaultTitle', {
  defaultMessage: 'An error occurred while executing the query',
});
const detailsText = i18n.translate('explore.errorPanel.details', {
  defaultMessage: 'Details',
});
const typeText = i18n.translate('explore.errorPanel.type', {
  defaultMessage: 'Type',
});

export const ResizableQueryPanelAndVisualization = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const { queryBuilder, queryEditorState } = useQueryBuilderState();

  const queryStatus = queryEditorState.queryStatus;

  const dataview = queryBuilder.getDataView();

  const onRefresh = () => {
    queryBuilder.executeQuery();
  };

  const renderVis = () => {
    if (queryStatus.status === QueryExecutionStatus.NO_RESULTS) {
      return (
        <CanvasPanel>
          <DiscoverNoResults
            queryString={services?.data?.query?.queryString}
            query={services?.data?.query?.queryString?.getQuery()}
            savedQuery={services?.data?.query?.savedQueries}
            timeFieldName={dataview?.timeFieldName}
          />
        </CanvasPanel>
      );
    }

    if (queryStatus.status === QueryExecutionStatus.UNINITIALIZED) {
      return (
        <CanvasPanel>
          <DiscoverUninitialized onRefresh={onRefresh} />
        </CanvasPanel>
      );
    }

    if (queryStatus.status === QueryExecutionStatus.LOADING) {
      return (
        <CanvasPanel>
          <LoadingSpinner />
        </CanvasPanel>
      );
    }

    if (queryStatus.status === QueryExecutionStatus.ERROR) {
      const error = queryStatus.error;
      return (
        <EuiErrorBoundary>
          <EuiFlexGroup direction="column" alignItems="center" className="exploreErrorGuard">
            <EuiIcon type="alert" size="xl" color="red" />
            <EuiTitle size="l">
              <h1>{error?.message.reason || errorDefaultTitle}</h1>
            </EuiTitle>
            <div className="exploreErrorGuard__errorsSection">
              {error?.message.details ? (
                <ErrorCodeBlock title={detailsText} text={error.message.details} />
              ) : null}
              {error?.message.type ? (
                <ErrorCodeBlock title={typeText} text={error?.message.type} />
              ) : null}
            </div>
          </EuiFlexGroup>
        </EuiErrorBoundary>
      );
    }
    return <VisualizationContainer />;
  };
  return (
    <EuiResizableContainer direction="vertical">
      {(EuiResizablePanel, EuiResizableButton) => {
        return (
          <>
            <EuiResizablePanel
              className="visualization_panel"
              initialSize={70}
              minSize="60%"
              paddingSize="none"
            >
              {renderVis()}
            </EuiResizablePanel>

            <EuiResizableButton />

            <EuiResizablePanel
              className="query_panel"
              initialSize={30}
              minSize="20%"
              paddingSize="none"
            >
              <QueryPanel
                queryEditorState$={queryBuilder.queryEditorState$}
                queryState$={queryBuilder.queryState$}
                dataView$={queryBuilder.datasetView$}
              />
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};

export const VisualizationContainer = () => {
  const searchContext = useSearchContext();

  const visualizationBuilder = getVisualizationBuilder();
  const { resultState: results, queryBuilder } = useQueryBuilderState();

  useEffect(() => {
    if (results) {
      const rows = results.hits?.hits || [];
      const fieldSchema = results.fieldSchema || [];
      visualizationBuilder.handleData(rows, fieldSchema);
    }
  }, [visualizationBuilder, results]);

  const onSelectTimeRange = useCallback(
    (timeRange?: TimeRange) => {
      if (timeRange) {
        queryBuilder.updateQueryEditorState({
          dateRange: {
            from: moment(timeRange.from).toISOString(),
            to: moment(timeRange.to).toISOString(),
          },
        });

        queryBuilder.clearResultState();
        queryBuilder.updateQueryEditorState({
          queryStatus: {
            status: QueryExecutionStatus.UNINITIALIZED,
            elapsedMs: undefined,
            startTime: undefined,
            error: undefined,
          },
        });
        queryBuilder.executeQuery();
      }
    },
    [queryBuilder]
  );

  return (
    <CanvasPanel>
      <VisActionBar />
      {visualizationBuilder.renderVisualization({ searchContext, onSelectTimeRange })}
    </CanvasPanel>
  );
};
