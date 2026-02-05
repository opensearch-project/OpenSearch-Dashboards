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

  return (
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <StyleAccordion
      id="tooltipSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.tooltip', {
        defaultMessage: 'Tooltip',
      })}
      initialIsOpen={initialIsOpen}
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
