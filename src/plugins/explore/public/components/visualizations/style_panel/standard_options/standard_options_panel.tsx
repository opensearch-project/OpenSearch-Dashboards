/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';

import { MinMaxControls } from './min_max_control';
import { StyleAccordion } from '../style_accordion';
import { UnitPanel } from '../unit/unit_panel';
import { DebouncedFieldNumber, DebouncedFieldText } from '../utils';

export interface StandardOptionsPanelProps {
  min?: number;
  max?: number;
  onMinChange?: (min: number | undefined) => void;
  onMaxChange?: (max: number | undefined) => void;
  unit?: string;
  onUnitChange: (unit: string | undefined) => void;
  decimals?: number;
  onDecimalsChange?: (decimals: number | undefined) => void;
  unitSuffix?: string;
  onUnitSuffixChange?: (unitSuffix: string | undefined) => void;
  initialIsOpen?: boolean;
}

export const StandardOptionsPanel = ({
  min,
  max,
  onMaxChange,
  onMinChange,
  unit,
  onUnitChange,
  decimals,
  onDecimalsChange,
  unitSuffix,
  onUnitSuffixChange,
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
      <EuiFlexGroup direction="column" gutterSize="s">
        {onMaxChange && onMinChange && (
          <EuiFlexItem>
            <MinMaxControls
              min={min}
              max={max}
              onMaxChange={onMaxChange}
              onMinChange={onMinChange}
            />
          </EuiFlexItem>
        )}

        <EuiFlexItem>
          <UnitPanel unit={unit} onUnitChange={onUnitChange} />
        </EuiFlexItem>

        {onUnitSuffixChange && (
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.standardOptions.unitSuffix', {
                defaultMessage: 'Unit suffix',
              })}
              helpText={i18n.translate('explore.stylePanel.standardOptions.unitSuffix.help', {
                defaultMessage: 'Appended after the unit or use a customized unit.',
              })}
            >
              <DebouncedFieldText
                value={unitSuffix ?? ''}
                onChange={(value) => onUnitSuffixChange(value === '' ? undefined : value)}
                placeholder="e.g. /sec"
                data-test-subj="standardOptionsUnitSuffix"
              />
            </EuiFormRow>
          </EuiFlexItem>
        )}

        {onDecimalsChange && (
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.standardOptions.decimals', {
                defaultMessage: 'Decimals',
              })}
              helpText={i18n.translate('explore.stylePanel.standardOptions.decimals.help', {
                defaultMessage: 'Leave empty for automatic precision',
              })}
            >
              <DebouncedFieldNumber
                min={0}
                max={10}
                value={decimals}
                onChange={(value) => onDecimalsChange(value == null ? undefined : value)}
                placeholder="auto"
                data-test-subj="standardOptionsDecimals"
              />
            </EuiFormRow>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </StyleAccordion>
  );
};
