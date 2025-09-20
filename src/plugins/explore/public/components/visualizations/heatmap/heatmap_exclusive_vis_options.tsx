/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiSwitch, EuiButtonGroup, EuiColorPicker, EuiFormRow, EuiSelect } from '@elastic/eui';
import React, { useMemo } from 'react';
import { defaultHeatmapChartStyles, HeatmapChartStyleControls } from './heatmap_vis_config';
import { ColorSchemas, ScaleType } from '../types';
import { getColorSchemas } from '../utils/collections';
import { useDebouncedValue } from '../utils/use_debounced_value';
import { StyleAccordion } from '../style_panel/style_accordion';
import { DebouncedFieldNumber } from '../style_panel/utils';

interface HeatmapVisOptionsProps {
  styles: HeatmapChartStyleControls['exclusive'];
  onChange: (styles: HeatmapChartStyleControls['exclusive']) => void;
  useThresholdColor: boolean;
}

interface HeatmapLabelVisOptionsProps {
  styles: HeatmapChartStyleControls['exclusive']['label'];
  onChange: (styles: HeatmapChartStyleControls['exclusive']['label']) => void;
}

export const HeatmapExclusiveVisOptions = ({
  styles,
  onChange,
  useThresholdColor,
}: HeatmapVisOptionsProps) => {
  const updateExclusiveOption = <K extends keyof HeatmapChartStyleControls['exclusive']>(
    key: K,
    value: HeatmapChartStyleControls['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };
  const colorSchemas = useMemo(() => getColorSchemas(), []);

  return (
    <StyleAccordion
      id="heatmapSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.heatmap', {
        defaultMessage: 'Heatmap',
      })}
      initialIsOpen={true}
      data-test-subj="heatmapExclusivePanel"
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.heatmap.exclusive.colorSchema', {
          defaultMessage: 'Color schema',
        })}
      >
        <EuiSelect
          compressed
          options={colorSchemas}
          value={styles.colorSchema}
          onChange={(e) => updateExclusiveOption('colorSchema', e.target.value as ColorSchemas)}
          onMouseUp={(e) => e.stopPropagation()}
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.heatmap.exclusive.reverseColorSchema', {
            defaultMessage: 'Reverse schema',
          })}
          checked={styles.reverseSchema}
          onChange={(e) => updateExclusiveOption('reverseSchema', e.target.checked)}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.heatmap.exclusive.colorScale', {
          defaultMessage: 'Color scale',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.heatmap.exclusive.colorScale', {
            defaultMessage: 'Color scale',
          })}
          isFullWidth
          options={[
            {
              id: 'linear',
              label: i18n.translate('explore.stylePanel.heatmap.exclusive.scaleType.linear', {
                defaultMessage: 'Linear',
              }),
            },
            {
              id: 'log',
              label: i18n.translate('explore.stylePanel.heatmap.exclusive.scaleType.log', {
                defaultMessage: 'Log',
              }),
            },
            {
              id: 'sqrt',
              label: i18n.translate('explore.stylePanel.heatmap.exclusive.scaleType.sqrt', {
                defaultMessage: 'Sqrt',
              }),
            },
          ]}
          onChange={(optionId) => {
            updateExclusiveOption('colorScaleType', optionId as ScaleType);
          }}
          type="single"
          idSelected={styles.colorScaleType}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          data-test-subj="scaleToDataBounds"
          label={i18n.translate('explore.stylePanel.heatmap.exclusive.scaleToDataBounds', {
            defaultMessage: 'Scale to data bounds',
          })}
          checked={styles.scaleToDataBounds}
          disabled={styles.percentageMode || useThresholdColor}
          onChange={(e) => updateExclusiveOption('scaleToDataBounds', e.target.checked)}
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          data-test-subj="percentageMode"
          label={i18n.translate('explore.stylePanel.heatmap.exclusive.percentageMode', {
            defaultMessage: 'Percentage mode',
          })}
          disabled={useThresholdColor || styles.scaleToDataBounds}
          checked={styles.percentageMode}
          onChange={(e) => updateExclusiveOption('percentageMode', e.target.checked)}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.heatmap.exclusive.maxNumberOfColors', {
          defaultMessage: 'Max number of colors',
        })}
      >
        <DebouncedFieldNumber
          data-test-subj="visHeatmapMaxNumberOfColors"
          compressed
          min={2}
          max={20}
          disabled={useThresholdColor}
          value={styles.maxNumberOfColors}
          defaultValue={defaultHeatmapChartStyles.exclusive.maxNumberOfColors}
          onChange={(value) =>
            onChange({
              ...styles,
              maxNumberOfColors: value ?? defaultHeatmapChartStyles.exclusive.maxNumberOfColors,
            })
          }
        />
      </EuiFormRow>

      <HeatmapLabelVisOptions
        styles={styles.label}
        onChange={(changes) => {
          updateExclusiveOption('label', changes);
        }}
      />
    </StyleAccordion>
  );
};

export const HeatmapLabelVisOptions = ({ styles, onChange }: HeatmapLabelVisOptionsProps) => {
  const updateLabelOption = <K extends keyof HeatmapChartStyleControls['exclusive']['label']>(
    key: K,
    value: HeatmapChartStyleControls['exclusive']['label'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const [color, setDebouncedColor] = useDebouncedValue<string>(
    styles.color,
    (val) => updateLabelOption('color', val),
    300
  );

  return (
    <>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.heatmap.label.showLabels', {
            defaultMessage: 'Show labels',
          })}
          checked={styles.show}
          onChange={(e) => updateLabelOption('show', e.target.checked)}
        />
      </EuiFormRow>

      {styles.show && (
        <>
          <EuiFormRow>
            <EuiSwitch
              compressed
              label={i18n.translate('explore.stylePanel.heatmap.label.rotate', {
                defaultMessage: 'Rotate',
              })}
              checked={styles.rotate}
              onChange={(e) => updateLabelOption('rotate', e.target.checked)}
              data-test-subj="rotateLabel"
            />
          </EuiFormRow>

          <EuiFormRow>
            <EuiSwitch
              compressed
              label={i18n.translate('explore.stylePanel.heatmap.label.overwriteColor', {
                defaultMessage: 'Overwrite automatic color',
              })}
              checked={styles.overwriteColor}
              onChange={(e) => updateLabelOption('overwriteColor', e.target.checked)}
              data-test-subj="overwriteColor"
            />
          </EuiFormRow>

          {styles.overwriteColor && (
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.heatmap.label.color', {
                defaultMessage: 'Color',
              })}
            >
              <EuiColorPicker compressed onChange={setDebouncedColor} color={color} />
            </EuiFormRow>
          )}
        </>
      )}
    </>
  );
};
