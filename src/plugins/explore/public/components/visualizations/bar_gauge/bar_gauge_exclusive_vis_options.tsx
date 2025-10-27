/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiSwitch, EuiButtonGroup, EuiFormRow } from '@elastic/eui';
import React from 'react';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { StyleAccordion } from '../style_panel/style_accordion';

interface BarGaugeVisOptionsProps {
  styles: BarGaugeChartStyle['exclusive'];
  onChange: (styles: BarGaugeChartStyle['exclusive']) => void;
  isXaxisNumerical: boolean;
}

const displayModeOption = [
  {
    id: 'gradient',
    label: i18n.translate('explore.vis.barGauge.displayMode.gradient', {
      defaultMessage: 'Gradient',
    }),
  },
  {
    id: 'stack',
    label: i18n.translate('explore.vis.barGauge.displayMode.stack', {
      defaultMessage: 'Stack',
    }),
  },
  {
    id: 'basic',
    label: i18n.translate('explore.vis.barGauge.displayMode.basic', {
      defaultMessage: 'Basic',
    }),
  },
];

const valueDisplayOption = [
  {
    id: 'valueColor',
    label: i18n.translate('explore.vis.barGauge.valueDisplay.valueColor', {
      defaultMessage: 'Value Color',
    }),
  },
  {
    id: 'textColor',
    label: i18n.translate('explore.vis.barGauge.valueDisplay.textColor', {
      defaultMessage: 'Text Color',
    }),
  },
  {
    id: 'hidden',
    label: i18n.translate('explore.vis.barGauge.valueDisplay.hidden', {
      defaultMessage: 'Hidden',
    }),
  },
];

export const BarGaugeExclusiveVisOptions = ({
  styles,
  onChange,
  isXaxisNumerical,
}: BarGaugeVisOptionsProps) => {
  const getOrientationOptions = () => {
    const horizontalLabel = i18n.translate('explore.vis.barGauge.orientation.horizontal', {
      defaultMessage: 'Horizontal',
    });
    const verticalLabel = i18n.translate('explore.vis.barGauge.orientation.vertical', {
      defaultMessage: 'Vertical',
    });

    // When X-axis is numerical, the labels are swapped
    const verticalOptionLabel = isXaxisNumerical ? horizontalLabel : verticalLabel;
    const horizontalOptionLabel = isXaxisNumerical ? verticalLabel : horizontalLabel;

    return [
      { id: 'vertical', label: verticalOptionLabel },
      { id: 'horizontal', label: horizontalOptionLabel },
    ];
  };

  const orientationOption = getOrientationOptions();

  const updateExclusiveOption = (key: keyof BarGaugeChartStyle['exclusive'], value: any) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  return (
    <StyleAccordion
      id="barGaugeSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.barGauge', {
        defaultMessage: 'Bar Gauge',
      })}
      initialIsOpen={true}
      data-test-subj="barGaugeExclusivePanel"
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.barGauge.exclusive.orientation', {
          defaultMessage: 'Orientation',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.barGauge.exclusive.orientation', {
            defaultMessage: 'Orientation',
          })}
          isFullWidth
          options={orientationOption}
          onChange={(optionId) => {
            updateExclusiveOption('orientation', optionId);
          }}
          type="single"
          idSelected={styles?.orientation ?? 'vertical'}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.barGauge.exclusive.displayMode', {
          defaultMessage: 'Display mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.barGauge.exclusive.displayMode', {
            defaultMessage: 'Display mode',
          })}
          isFullWidth
          options={displayModeOption}
          onChange={(optionId) => {
            updateExclusiveOption('displayMode', optionId);
          }}
          type="single"
          idSelected={styles?.displayMode ?? 'gradient'}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.barGauge.exclusive.valueDisplay', {
          defaultMessage: 'Value display',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.barGauge.exclusive.valueDisplay', {
            defaultMessage: 'Value display',
          })}
          isFullWidth
          options={valueDisplayOption}
          onChange={(optionId) => {
            updateExclusiveOption('valueDisplay', optionId);
          }}
          type="single"
          idSelected={styles?.valueDisplay ?? 'valueColor'}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.heatmap.showUnfilledArea', {
            defaultMessage: 'Show unfilled area',
          })}
          checked={styles?.showUnfilledArea ?? false}
          onChange={(e) => updateExclusiveOption('showUnfilledArea', e.target.checked)}
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
