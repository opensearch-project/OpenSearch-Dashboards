/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow } from '@elastic/eui';
import { DebouncedFieldRange } from '../utils';

export interface Props {
  defaultOpacity: number;
  fillOpacity?: number;
  onOpacityChange: (fillOpacity: number) => void;
  testsubj?: string;
}

export const OpacityRange = ({
  defaultOpacity,
  fillOpacity,
  onOpacityChange,
  testsubj = 'fillOpacityRange',
}: Props) => {
  const label = i18n.translate('explore.stylePanel.area.areaOpacity', {
    defaultMessage: 'Fill opacity',
  });

  return (
    <EuiFormRow label={label}>
      <DebouncedFieldRange
        value={fillOpacity}
        onChange={(value) => onOpacityChange(value ?? defaultOpacity)}
        min={0}
        max={100}
        defaultValue={defaultOpacity}
        step={1}
        aria-label={label}
        data-test-subj={testsubj}
      />
    </EuiFormRow>
  );
};
