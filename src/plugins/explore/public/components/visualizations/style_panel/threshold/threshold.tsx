/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFieldNumber,
  EuiColorPicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiButton,
  EuiFieldText,
  EuiButtonGroup,
  EuiSpacer,
  EuiButtonIcon,
  EuiFormLabel,
  EuiFormRow,
} from '@elastic/eui';
import { v4 as uuidv4 } from 'uuid';
import { ThresholdLine, ThresholdLineStyle, ThresholdLines } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { useDebouncedValue } from '../../utils/use_debounced_value';

export interface ThresholdOptionsProps {
  thresholdLines: ThresholdLines;
  onThresholdLinesChange: (thresholds: ThresholdLines) => void;
}

const thresholdStyleOptions = [
  {
    id: ThresholdLineStyle.Full,
    label: i18n.translate('explore.stylePanel.threshold.lineStyle.solid', {
      defaultMessage: 'Solid',
    }),
  },
  {
    id: ThresholdLineStyle.DotDashed,
    label: i18n.translate('explore.stylePanel.threshold.lineStyle.dot', {
      defaultMessage: 'Dot',
    }),
  },
  {
    id: ThresholdLineStyle.Dashed,
    label: i18n.translate('explore.stylePanel.threshold.lineStyle.dash', {
      defaultMessage: 'Dash',
    }),
  },
];

export const ThresholdOptions = ({
  thresholdLines,
  onThresholdLinesChange,
}: ThresholdOptionsProps) => {
  const [thresholdStyle, setThresholdStyle] = useState<ThresholdLineStyle>(ThresholdLineStyle.Full);

  const [debouncedThresholds, handleDebouncedThresholdChange] = useDebouncedValue(
    thresholdLines,
    (updatedThresholds) => onThresholdLinesChange(updatedThresholds),
    500
  );

  if (!thresholdLines || !onThresholdLinesChange) {
    return null;
  }

  const handleAddThreshold = () => {
    const activeThresholds = thresholdLines.filter((t) => t.show);
    const thresholdNumber = activeThresholds.length + 1;

    const newThreshold: ThresholdLine = {
      id: uuidv4(),
      color: getNextColor(),
      show: true,
      style: thresholdStyle,
      value: 50,
      width: 1,
      name: `Threshold ${thresholdNumber}`,
    };

    onThresholdLinesChange([...thresholdLines, newThreshold]);
  };

  const getNextColor = (): string => {
    const colors = ['#54B399', '#FFA800', '#DB0000', '#6092C0', '#D36086', '#9170B8'];
    const activeThresholds = thresholdLines.filter((t) => t.show);

    if (activeThresholds.length === 0) {
      return colors[0];
    }

    const index = activeThresholds.length % colors.length;
    return colors[index];
  };

  const updateThreshold = (id: string, key: keyof ThresholdLine, value: any) => {
    if (!id) return;

    const updatedThresholds = thresholdLines.map((threshold) => {
      if (threshold.id === id) {
        return {
          ...threshold,
          [key]: value,
        };
      }
      return threshold;
    });
    handleDebouncedThresholdChange(updatedThresholds);
  };

  const removeThreshold = (id: string) => {
    if (!id) return;

    const updatedThresholds = thresholdLines.filter((threshold) => threshold.id !== id);
    onThresholdLinesChange(updatedThresholds);
  };

  const activeThresholds = debouncedThresholds.filter((threshold) => threshold.show);

  const handleStyleChange = (style: string) => {
    setThresholdStyle(style as ThresholdLineStyle);

    // Update all existing thresholds with the new style
    const updatedThresholds = thresholdLines.map((threshold) => ({
      ...threshold,
      style: style as ThresholdLineStyle,
    }));

    onThresholdLinesChange(updatedThresholds);
  };

  return (
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.threshold', {
        defaultMessage: 'Thresholds',
      })}
      initialIsOpen={true}
    >
      {activeThresholds.length > 0 && (
        <EuiPanel paddingSize="s" color="subdued" data-test-subj="thresholdPanel">
          <EuiFormLabel>
            {i18n.translate('explore.stylePanel.threshold.thresholds', {
              defaultMessage: 'Threshold(s)',
            })}
          </EuiFormLabel>

          <EuiSpacer size="s" />

          {activeThresholds.map((threshold) => (
            <EuiFlexGroup key={threshold.id} alignItems="center" gutterSize="s">
              <EuiFlexItem grow={3}>
                <EuiColorPicker
                  color={threshold.color}
                  onChange={(color) => {
                    if (threshold.id) {
                      updateThreshold(threshold.id, 'color', color);
                    }
                  }}
                  data-test-subj="exploreVisThresholdColor"
                  compressed
                />
              </EuiFlexItem>

              <EuiFlexItem grow={2}>
                <EuiFieldNumber
                  value={threshold.value}
                  onChange={(e) => {
                    if (threshold.id) {
                      updateThreshold(threshold.id, 'value', parseFloat(e.target.value) || 0);
                    }
                  }}
                  data-test-subj="exploreVisThresholdValue"
                  compressed
                />
              </EuiFlexItem>

              <EuiFlexItem grow={2}>
                <EuiFieldText
                  value={threshold.name || ''}
                  onChange={(e) => {
                    if (threshold.id) {
                      updateThreshold(threshold.id, 'name', e.target.value);
                    }
                  }}
                  placeholder={i18n.translate('explore.stylePanel.threshold.namePlaceholder', {
                    defaultMessage: 'Name',
                  })}
                  data-test-subj="exploreVisThresholdName"
                  compressed
                />
              </EuiFlexItem>

              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="trash"
                  color="danger"
                  aria-label="Delete"
                  onClick={() => {
                    if (threshold.id) {
                      removeThreshold(threshold.id);
                    }
                  }}
                  data-test-subj="exploreVisThresholdDelete"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          ))}

          <EuiSpacer size="s" />

          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.style', {
              defaultMessage: 'Line style',
            })}
          >
            <EuiButtonGroup
              legend={i18n.translate('explore.stylePanel.threshold.styleLegend', {
                defaultMessage: 'Threshold style options',
              })}
              options={thresholdStyleOptions}
              idSelected={thresholdStyle}
              onChange={(id) => handleStyleChange(id)}
              buttonSize="compressed"
              isFullWidth
              data-test-subj="exploreVisThresholdStyle"
            />
          </EuiFormRow>
        </EuiPanel>
      )}
      <EuiButton
        fullWidth
        onClick={handleAddThreshold}
        size="s"
        data-test-subj="exploreVisAddThreshold"
        iconType="plusInCircle"
      >
        {i18n.translate('explore.stylePanel.threshold.addAnotherThreshold', {
          defaultMessage: 'Add threshold',
        })}
      </EuiButton>
      <EuiSpacer size="m" />
    </StyleAccordion>
  );
};
