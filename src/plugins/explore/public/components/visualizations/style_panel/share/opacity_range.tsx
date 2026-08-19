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
        // Value is stored as a 0-1 fraction but shown on a 0-100 scale
        value={(fillOpacity ?? defaultOpacity) * 100}
        onChange={(value) => onOpacityChange((value ?? defaultOpacity * 100) / 100)}
        min={0}
        max={100}
        defaultValue={defaultOpacity * 100}
        step={1}
        aria-label={label}
        data-test-subj={testsubj}
      />
    </EuiFormRow>
  );
};
