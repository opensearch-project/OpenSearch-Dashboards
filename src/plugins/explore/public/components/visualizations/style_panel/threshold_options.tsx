/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFormRow,
  EuiFieldNumber,
  EuiColorPicker,
  EuiSelect,
  EuiRange,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiSwitch,
} from '@elastic/eui';
import { ThresholdLine, ThresholdLineStyle } from '../types';

export interface ThresholdOptionsProps {
  thresholdLine: ThresholdLine;
  onThresholdChange: (threshold: ThresholdLine) => void;
}

const lineStyleOptions = [
  {
    value: ThresholdLineStyle.Full,
    text: i18n.translate('explore.stylePanel.threshold.lineStyle.full', {
      defaultMessage: 'Full',
    }),
  },
  {
    value: ThresholdLineStyle.Dashed,
    text: i18n.translate('explore.stylePanel.threshold.lineStyle.dashed', {
      defaultMessage: 'Dashed',
    }),
  },
  {
    value: ThresholdLineStyle.DotDashed,
    text: i18n.translate('explore.stylePanel.threshold.lineStyle.dotDashed', {
      defaultMessage: 'Dot-dashed',
    }),
  },
];

export const ThresholdOptions = ({ thresholdLine, onThresholdChange }: ThresholdOptionsProps) => {
  const updateThresholdOption = (key: keyof ThresholdLine, value: any) => {
    const newThresholdLine = {
      ...thresholdLine,
      [key]: value,
    };
    onThresholdChange(newThresholdLine);
  };

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h4>
          {i18n.translate('explore.vis.gridOptions.threshold', {
            defaultMessage: 'Threshold Settings',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.threshold.show', {
          defaultMessage: 'Show threshold line',
        })}
      >
        <EuiSwitch
          label=""
          checked={thresholdLine.show}
          onChange={(e) => updateThresholdOption('show', e.target.checked)}
        />
      </EuiFormRow>

      {thresholdLine.show && (
        <>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.value', {
              defaultMessage: 'Threshold value',
            })}
          >
            <EuiFieldNumber
              value={thresholdLine.value}
              onChange={(e) => updateThresholdOption('value', parseFloat(e.target.value) || 0)}
              data-test-subj="exploreVisThresholdValue"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.color', {
              defaultMessage: 'Line color',
            })}
          >
            <EuiColorPicker
              color={thresholdLine.color}
              onChange={(color) => updateThresholdOption('color', color)}
              data-test-subj="exploreVisThresholdColor"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.style', {
              defaultMessage: 'Line style',
            })}
          >
            <EuiSelect
              options={lineStyleOptions}
              value={thresholdLine.style}
              onChange={(e) => updateThresholdOption('style', e.target.value)}
              data-test-subj="exploreVisThresholdStyle"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.width', {
              defaultMessage: 'Line width',
            })}
          >
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem>
                <EuiRange
                  min={1}
                  max={10}
                  step={1}
                  value={thresholdLine.width}
                  onChange={(e) =>
                    updateThresholdOption('width', parseInt(e.currentTarget.value, 10))
                  }
                  showValue
                  data-test-subj="exploreVisThresholdWidth"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
        </>
      )}
    </EuiPanel>
  );
};
