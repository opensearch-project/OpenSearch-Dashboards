/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { EuiPanel } from '@elastic/eui';
import React, { useCallback, useEffect } from 'react';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import { AxisColumnMappings } from '../../../../explore/public';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder_singleton';
import { TimeRange } from '../../../../data/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../types';
import {
  clearQueryStatusMap,
  clearResults,
  setDateRange,
} from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';

export interface UpdateVisualizationProps {
  mappings: AxisColumnMappings;
}

export const VisualizationContainer = React.memo(() => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { results } = useTabResults();
  const searchContext = useSearchContext();
  const dispatch = useDispatch();

  const visualizationBuilder = getVisualizationBuilder();
  useEffect(() => {
    visualizationBuilder.init();
    return () => {
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

  useEffect(() => {
    if (!results) return;

    const rows = results.hits?.hits || [];
    const fieldSchema = results.fieldSchema || [];

    // Defer handleData to the next microtask so that:
    // 1. init() (which sets up the onDataChange subscription) has already run
    // 2. VisualizationRender has mounted and subscribed to data$/config$
    // Without this deferral, data$.next() can fire before onDataChange is
    // subscribed, causing the auto-detection to be skipped entirely.
    const timer = setTimeout(() => {
      visualizationBuilder.handleData(rows, fieldSchema);
    }, 0);

    return () => clearTimeout(timer);
  }, [visualizationBuilder, results]);

  const onSelectTimeRange = useCallback(
    (timeRange?: TimeRange) => {
      if (timeRange) {
        dispatch(
          setDateRange({
            from: moment(timeRange.from).toISOString(),
            to: moment(timeRange.to).toISOString(),
          })
        );
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        dispatch(executeQueries({ services }));
      }
    },
    [services, dispatch]
  );

  return (
    <div className="agentTracesVisContainer">
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        data-test-subj="agentTracesVisualizationLoader"
        className="agentTracesVisPanel"
        paddingSize="none"
      >
        <div className="agentTracesVisPanel__inner">
          {visualizationBuilder.renderVisualization({
            timeRange: searchContext?.timeRange,
            onSelectTimeRange,
          })}
        </div>
      </EuiPanel>
    </div>
  );
});
