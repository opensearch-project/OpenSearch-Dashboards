/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { EuiPanel } from '@elastic/eui';
import React, { useEffect, useMemo } from 'react';

import './visualization_container.scss';
import { AxisColumnMappings } from './types';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder';

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

export const VisualizationContainer = () => {
  const { results } = useTabResults();
  const searchContext = useSearchContext();

  const rows = useMemo(() => results?.hits?.hits || [], [results]);
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationBuilder = getVisualizationBuilder();

  useEffect(() => {
    visualizationBuilder.handleData(rows, fieldSchema);
  }, [rows, fieldSchema, visualizationBuilder]);

  useEffect(() => {
    visualizationBuilder.init();
    return () => {
      // reset visualization builder
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

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
          {visualizationBuilder.renderVisualization({ searchContext })}
        </div>
      </EuiPanel>
    </div>
  );
};
