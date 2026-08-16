/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow } from '@elastic/eui';
import { DebouncedFieldRange } from '../utils';

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
  const label = i18n.translate('explore.stylePanel.area.areaOpacity', {
    defaultMessage: 'Fill opacity',
  });

  return (
    <EuiFormRow label={label}>
      <DebouncedFieldRange
        value={fillOpacity}
        onChange={(value) => onOpacityChange(value ?? DEFAULT_FILL_OPACITY)}
        min={0}
        max={100}
        defaultValue={DEFAULT_FILL_OPACITY}
        step={1}
        aria-label={label}
        data-test-subj={`${testsubj}Range`}
      />
    </EuiFormRow>
  );
};
