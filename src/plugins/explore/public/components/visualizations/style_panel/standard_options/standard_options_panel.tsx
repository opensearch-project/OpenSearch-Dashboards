/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import { MinMaxControls } from './min_max_control';
import { StyleAccordion } from '../style_accordion';
import { UnitPanel } from '../unit/unit_panel';

export interface StandardOptionsPanelProps {
  min?: number;
  max?: number;
  onMinChange: (min: number | undefined) => void;
  onMaxChange: (max: number | undefined) => void;
  unit?: string;
  onUnitChange: (unit: string | undefined) => void;
  initialIsOpen?: boolean;
}

export const StandardOptionsPanel = ({
  min,
  max,
  onMaxChange,
  onMinChange,
  unit,
  onUnitChange,
  initialIsOpen = false,
}: StandardOptionsPanelProps) => {
  return (
    // TODO add unit panel to standardOptions panel
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <StyleAccordion
      id="standardOptions"
      accordionLabel={i18n.translate('explore.stylePanel.threshold', {
        defaultMessage: 'Standard options',
      })}
      initialIsOpen={initialIsOpen}
    >
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>
          <MinMaxControls min={min} max={max} onMaxChange={onMaxChange} onMinChange={onMinChange} />{' '}
        </EuiFlexItem>

        <EuiFlexItem>
          <UnitPanel unit={unit} onUnitChange={onUnitChange} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </StyleAccordion>
  );
};
