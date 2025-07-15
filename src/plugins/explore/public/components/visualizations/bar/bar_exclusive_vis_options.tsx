/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import {
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiColorPicker,
  EuiSwitch,
} from '@elastic/eui';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { StyleAccordion } from '../style_panel/style_accordion';

interface BarExclusiveVisOptionsProps {
  barWidth: number;
  barPadding: number;
  showBarBorder: boolean;
  barBorderWidth: number;
  barBorderColor: string;
  onBarWidthChange: (barWidth: number) => void;
  onBarPaddingChange: (barPadding: number) => void;
  onShowBarBorderChange: (showBarBorder: boolean) => void;
  onBarBorderWidthChange: (barBorderWidth: number) => void;
  onBarBorderColorChange: (barBorderColor: string) => void;
}

export const BarExclusiveVisOptions = ({
  barWidth,
  barPadding,
  showBarBorder,
  barBorderWidth,
  barBorderColor,
  onBarWidthChange,
  onBarPaddingChange,
  onShowBarBorderChange,
  onBarBorderWidthChange,
  onBarBorderColorChange,
}: BarExclusiveVisOptionsProps) => {
  // Use debounced value for numeric inputs
  const [localBarWidth, handleBarWidthChange] = useDebouncedNumericValue(
    barWidth,
    onBarWidthChange,
    { min: 0.1, max: 1, defaultValue: 0.7 }
  );

  const [localBarPadding, handleBarPaddingChange] = useDebouncedNumericValue(
    barPadding,
    onBarPaddingChange,
    { min: 0, max: 0.5, defaultValue: 0.1 }
  );

  const [localBarBorderWidth, handleBarBorderWidthChange] = useDebouncedNumericValue(
    barBorderWidth,
    onBarBorderWidthChange,
    { min: 1, max: 10, defaultValue: 1 }
  );

  return (
    <StyleAccordion
      id="barSection"
      accordionLabel={i18n.translate('explore.vis.barChart.exclusiveSettings', {
        defaultMessage: 'Bar',
      })}
      initialIsOpen={true}
    >
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.bar.barWidth', {
              defaultMessage: 'Width',
            })}
            helpText={i18n.translate('explore.stylePanel.bar.barWidthHelp', {
              defaultMessage: 'Value between 0.1 and 1',
            })}
          >
            <EuiFieldNumber
              compressed
              value={localBarWidth}
              onChange={(e) => handleBarWidthChange(e.target.value)}
              min={0.1}
              max={1}
              step={0.1}
              data-test-subj="barWidthInput"
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.bar.barPadding', {
              defaultMessage: 'Padding',
            })}
            helpText={i18n.translate('explore.stylePanel.bar.barPaddingHelp', {
              defaultMessage: 'Value between 0 and 0.5',
            })}
          >
            <EuiFieldNumber
              compressed
              value={localBarPadding}
              onChange={(e) => handleBarPaddingChange(e.target.value)}
              min={0}
              max={0.5}
              step={0.05}
              data-test-subj="barPaddingInput"
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <EuiSwitch
        compressed
        label={i18n.translate('explore.stylePanel.bar.barBorder', {
          defaultMessage: 'Show border',
        })}
        checked={showBarBorder}
        onChange={(e) => onShowBarBorderChange(e.target.checked)}
        data-test-subj="barBorderSwitch"
      />

      {showBarBorder && (
        <>
          <EuiSpacer size="s" />
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('explore.stylePanel.bar.barBorderWidth', {
                  defaultMessage: 'Border width',
                })}
              >
                <EuiFieldNumber
                  compressed
                  value={localBarBorderWidth}
                  onChange={(e) => handleBarBorderWidthChange(e.target.value)}
                  min={1}
                  max={10}
                  step={1}
                  data-test-subj="barBorderWidthInput"
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('explore.stylePanel.bar.barBorderColor', {
                  defaultMessage: 'Border color',
                })}
              >
                <EuiColorPicker
                  color={barBorderColor}
                  onChange={(color) => onBarBorderColorChange(color)}
                  data-test-subj="barBorderColorPicker"
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </StyleAccordion>
  );
};
