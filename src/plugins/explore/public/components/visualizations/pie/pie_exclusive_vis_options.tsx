/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSwitch, EuiPanel, EuiTitle } from '@elastic/eui';
import React from 'react';
import { PieChartStyleControls } from './pie_vis_config';
import { DebouncedTruncateField } from '../style_panel/utils';
interface PieVisOptionsProps {
  styles: PieChartStyleControls['exclusive'];
  onChange: (styles: PieChartStyleControls['exclusive']) => void;
}

export const PieExclusiveVisOptions = ({ styles, onChange }: PieVisOptionsProps) => {
  const updateStyle = <K extends keyof PieChartStyleControls['exclusive']>(
    key: K,
    value: PieChartStyleControls['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  return (
    <EuiPanel paddingSize="s" data-test-subj="pieExclusivePanel">
      <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>
              {i18n.translate('explore.stylePanel.pie.exclusive.exclusiveSettings', {
                defaultMessage: 'Exclusive Settings',
              })}
            </h4>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.vis.pie.exclusive.donut', {
              defaultMessage: 'Donut',
            })}
            checked={styles.donut}
            onChange={(e) => updateStyle('donut', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.vis.pie.exclusive.showValues', {
              defaultMessage: 'Show Values',
            })}
            checked={styles.showValues}
            onChange={(e) => updateStyle('showValues', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.vis.pie.exclusive.showLabels', {
              defaultMessage: 'Show Labels',
            })}
            checked={styles.showLabels}
            onChange={(e) => updateStyle('showLabels', e.target.checked)}
          />
        </EuiFlexItem>

        <EuiFlexItem>
          <DebouncedTruncateField
            value={styles.truncate ?? 100}
            onChange={(truncateValue) => updateStyle('truncate', truncateValue)}
            label={i18n.translate('explore.vis.pie.exclusive.labelTruncate', {
              defaultMessage: 'Label truncate',
            })}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
