/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFormRow, EuiButtonGroup } from '@elastic/eui';
import { TooltipOptions } from '../../types';
import { StyleAccordion } from '../style_accordion';

export interface TooltipOptionsProps {
  tooltipOptions: TooltipOptions;
  onTooltipOptionsChange: (tooltipOptions: Partial<TooltipOptions>) => void;
}

export const TooltipOptionsPanel = ({
  tooltipOptions,
  onTooltipOptionsChange,
}: TooltipOptionsProps) => {
  const tooltipModeOptions = [
    {
      id: 'all',
      label: i18n.translate('explore.stylePanel.tooltip.mode.shown', {
        defaultMessage: 'Shown',
      }),
    },
    {
      id: 'hidden',
      label: i18n.translate('explore.stylePanel.tooltip.mode.hidden', {
        defaultMessage: 'Hidden',
      }),
    },
  ];

  if (!tooltipOptions || !onTooltipOptionsChange) {
    return null;
  }

  return (
    <StyleAccordion
      id="tooltipSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.tooltip', {
        defaultMessage: 'Tooltip',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.tooltip.mode', {
          defaultMessage: 'Tooltip mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.tooltip.mode', {
            defaultMessage: 'Tooltip mode',
          })}
          options={tooltipModeOptions}
          idSelected={tooltipOptions.mode}
          onChange={(id) => onTooltipOptionsChange({ mode: id as TooltipOptions['mode'] })}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="tooltipModeButtonGroup"
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
