/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

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

/**
 * Bar width conversion utilities.
 * Previously, barWidth was stored as a decimal between 0.1-1 (e.g., 0.7 = 70%).
 * UI now displays values between 1-100 for better user experience.
 * These helpers convert between the stored format and the display format.
 */
const storedToDisplayBarWidth = (storedValue: number): number => {
  return Math.round(storedValue * 100);
};

const displayToStoredBarWidth = (displayValue: number): number => {
  // Convert display value (1-100) to stored value
  return displayValue / 100;
};

interface BarExclusiveVisOptionsProps {
  type: 'bar' | 'histogram';
  barSizeMode: 'auto' | 'manual';
  barWidth: number;
  barPadding: number;
  showBarBorder: boolean;
  barBorderWidth: number;
  barBorderColor: string;
  useThresholdColor?: boolean;
  stackMode?: 'none' | 'total';
  onBarSizeModeChange: (barSizeMode: 'auto' | 'manual') => void;
  onBarWidthChange: (barWidth: number) => void;
  onBarPaddingChange: (barPadding: number) => void;
  onShowBarBorderChange: (showBarBorder: boolean) => void;
  onBarBorderWidthChange: (barBorderWidth: number) => void;
  onBarBorderColorChange: (barBorderColor: string) => void;
  onUseThresholdColorChange: (useThresholdColor: boolean) => void;
  onStackModeChange: (stackMode: 'none' | 'total') => void;
  shouldDisableUseThresholdColor?: boolean;
}

export const BarExclusiveVisOptions = ({
  type,
  barSizeMode,
  barWidth,
  barPadding,
  showBarBorder,
  barBorderWidth,
  barBorderColor,
  useThresholdColor,
  stackMode = 'none',
  onBarSizeModeChange,
  onBarWidthChange,
  onBarPaddingChange,
  onShowBarBorderChange,
  onBarBorderWidthChange,
  onBarBorderColorChange,
  onUseThresholdColorChange,
  onStackModeChange,
  shouldDisableUseThresholdColor = false,
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

  const stackModeOptions = [
    {
      id: 'none',
      label: i18n.translate('explore.stylePanel.bar.stackModeNone', {
        defaultMessage: 'None',
      }),
    },
    {
      id: 'total',
      label: i18n.translate('explore.stylePanel.bar.stackModeStacked', {
        defaultMessage: 'Stacked',
      }),
    },
  ];

  const barAccordionMessage =
    type === 'bar'
      ? i18n.translate('explore.vis.barChart.exclusiveSettings', {
          defaultMessage: 'Bar',
        })
      : i18n.translate('explore.vis.histogramChart.exclusiveSettings', {
          defaultMessage: 'Histogram',
        });

  const renderManualSizeOptions = (bartype: 'bar' | 'histogram') => {
    if (bartype === 'histogram') return null;

    return (
      <>
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
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.bar.barWidth', {
                defaultMessage: 'Width',
              })}
              helpText={i18n.translate('explore.stylePanel.bar.barWidthHelp', {
                defaultMessage: 'Percentage Value between 1 and 100',
              })}
            >
              <DebouncedFieldNumber
                compressed
                value={storedToDisplayBarWidth(barWidth)}
                onChange={(value) =>
                  onBarWidthChange(
                    displayToStoredBarWidth(
                      value ?? storedToDisplayBarWidth(defaultBarChartStyles.barWidth)
                    )
                  )
                }
                defaultValue={storedToDisplayBarWidth(defaultBarChartStyles.barWidth)}
                min={1}
                max={100}
                step={10}
                data-test-subj="barWidthInput"
              />
            </EuiFormRow>

            <EuiSpacer size="s" />
          </>
        )}
      </>
    );
  };

  return (
    <StyleAccordion id="barSection" accordionLabel={barAccordionMessage} initialIsOpen={true}>
      {type === 'bar' && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.bar.stackMode', {
            defaultMessage: 'Stack',
          })}
        >
          <EuiButtonGroup
            legend={i18n.translate('explore.stylePanel.bar.stackMode', {
              defaultMessage: 'Stack',
            })}
            options={stackModeOptions}
            idSelected={stackMode}
            onChange={(id) => onStackModeChange(id as 'none' | 'total')}
            buttonSize="compressed"
            isFullWidth
            data-test-subj="barStackModeButtonGroup"
          />
        </EuiFormRow>
      )}

      {renderManualSizeOptions(type)}

      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.bar.useThresholdColor', {
            defaultMessage: 'Use threshold colors',
          })}
          data-test-subj="useThresholdColorButton"
          checked={useThresholdColor ?? false}
          onChange={(e) => onUseThresholdColorChange(e.target.checked)}
        />
      </EuiFormRow>

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
