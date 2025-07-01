/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiFormRow,
  EuiButtonGroup,
} from '@elastic/eui';
import React from 'react';
import { PieChartStyleControls } from './pie_vis_config';
import { DebouncedTruncateField } from '../style_panel/utils';
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
        defaultMessage: 'Pie Settings',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.vis.pie.exclusive.donut', {
          defaultMessage: 'Donut',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.pie.exclusive.donut', {
            defaultMessage: 'Donut',
          })}
          options={[
            {
              id: 'on',
              label: i18n.translate('explore.vis.pie.exclusive.on', {
                defaultMessage: 'On',
              }),
            },
            {
              id: 'off',
              label: i18n.translate('explore.vis.pie.exclusive.off', {
                defaultMessage: 'Off',
              }),
            },
          ]}
          idSelected={styles.donut ? 'on' : 'off'}
          onChange={(id) => updateStyle('donut', id === 'on')}
          buttonSize="compressed"
          isFullWidth={true}
          type="single"
          data-test-subj="donutButtonGroup"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.vis.pie.exclusive.showValues', {
          defaultMessage: 'Show Values',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.pie.exclusive.showValues', {
            defaultMessage: 'Show Values',
          })}
          options={[
            {
              id: 'on',
              label: i18n.translate('explore.vis.pie.exclusive.on', {
                defaultMessage: 'On',
              }),
            },
            {
              id: 'off',
              label: i18n.translate('explore.vis.pie.exclusive.off', {
                defaultMessage: 'Off',
              }),
            },
          ]}
          idSelected={styles.showValues ? 'on' : 'off'}
          onChange={(id) => updateStyle('showValues', id === 'on')}
          buttonSize="compressed"
          isFullWidth={true}
          type="single"
          data-test-subj="showValuesButtonGroup"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.vis.pie.exclusive.showLabels', {
          defaultMessage: 'Show Labels',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.pie.exclusive.showLabels', {
            defaultMessage: 'Show Labels',
          })}
          options={[
            {
              id: 'on',
              label: i18n.translate('explore.vis.pie.exclusive.on', {
                defaultMessage: 'On',
              }),
            },
            {
              id: 'off',
              label: i18n.translate('explore.vis.pie.exclusive.off', {
                defaultMessage: 'Off',
              }),
            },
          ]}
          idSelected={styles.showLabels ? 'on' : 'off'}
          onChange={(id) => updateStyle('showLabels', id === 'on')}
          buttonSize="compressed"
          isFullWidth={true}
          type="single"
          data-test-subj="showLabelsButtonGroup"
        />
      </EuiFormRow>

      <DebouncedTruncateField
        value={styles.truncate ?? 100}
        onChange={(truncateValue) => updateStyle('truncate', truncateValue)}
        label={i18n.translate('explore.vis.pie.exclusive.labelTruncate', {
          defaultMessage: 'Label truncate',
        })}
      />
    </StyleAccordion>
  );
};
