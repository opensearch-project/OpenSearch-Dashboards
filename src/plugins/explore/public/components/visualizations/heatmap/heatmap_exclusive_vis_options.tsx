/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSwitch,
  EuiFieldNumber,
  EuiTitle,
  EuiColorPicker,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
} from '@elastic/eui';
import React from 'react';
import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { ColorSchemas, ScaleType, RangeValue, LabelAggregationType } from '../types';
import { getColorSchemas, getScaleType, getLabelType } from '../utils/collections';
import { CustomRange } from '../style_panel/custom_ranges';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

interface HeatmapVisOptionsProps {
  styles: HeatmapChartStyleControls['exclusive'];
  onChange: (styles: HeatmapChartStyleControls['exclusive']) => void;
}

interface HeatmapLabelVisOptionsProps {
  shouldShowType: boolean;
  styles: HeatmapChartStyleControls['label'];
  onChange: (styles: HeatmapChartStyleControls['label']) => void;
}

export const HeatmapExclusiveVisOptions = ({ styles, onChange }: HeatmapVisOptionsProps) => {
  const updateExclusiveOption = <K extends keyof HeatmapChartStyleControls['exclusive']>(
    key: K,
    value: HeatmapChartStyleControls['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };
  const colorSchemas = getColorSchemas();
  const scaleTypes = getScaleType();

  const [maxNumberOfColors, handleMaxNumberOfColors] = useDebouncedNumericValue(
    styles.maxNumberOfColors,
    (val) => onChange({ ...styles, maxNumberOfColors: val }),
    {
      min: 2,
      max: 20,
      defaultValue: 4,
    }
  );

  return (
    <EuiPanel paddingSize="s" data-test-subj="heatmapExclusivePanel">
      <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>
              {i18n.translate('explore.stylePanel.heatmap.exclusive.exclusiveSettings', {
                defaultMessage: 'Exclusive Settings',
              })}
            </h4>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.heatmap.exclusive.colorSchema', {
              defaultMessage: 'Color Schema',
            })}
          >
            <EuiSelect
              options={colorSchemas}
              value={styles.colorSchema}
              onChange={(e) => updateExclusiveOption('colorSchema', e.target.value as ColorSchemas)}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label="Reverse Schema"
            checked={styles.reverseSchema}
            onChange={(e) => updateExclusiveOption('reverseSchema', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.heatmap.exclusive.colorScale', {
              defaultMessage: 'Color Scale',
            })}
          >
            <EuiSelect
              options={scaleTypes}
              value={styles.colorScaleType}
              onChange={(e) => updateExclusiveOption('colorScaleType', e.target.value as ScaleType)}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.heatmap.exclusive.scaleToDataBounds', {
              defaultMessage: 'Scale to data bounds',
            })}
            checked={styles.scaleToDataBounds}
            disabled={styles.percentageMode || styles.useCustomRanges}
            onChange={(e) => updateExclusiveOption('scaleToDataBounds', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.heatmap.exclusive.percentageMode', {
              defaultMessage: 'Percentage mode',
            })}
            disabled={styles.useCustomRanges || styles.scaleToDataBounds}
            checked={styles.percentageMode}
            onChange={(e) => updateExclusiveOption('percentageMode', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup
            alignItems="flexStart"
            direction="column"
            justifyContent="center"
            gutterSize="none"
          >
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                {i18n.translate('explore.stylePanel.heatmap.exclusive.maxNumberOfColors', {
                  defaultMessage: 'Max number of colors',
                })}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFieldNumber
                compressed
                min={2}
                disabled={styles.useCustomRanges}
                placeholder="Max number of colors"
                value={maxNumberOfColors}
                onChange={(e) => handleMaxNumberOfColors(e.target.value)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.heatmap.exclusive.useCustomRanges', {
              defaultMessage: 'Use custom ranges',
            })}
            disabled={styles.percentageMode || styles.scaleToDataBounds}
            checked={styles.useCustomRanges}
            onChange={(e) => updateExclusiveOption('useCustomRanges', e.target.checked)}
          />
        </EuiFlexItem>

        {styles.useCustomRanges && (
          <EuiFlexItem>
            <CustomRange
              customRanges={styles.customRanges}
              onCustomRangesChange={(ranges: RangeValue[]) => {
                updateExclusiveOption('customRanges', ranges);
              }}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export const HeatmapLabelVisOptions = ({
  styles,
  onChange,
  shouldShowType,
}: HeatmapLabelVisOptionsProps) => {
  const updateLabelOption = <K extends keyof HeatmapChartStyleControls['label']>(
    key: K,
    value: HeatmapChartStyleControls['label'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };
  const labelType = getLabelType();
  return (
    <EuiPanel paddingSize="s" data-test-subj="heatmapLabelPanel">
      <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>
              {i18n.translate('explore.stylePanel.heatmap.label.labelSettings', {
                defaultMessage: 'Label Settings',
              })}
            </h4>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.heatmap.label.show', {
              defaultMessage: 'Show Labels',
            })}
            checked={styles.show}
            onChange={(e) => updateLabelOption('show', e.target.checked)}
          />
        </EuiFlexItem>
        {styles.show && (
          <>
            <EuiFlexItem>
              <EuiSwitch
                label={i18n.translate('explore.stylePanel.heatmap.label.rotate', {
                  defaultMessage: 'Rotate',
                })}
                checked={styles.rotate}
                onChange={(e) => updateLabelOption('rotate', e.target.checked)}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSwitch
                label={i18n.translate('explore.stylePanel.heatmap.label.overwriteColor', {
                  defaultMessage: 'Overwrite automatic color',
                })}
                checked={styles.overwriteColor}
                onChange={(e) => updateLabelOption('overwriteColor', e.target.checked)}
              />
            </EuiFlexItem>
            {styles.overwriteColor && (
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('explore.stylePanel.heatmap.label.color', {
                    defaultMessage: 'Color',
                  })}
                >
                  <EuiColorPicker
                    onChange={(color) => updateLabelOption('color', color)}
                    color={styles.color}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            )}
            {shouldShowType && (
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('explore.stylePanel.heatmap.label.type', {
                    defaultMessage: 'Type',
                  })}
                >
                  <EuiSelect
                    value={styles.type}
                    onChange={(e) =>
                      updateLabelOption('type', e.target.value as LabelAggregationType)
                    }
                    options={labelType}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            )}
          </>
        )}
      </EuiFlexGroup>
    </EuiPanel>
  );
};
