/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiButtonGroup, EuiSwitch } from '@elastic/eui';
import React from 'react';
import { defaultPieChartStyles, PieChartStyleControls } from './pie_vis_config';
import { DebouncedFieldNumber } from '../style_panel/utils';
import { StyleAccordion } from '../style_panel/style_accordion';
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
    <StyleAccordion
      id="pieSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.pie', {
        defaultMessage: 'Pie',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.vis.pie.exclusive.showAs', {
          defaultMessage: 'Show as',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.pie.exclusive.showAs', {
            defaultMessage: 'Show as',
          })}
          options={[
            {
              id: 'pie',
              label: i18n.translate('explore.vis.pie.exclusive.pie', {
                defaultMessage: 'Pie',
              }),
            },
            {
              id: 'donut',
              label: i18n.translate('explore.vis.pie.exclusive.donut', {
                defaultMessage: 'Donut',
              }),
            },
          ]}
          idSelected={styles.donut ? 'donut' : 'pie'}
          onChange={(id) => updateStyle('donut', id === 'donut')}
          buttonSize="compressed"
          isFullWidth={true}
          type="single"
          data-test-subj="donutButtonGroup"
        />
      </EuiFormRow>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.pie.exclusive.showValues', {
            defaultMessage: 'Show values',
          })}
          checked={styles.showValues}
          onChange={(e) => updateStyle('showValues', e.target.checked)}
          data-test-subj="showValuesSwtich"
        />
      </EuiFormRow>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.pie.exclusive.showLabels', {
            defaultMessage: 'Show labels',
          })}
          checked={styles.showLabels}
          onChange={(e) => updateStyle('showLabels', e.target.checked)}
          data-test-subj="showLabelsSwitch"
        />
      </EuiFormRow>
      {styles.showLabels && (
        <EuiFormRow
          label={i18n.translate('explore.vis.pie.exclusive.labelTruncate', {
            defaultMessage: 'Truncate after',
          })}
        >
          <DebouncedFieldNumber
            value={styles.truncate}
            defaultValue={defaultPieChartStyles.exclusive.truncate}
            onChange={(truncateValue) =>
              updateStyle('truncate', truncateValue ?? defaultPieChartStyles.exclusive.truncate)
            }
          />
        </EuiFormRow>
      )}
    </StyleAccordion>
  );
};
