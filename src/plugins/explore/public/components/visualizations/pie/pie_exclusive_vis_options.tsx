/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSwitch,
  EuiPanel,
  EuiFormRow,
  EuiFieldNumber,
} from '@elastic/eui';
import React, { useState } from 'react';
import { PieChartStyleControls } from './pie_vis_config';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

interface PieVisOptionsProps {
  styles: PieChartStyleControls['exclusive'];
  onChange: (styles: PieChartStyleControls['exclusive']) => void;
}

// Component for a single axis title input with debouncing
const DebouncedTruncateField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [localValue, handleChange] = useDebouncedNumericValue(value, onChange, {
    delay: 500,
    min: 1,
    defaultValue: 100,
  });

  return (
    <EuiFormRow label={label}>
      <EuiFieldNumber value={localValue} onChange={(e) => handleChange(e.target.value)} />
    </EuiFormRow>
  );
};

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
    <EuiPanel paddingSize="s">
      <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.pie.exclusive.donut', {
              defaultMessage: 'Donut',
            })}
            checked={styles.donut}
            onChange={(e) => updateStyle('donut', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.pie.exclusive.showValues', {
              defaultMessage: 'Show Values',
            })}
            checked={styles.showValues}
            onChange={(e) => updateStyle('showValues', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.pie.exclusive.showLabels', {
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
            label={i18n.translate('explore.stylePanel.pie.exclusive.labelTruncate', {
              defaultMessage: 'Label truncate',
            })}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
