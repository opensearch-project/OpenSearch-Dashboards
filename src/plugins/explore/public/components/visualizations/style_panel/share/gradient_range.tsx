/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiRange } from '@elastic/eui';
import { useDebouncedNumber } from '../../utils/use_debounced_value';

// Fill opacity is stored as a percentage (0-100) to match the UI slider.
export const DEFAULT_FILL_OPACITY = 30;
export const DEFAULT_BAR_FILL_OPACITY = 70;

export interface Props {
  fillOpacity?: number;
  onOpacityChange: (fillOpacity: number) => void;
  testsubj?: string;
}

export const GradientRange = ({
  fillOpacity,
  onOpacityChange,
  testsubj = 'areaFillOpacity',
}: Props) => {
  const [localFillOpacity, handleFillOpacityChange] = useDebouncedNumber(
    fillOpacity,
    (value) => onOpacityChange(value ?? DEFAULT_FILL_OPACITY),
    { min: 0, max: 100 }
  );
  return (
    <EuiFormRow
      label={i18n.translate('explore.stylePanel.area.areaOpacity', {
        defaultMessage: 'Fill opacity',
      })}
    >
      <EuiRange
        compressed
        min={0}
        max={100}
        step={1}
        value={localFillOpacity ?? DEFAULT_FILL_OPACITY}
        onChange={(e) =>
          handleFillOpacityChange(e.currentTarget.value ? Number(e.currentTarget.value) : undefined)
        }
        aria-label={i18n.translate('explore.stylePanel.area.areaOpacity', {
          defaultMessage: 'Fill opacity',
        })}
        showLabels
        showValue
        data-test-subj={`${testsubj}Range`}
      />
    </EuiFormRow>
  );
};
