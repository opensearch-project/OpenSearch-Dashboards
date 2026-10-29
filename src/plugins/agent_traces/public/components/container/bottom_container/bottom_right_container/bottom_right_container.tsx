/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiSpacer } from '@elastic/eui';
import { selectQueryStatusMapByKey } from '../../../../application/utils/state_management/selectors';
import { RootState } from '../../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { CanvasPanel } from '../../../panel/canvas_panel';
import { DiscoverUninitialized } from '../../../../application/legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../../../application/legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoResults } from '../../../../application/legacy/discover/application/components/no_results/no_results';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../types';
import {
  executeQueries,
  defaultPrepareQueryString,
} from '../../../../application/utils/state_management/actions/query_actions';
import { useDatasetContext } from '../../../../application/context';
import {
  isCheckingGenAiData,
  lacksGenAiData,
  useGenAiDataCheckVersion,
} from '../../../../application/utils/genai_data_check';
import { TraceAutoDetectCallout } from '../../../trace_auto_detect_callout';
import { AgentTracesNoAgentData } from '../../../empty_states';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';
import './bottom_right_container.scss';

// Memoized content component to prevent re-renders of chart + tabs when status hasn't changed
const ReadyContent = React.memo(() => (
  <CanvasPanel>
    <ResizableVisControlAndTabs />
  </CanvasPanel>
));
ReadyContent.displayName = 'ReadyContent';

export const BottomRightContainer = () => {
  const dispatch = useDispatch();
  const { dataset } = useDatasetContext();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();

  const onRefresh = () => {
    if (services) {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      dispatch(executeQueries({ services }));
    }
  };

  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const status = useSelector((state: RootState) => {
    return state.queryEditor.overallQueryStatus.status || QueryExecutionStatus.UNINITIALIZED;
  });
  const dataTableStatus = useSelector((state: RootState) => {
    return selectQueryStatusMapByKey(state, defaultPrepareQueryString(query))?.status;
  });
  // Re-render when the dataset's GenAI data check starts, ends or changes its result.
  useGenAiDataCheckVersion();

  if (dataset == null) {
    return (
      <CanvasPanel>
        <>
          <EuiSpacer size="xxl" />
          <TraceAutoDetectCallout />
        </>
      </CanvasPanel>
    );
  }

  // Checked before any tab mounts: the tabs query `gen_ai.operation.name`, which fails on a
  // dataset that has no GenAI spans.
  if (lacksGenAiData(dataset.id)) {
    return (
      <CanvasPanel>
        <>
          <EuiSpacer size="xxl" />
          <AgentTracesNoAgentData datasetTitle={dataset.displayName || dataset.title} />
        </>
      </CanvasPanel>
    );
  }

  if (isCheckingGenAiData(dataset.id) && status !== QueryExecutionStatus.READY) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  const activeTab = activeTabId ? services?.tabRegistry?.getTab(activeTabId) : null;
  if (activeTab) {
    return <ReadyContent />;
  }

  if (
    status === QueryExecutionStatus.NO_RESULTS ||
    dataTableStatus === QueryExecutionStatus.NO_RESULTS
  ) {
    return (
      <CanvasPanel>
        <DiscoverNoResults
          queryString={services?.data?.query?.queryString}
          query={services?.data?.query?.queryString?.getQuery()}
          savedQuery={services?.data?.query?.savedQueries}
          timeFieldName={dataset.timeFieldName}
        />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.UNINITIALIZED) {
    return (
      <CanvasPanel>
        <DiscoverUninitialized onRefresh={onRefresh} />
      </CanvasPanel>
    );
  }

  if (
    dataTableStatus === QueryExecutionStatus.READY ||
    dataTableStatus === QueryExecutionStatus.ERROR ||
    status === QueryExecutionStatus.READY ||
    status === QueryExecutionStatus.ERROR
  ) {
    return <ReadyContent />;
  }

  // Show a full-page spinner only when no tab has rendered yet.
  // Once any tab has results the tabs component stays visible and
  // individual tabs handle their own loading state.
  if (status === QueryExecutionStatus.LOADING) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  return null;
};
