/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSwitch, EuiToolTip } from '@elastic/eui';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { ExploreServices } from '../../../types';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';
import { SaveVisButton } from './save_vis_button';

export const VisActionBar = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { data } = services;
  const { clearEditor } = useEditorOperations();

  const { datasetView, resultState } = useQueryBuilderState();

  const dataset = datasetView.dataView;

  const visualizationBuilder = getVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const showRawTable = useObservable(visualizationBuilder.showRawTable$);
  const spec = visConfig?.axesMapping;
  const isNonTableChart = !!visConfig?.type && visConfig.type !== 'table';

  return (
    <EuiFlexGroup direction="row" gutterSize="none" justifyContent="spaceBetween">
      <EuiFlexItem>
        {isNonTableChart && spec && (
          <EuiFlexItem grow={false}>
            <EuiToolTip
              content={i18n.translate('explore.discover.showRawDataTooltip', {
                defaultMessage: 'View raw data table for this visualization',
              })}
            >
              <EuiSwitch
                label={i18n.translate('explore.discover.showRawData', {
                  defaultMessage: 'Show raw data',
                })}
                checked={!!showRawTable}
                onChange={(e) => visualizationBuilder.setShowRawTable(e.target.checked)}
                data-test-subj="exploreShowRawDataSwitch"
              />
            </EuiToolTip>
          </EuiFlexItem>
        )}
      </EuiFlexItem>

      <EuiFlexItem>
        <SaveVisButton />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
