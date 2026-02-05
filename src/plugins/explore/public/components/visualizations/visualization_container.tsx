/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { EuiPanel } from '@elastic/eui';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import React, { useCallback, useEffect, useMemo } from 'react';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import './visualization_container.scss';
import { AxisColumnMappings } from './types';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder';
import { TimeRange } from '../../../../data/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  clearQueryStatusMap,
  clearResults,
  setDateRange,
} from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';

export interface UpdateVisualizationProps {
  mappings: AxisColumnMappings;
}
// TODO: add back notifications
// const VISUALIZATION_TOAST_MSG = {
//   useRule: i18n.translate('explore.visualize.toast.useRule', {
//     defaultMessage: 'Cannot apply previous configured visualization, use rule matched',
//   }),
//   reset: i18n.translate('explore.visualize.toast.reset', {
//     defaultMessage: 'Cannot apply previous configured visualization, reset',
//   }),
//   metricReset: i18n.translate('explore.visualize.toast.metricReset', {
//     defaultMessage: 'Cannot apply metric type visualization, reset',
//   }),
//   switchReset: i18n.translate('explore.visualize.toast.switchReset', {
//     defaultMessage: 'Cannot apply configured visualization to the current chart type, reset',
//   }),
// };

export const VisualizationContainer = React.memo(() => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { results } = useTabResults();
  const searchContext = useSearchContext();
  const dispatch = useDispatch();

  const visualizationBuilder = getVisualizationBuilder();

  useEffect(() => {
    if (results) {
      const rows = results.hits?.hits || [];
      const fieldSchema = results.fieldSchema || [];
      visualizationBuilder.handleData(rows, fieldSchema);
    }
  }, [visualizationBuilder, results]);

  useEffect(() => {
    visualizationBuilder.init();
    return () => {
      // reset visualization builder
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

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
    <div className="exploreVisContainer">
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        data-test-subj="exploreVisualizationLoader"
        className="exploreVisPanel"
        paddingSize="none"
      >
        <div className="exploreVisPanel__inner">
          {visualizationBuilder.renderVisualization({ searchContext, onSelectTimeRange })}
        </div>
      </EuiPanel>
    </div>
  );
});
