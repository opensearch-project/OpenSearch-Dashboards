/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFormRow, EuiButtonGroup, EuiSpacer, EuiSwitch, EuiSelect } from '@elastic/eui';
import { Positions } from '../../types';
import { StyleAccordion } from '../style_accordion';

export interface LegendOptions {
  show: boolean;
  position: Positions;
}

export interface LegendOptionsProps {
  legendOptions: LegendOptions;
  onLegendOptionsChange: (legendOptions: Partial<LegendOptions>) => void;
  shouldShowLegend?: boolean;
}

export const LegendOptionsPanel = ({
  legendOptions,
  onLegendOptionsChange,
  shouldShowLegend = true,
}: LegendOptionsProps) => {
  if (!shouldShowLegend || !legendOptions || !onLegendOptionsChange) {
    return null;
  }

  const legendPositionOptions = [
    {
      value: Positions.RIGHT,
      text: i18n.translate('explore.stylePanel.legend.position.right', {
        defaultMessage: 'Right',
      }),
    },
    {
      value: Positions.BOTTOM,
      text: i18n.translate('explore.stylePanel.legend.position.bottom', {
        defaultMessage: 'Bottom',
      }),
    },
    {
      value: Positions.LEFT,
      text: i18n.translate('explore.stylePanel.legend.position.left', {
        defaultMessage: 'Left',
      }),
    },
    {
      value: Positions.TOP,
      text: i18n.translate('explore.stylePanel.legend.position.top', {
        defaultMessage: 'Top',
      }),
    },
  ];

  return (
    <StyleAccordion
      id="legendSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.legend', {
        defaultMessage: 'Legend',
      })}
      initialIsOpen={true}
    >
      <EuiSwitch
        compressed
        label={i18n.translate('explore.stylePanel.legend.mode', {
          defaultMessage: 'Show legend',
        })}
        checked={legendOptions.show}
        onChange={(e) => onLegendOptionsChange({ show: e.target.checked })}
        data-test-subj="legendModeSwitch"
      />

      {legendOptions.show && (
        <>
          <EuiSpacer size="s" />
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.legend.position', {
              defaultMessage: 'Position',
            })}
          >
            <EuiSelect
              compressed
              options={legendPositionOptions}
              value={legendOptions.position}
              onChange={(e) => onLegendOptionsChange({ position: e.target.value as Positions })}
              data-test-subj="legendPositionSelect"
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
