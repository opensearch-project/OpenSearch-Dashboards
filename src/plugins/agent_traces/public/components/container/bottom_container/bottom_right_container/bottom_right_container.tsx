/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiSpacer, EuiTabs, EuiTab } from '@elastic/eui';
import { selectQueryStatusMapByKey } from '../../../../application/utils/state_management/selectors';
import { RootState } from '../../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { CanvasPanel } from '../../../panel/canvas_panel';
import { DiscoverNoIndexPatterns } from '../../../../application/legacy/discover/application/components/no_index_patterns/no_index_patterns';
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
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { AgentTracesFlavor } from '../../../../../common';
import { TraceAutoDetectCallout } from '../../../trace_auto_detect_callout';
import { TracesTable } from '../../../../application/pages/traces/traces_table';
import { SpansTable } from '../../../../application/pages/traces/spans_table';
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
  const flavorId = useFlavorId();
  const [selectedTab, setSelectedTab] = useState<'traces' | 'spans'>('traces');

  const onRefresh = () => {
    if (services) {
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

  if (dataset == null) {
    return (
      <CanvasPanel>
        <>
          <EuiSpacer size="xxl" />
          <DiscoverNoIndexPatterns />
        </>
      </CanvasPanel>
    );
  }

  // All tabs manage their own data fetching (e.g. TracesTab uses useAgentTraces,
  // SpansTab uses useAgentSpans, both with server-side pagination). Bypass Redux
  // query status checks — the tab component handles its own loading / error / empty
  // states internally. Tabs that also define prepareQuery use it only for the sidebar
  // field details popover, not for the main content display.
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
