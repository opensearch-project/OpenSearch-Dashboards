/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiSwitch } from '@elastic/eui';
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
      <EuiSwitch
        compressed
        label={i18n.translate('explore.stylePanel.tabs.tooltip.show', {
          defaultMessage: 'Show tooltip',
        })}
        checked={tooltipOptions.mode === 'all'}
        onChange={(e) =>
          onTooltipOptionsChange({
            mode: e.target.checked ? 'all' : 'hidden',
          })
        }
        data-test-subj="tooltipModeSwitch"
      />
    </StyleAccordion>
  );
};
