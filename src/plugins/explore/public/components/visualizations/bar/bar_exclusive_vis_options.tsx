/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiColorPicker,
  EuiSwitch,
  EuiButtonGroup,
} from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { DebouncedFieldNumber } from '../style_panel/utils';
import { defaultBarChartStyles } from './bar_vis_config';

interface BarExclusiveVisOptionsProps {
  barSizeMode: 'auto' | 'manual';
  barWidth: number;
  barPadding: number;
  showBarBorder: boolean;
  barBorderWidth: number;
  barBorderColor: string;
  onBarSizeModeChange: (barSizeMode: 'auto' | 'manual') => void;
  onBarWidthChange: (barWidth: number) => void;
  onBarPaddingChange: (barPadding: number) => void;
  onShowBarBorderChange: (showBarBorder: boolean) => void;
  onBarBorderWidthChange: (barBorderWidth: number) => void;
  onBarBorderColorChange: (barBorderColor: string) => void;
}

export const BarExclusiveVisOptions = ({
  barSizeMode,
  barWidth,
  barPadding,
  showBarBorder,
  barBorderWidth,
  barBorderColor,
  onBarSizeModeChange,
  onBarWidthChange,
  onBarPaddingChange,
  onShowBarBorderChange,
  onBarBorderWidthChange,
  onBarBorderColorChange,
}: BarExclusiveVisOptionsProps) => {
  const sizeModeOptions = [
    {
      id: 'auto',
      label: i18n.translate('explore.stylePanel.bar.sizeModeAuto', {
        defaultMessage: 'Auto',
      }),
    },
    {
      id: 'manual',
      label: i18n.translate('explore.stylePanel.bar.sizeModeManual', {
        defaultMessage: 'Manual',
      }),
    },
  ];

  return (
    <StyleAccordion
      id="barSection"
      accordionLabel={i18n.translate('explore.vis.barChart.exclusiveSettings', {
        defaultMessage: 'Bar',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.bar.sizeMode', {
          defaultMessage: 'Size',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.bar.sizeMode', {
            defaultMessage: 'Size',
          })}
          options={sizeModeOptions}
          idSelected={barSizeMode}
          onChange={(id) => onBarSizeModeChange(id as 'auto' | 'manual')}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="barSizeModeButtonGroup"
        />
      </EuiFormRow>

      {barSizeMode === 'manual' && (
        <>
          <EuiSpacer size="s" />
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
                <DebouncedFieldNumber
                  compressed
                  value={barWidth}
                  onChange={(value) => onBarWidthChange(value ?? defaultBarChartStyles.barWidth)}
                  defaultValue={defaultBarChartStyles.barWidth}
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
                <DebouncedFieldNumber
                  compressed
                  value={barPadding}
                  onChange={(value) =>
                    onBarPaddingChange(value ?? defaultBarChartStyles.barPadding)
                  }
                  defaultValue={defaultBarChartStyles.barPadding}
                  min={0}
                  max={0.5}
                  step={0.05}
                  data-test-subj="barPaddingInput"
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}

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
                <DebouncedFieldNumber
                  compressed
                  value={barBorderWidth}
                  onChange={(value) =>
                    onBarBorderWidthChange(value ?? defaultBarChartStyles.barBorderWidth)
                  }
                  defaultValue={defaultBarChartStyles.barBorderWidth}
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
                  compressed
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </StyleAccordion>
  );
};
