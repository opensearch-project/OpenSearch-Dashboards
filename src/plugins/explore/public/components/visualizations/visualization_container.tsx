/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPanel } from '@elastic/eui';
import React, { useCallback, useEffect, useMemo } from 'react';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import './visualization_container.scss';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder, VisState } from './visualization_builder';
import { TimeRange } from '../../../../data/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  clearQueryStatusMap,
  clearResults,
  setDateRange,
} from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';
import { AxisFieldNameMappings } from './types';
import { useCurrentExploreId } from '../../application/utils/hooks/use_current_explore_id';
import { useSavedExplore } from '../../application/utils/hooks/use_saved_explore';

export interface UpdateVisualizationProps {
  mappings: AxisFieldNameMappings;
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
  const exploreId = useCurrentExploreId();
  const { savedExplore } = useSavedExplore(exploreId);

  const visState: VisState | undefined = useMemo(() => {
    if (savedExplore?.id) {
      const visualization = savedExplore.visualization;
      if (visualization) {
        const {
          chartType,
          params,
          axesMapping,
          splitField,
          splitLayout,
          showSplitLabel,
          dataTransformations,
        } = JSON.parse(visualization);
        return {
          chartType,
          styleOptions: params,
          axesMapping,
          splitField,
          splitLayout,
          showSplitLabel,
          dataTransformations,
        };
      }
    }
  }, [savedExplore?.id, savedExplore?.visualization]);

  // Don't render chart if loading a saved explore, but the saved explore not yet loaded
  if (exploreId && !savedExplore?.id) {
    return null;
  }
  return <Container visState={visState} />;
});

const Container = React.memo((props: { visState?: VisState }) => {
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
    visualizationBuilder.init(props.visState);
    return () => {
      // reset visualization builder
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder, props.visState]);

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
          {visualizationBuilder.renderVisualization({
            timeRange: searchContext?.timeRange,
            onSelectTimeRange,
          })}
        </div>
      </EuiPanel>
    </div>
  );
});
