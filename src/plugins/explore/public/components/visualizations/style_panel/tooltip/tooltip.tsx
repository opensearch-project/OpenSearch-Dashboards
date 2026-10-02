/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonGroup, EuiFormRow } from '@elastic/eui';
import { TooltipOptions } from '../../types';
import { StyleAccordion } from '../style_accordion';

export interface TooltipOptionsProps {
  tooltipOptions: TooltipOptions;
  onTooltipOptionsChange: (tooltipOptions: Partial<TooltipOptions>) => void;
  initialIsOpen?: boolean;
}

export const TooltipOptionsPanel = ({
  tooltipOptions,
  onTooltipOptionsChange,
  initialIsOpen = false,
}: TooltipOptionsProps) => {
  if (!tooltipOptions || !onTooltipOptionsChange) {
    return null;
  }

  const selectedTooltipMode = tooltipOptions.mode ?? 'all';

  const tooltipModeOptions = [
    {
      id: 'all',
      label: i18n.translate('explore.stylePanel.tooltip.mode.all', {
        defaultMessage: 'All',
      }),
      'data-test-subj': 'tooltipModeAll',
    },
    {
      id: 'single',
      label: i18n.translate('explore.stylePanel.tooltip.mode.single', {
        defaultMessage: 'Single',
      }),
      'data-test-subj': 'tooltipModeSingle',
    },
    {
      id: 'hidden',
      label: i18n.translate('explore.stylePanel.tooltip.mode.hidden', {
        defaultMessage: 'Hidden',
      }),
      'data-test-subj': 'tooltipModeHidden',
    },
  ];

  return (
    <StyleAccordion
      id="tooltipSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.tooltip', {
        defaultMessage: 'Tooltip',
      })}
      initialIsOpen={initialIsOpen}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.tooltip.mode', {
          defaultMessage: 'Mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.tooltip.mode', {
            defaultMessage: 'Mode',
          })}
          options={tooltipModeOptions}
          idSelected={selectedTooltipMode}
          onChange={(id) =>
            onTooltipOptionsChange({
              mode: id as TooltipOptions['mode'],
            })
          }
          buttonSize="compressed"
          isFullWidth
          data-test-subj="tooltipModeButtonGroup"
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
