/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSwitch, EuiToolTip } from '@elastic/eui';
import { useObservable } from 'react-use';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';
import { SaveVisButton } from './save_vis_button';

export const VisActionBar = () => {
  const visualizationBuilder = getVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const showRawTable = useObservable(visualizationBuilder.showRawTable$);

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  const isNonTableChart = !!visConfig?.type && visConfig.type !== 'table' && hasSelectionMapping;

  return (
    <EuiFlexGroup
      direction="row"
      gutterSize="none"
      justifyContent="spaceBetween"
      alignItems="center"
    >
      <EuiFlexItem>
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
              disabled={!isNonTableChart}
              checked={!!showRawTable}
              onChange={(e) => visualizationBuilder.setShowRawTable(e.target.checked)}
              data-test-subj="exploreShowRawDataSwitch"
            />
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexItem>

      <EuiFlexItem>
        <SaveVisButton />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
