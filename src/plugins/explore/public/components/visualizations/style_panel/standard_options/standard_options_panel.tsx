/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { MinMaxControls } from './min_max_control';
import { StyleAccordion } from '../style_accordion';

export interface StandardOptionsPanelProps {
  min?: number;
  max?: number;
  onMinChange: (min: number | undefined) => void;
  onMaxChange: (max: number | undefined) => void;
  initialIsOpen?: boolean;
}

export const StandardOptionsPanel = ({
  min,
  max,
  onMaxChange,
  onMinChange,
  initialIsOpen = false,
}: StandardOptionsPanelProps) => {
  return (
    // TODO add unit panel to standardOptions panel
    <StyleAccordion
      id="standardOptions"
      accordionLabel={i18n.translate('explore.stylePanel.threshold', {
        defaultMessage: 'Standard options',
      })}
      initialIsOpen={initialIsOpen}
    >
      <MinMaxControls min={min} max={max} onMaxChange={onMaxChange} onMinChange={onMinChange} />
    </StyleAccordion>
  );
};
