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
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { VisEditorUninitialized } from './vis_editor_uninitialized';
import { VisEditorNoResults } from './vis_editor_no_results';
import { VisEditorLoadingState } from './vis_editor_loading_state';
import { useSearchContext } from '../../../components/query_panel/utils/use_search_context';
import { QueryPanel } from './visualization_editor_query_panel';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { ErrorCodeBlock } from '../../../components/tabs/error_guard/error_code_block';
import { EditorPanel } from './editor_panel';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import '../visualization_editor.scss';

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
  const { queryBuilder, queryEditorState } = useQueryBuilderState();

  const queryStatus = queryEditorState.queryStatus;

  const renderVis = () => {
    if (queryStatus.status === QueryExecutionStatus.NO_RESULTS) {
      return (
        <EditorPanel>
          <VisEditorNoResults />
        </EditorPanel>
      );
    }

    if (queryStatus.status === QueryExecutionStatus.UNINITIALIZED) {
      return (
        <EditorPanel>
          <VisEditorUninitialized />
        </EditorPanel>
      );
    }

    if (queryStatus.status === QueryExecutionStatus.LOADING) {
      return (
        <EditorPanel>
          <VisEditorLoadingState />
        </EditorPanel>
      );
    }

    if (queryStatus.status === QueryExecutionStatus.ERROR) {
      const error = queryStatus.error;
      return (
        <EuiErrorBoundary>
          <EditorPanel>
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
          </EditorPanel>
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
            <EuiResizablePanel initialSize={70} minSize="60%" paddingSize="none">
              {renderVis()}
            </EuiResizablePanel>

            <EuiResizableButton />

            <EuiResizablePanel initialSize={30} minSize="20%" paddingSize="none" hasBorder={false}>
              <QueryPanel queryEditorState$={queryBuilder.queryEditorState$} />
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};

export const VisualizationContainer = () => {
  const searchContext = useSearchContext();

  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();
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
    <EditorPanel>
      {visualizationBuilder.renderVisualization({
        timeRange: searchContext?.timeRange,
        onSelectTimeRange,
      })}
    </EditorPanel>
  );
};
