/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useObservable } from 'react-use';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiResizableContainer,
  EuiTitle,
  EuiErrorBoundary,
  EuiIcon,
  EuiPanel,
} from '@elastic/eui';
import { TimeRange } from 'src/plugins/data/common';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { VisEditorUninitialized } from './vis_editor_uninitialized';
import { VisEditorNoResults } from './vis_editor_no_results';
import { VisEditorLoadingState } from './vis_editor_loading_state';
import { QueryWorkspace } from './visualization_editor_query_workspace/query_workspace';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { ErrorCodeBlock } from '../../../components/tabs/error_guard/error_code_block';
import { EditorPanel } from './editor_panel';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';

import '../visualization_editor.scss';
import { useTransformationService } from '../../../components/data_transformations';
import { TableVis } from '../../../components/visualizations/table/table_vis';
import {
  defaultTableChartStyles,
  TableChartStyle,
} from '../../../components/visualizations/table/table_vis_config';
import { useMultiQueryBuilder } from '../multi_query_builder/multi_query_builder_context';
import { resolveRawTableRefId } from '../multi_query_builder/utils';
import type { SeriesResult } from '../multi_query_builder/types';
import { resolveRawTable } from './raw_table_utils';

const errorDefaultTitle = i18n.translate('explore.errorPanel.defaultTitle', {
  defaultMessage: 'An error occurred while executing the query',
});
const detailsText = i18n.translate('explore.errorPanel.details', {
  defaultMessage: 'Details',
});
const typeText = i18n.translate('explore.errorPanel.type', {
  defaultMessage: 'Type',
});

const rawTableStyleOptions: TableChartStyle = {
  ...defaultTableChartStyles,
  showColumnFilter: false,
  showFooter: false,
  pageSize: 50,
  globalAlignment: 'left',
};

export const ResizableQueryPanelAndVisualization = () => {
  const container = useMultiQueryBuilder();
  const { visualizationBuilderForEditor } = useVisualizationBuilder();
  const transformServices = useTransformationService(visualizationBuilderForEditor);
  const aggregateStatus$ = useMemo(() => container.getAggregateStatus$(), [container]);
  const queryStatus = useObservable(aggregateStatus$, {
    status: QueryExecutionStatus.UNINITIALIZED,
    failedQueries: [],
  });

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
      const { failedQueries } = queryStatus;
      const isSingle = failedQueries.length <= 1;
      return (
        <EuiErrorBoundary>
          <EditorPanel>
            <EuiFlexGroup direction="column" alignItems="center" className="exploreErrorGuard">
              <EuiIcon type="alert" size="xl" color="red" />
              {isSingle ? null : (
                <EuiTitle size="l">
                  <h1>{errorDefaultTitle}</h1>
                </EuiTitle>
              )}
              {failedQueries.map(({ refId, error }) => (
                <React.Fragment key={refId}>
                  <EuiTitle size={isSingle ? 'l' : 's'}>
                    {isSingle ? (
                      <h1>{`Query ${refId}: ${error?.message.reason || errorDefaultTitle}`}</h1>
                    ) : (
                      <h2>{`Query ${refId}: ${error?.message.reason || errorDefaultTitle}`}</h2>
                    )}
                  </EuiTitle>
                  <div className="exploreErrorGuard__errorsSection">
                    {error?.message.details ? (
                      <ErrorCodeBlock title={detailsText} text={error.message.details} />
                    ) : null}
                    {error?.message.type ? (
                      <ErrorCodeBlock title={typeText} text={error.message.type} />
                    ) : null}
                  </div>
                </React.Fragment>
              ))}
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
            <EuiResizablePanel initialSize={70} minSize="0%" paddingSize="none">
              {renderVis()}
            </EuiResizablePanel>

            <EuiResizableButton />

            <EuiResizablePanel initialSize={30} minSize="20%" paddingSize="none" hasBorder={false}>
              <EuiPanel
                paddingSize="none"
                color="transparent"
                hasBorder={false}
                className="multiTabsPanel"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <QueryWorkspace transformServices={transformServices} />
              </EuiPanel>
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};

export const VisualizationContainer = React.memo(() => {
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();

  const { container, dateRange } = useQueryBuilderState();

  // Every visible query's result
  const series$ = useMemo(() => container.getSeriesResult$(), [container]);
  const series = useObservable<SeriesResult[]>(series$, []);

  useEffect(() => {
    // No result yet: drawing empty data would fall the chart back to a table.
    if (series.length === 0) return;
    visualizationBuilder.handleSeries(series);
  }, [visualizationBuilder, series]);

  // The raw table: Final (what the vis draws), or one query's result before or after the
  // transformations, picked in the action bar.
  const showRawTable = useObservable(visualizationBuilder.showRawTable$, false);
  const rawTableRefId = useObservable(visualizationBuilder.rawTableRefId$);
  const rawTableStage = useObservable(visualizationBuilder.rawTableStage$, 'before');
  const pipelineResult = useObservable(visualizationBuilder.pipelineResult$);
  const visData = useObservable(visualizationBuilder.data$);
  const rawTableKey = `${resolveRawTableRefId(series, rawTableRefId)}-${rawTableStage}`;
  const rawTable = useMemo(
    () =>
      resolveRawTable({
        series,
        refId: resolveRawTableRefId(series, rawTableRefId),
        stage: rawTableStage,
        pipelineResult,
        visData,
      }),
    [series, rawTableRefId, rawTableStage, pipelineResult, visData]
  );

  const onSelectTimeRange = useCallback(
    (timeRange?: TimeRange) => {
      if (timeRange) {
        container.updateMultiQueryEditorState({
          dateRange: {
            from: moment(timeRange.from).toISOString(),
            to: moment(timeRange.to).toISOString(),
          },
        });
        // executeQuery clears each row's result and resets its status itself.
        container.executeAll({ userInitiated: false });
      }
    },
    [container]
  );

  return (
    <EditorPanel>
      {showRawTable && !rawTable && rawTableStage === 'after' ? (
        // A step merged the query with others or filtered it out: no transformed data of its own.
        <EuiEmptyPrompt
          iconType="merge"
          titleSize="xs"
          title={
            <h3>
              {i18n.translate('explore.visEditor.rawTableNoAfterTitle', {
                defaultMessage: 'Query {refId} has no data after the transformations',
                values: { refId: resolveRawTableRefId(series, rawTableRefId) },
              })}
            </h3>
          }
          body={i18n.translate('explore.visEditor.rawTableNoAfterBody', {
            defaultMessage: 'A step merged it with other queries or filtered it out.',
          })}
          data-test-subj="exploreRawTableMerged"
        />
      ) : showRawTable && rawTable ? (
        <TableVis
          key={`raw-table-${rawTableKey}`}
          rows={rawTable.rows}
          columns={rawTable.columns}
          styleOptions={rawTableStyleOptions}
          showStyleSelector={false}
          disableActions={false}
        />
      ) : (
        visualizationBuilder.renderVisualization({
          timeRange: dateRange,
          onSelectTimeRange,
        })
      )}
    </EditorPanel>
  );
});
