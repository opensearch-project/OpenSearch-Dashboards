/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiRange } from '@elastic/eui';
import { useDebouncedNumber } from '../../utils/use_debounced_value';

// Point size is the symbol diameter in pixels. 0 hides the points entirely.
export const DEFAULT_POINT_SIZE = 5;
export const MIN_POINT_SIZE = 0;
export const MAX_POINT_SIZE = 20;

interface PointSizeOptionProps {
  pointSize: number | undefined;
  onPointSizeChange: (pointSize: number) => void;
  defaultValue?: number;
  testsubj?: string;
}

export const PointSizeOption = ({
  pointSize,
  onPointSizeChange,
  defaultValue = DEFAULT_POINT_SIZE,
  testsubj = 'pointSizeRange',
}: PointSizeOptionProps) => {
  const [localPointSize, handlePointSizeChange] = useDebouncedNumber(
    pointSize,
    (value) => onPointSizeChange(value ?? defaultValue),
    { min: MIN_POINT_SIZE, max: MAX_POINT_SIZE }
  );

  const label = i18n.translate('explore.stylePanel.basic.pointSize', {
    defaultMessage: 'Point size',
  });

  return (
    <EuiFormRow label={label}>
      <EuiRange
        compressed
        value={localPointSize ?? defaultValue}
        onChange={(e) =>
          handlePointSizeChange(e.currentTarget.value ? Number(e.currentTarget.value) : undefined)
        }
        min={MIN_POINT_SIZE}
        max={MAX_POINT_SIZE}
        step={1}
        aria-label={label}
        showLabels
        showValue
        data-test-subj={testsubj}
      />
    </EuiFormRow>
  );
};

/**
 * Maps a point size onto the ECharts series flags that draw the symbols.
 */
export const getPointSymbol = (pointSize?: number, showValues?: boolean) => {
  const size = pointSize ?? DEFAULT_POINT_SIZE;
  if (size > 0) {
    return { showSymbol: true, symbolSize: size };
  }
  // edge case: lets the labels show without drawing any points when symbolSize: 0
  return showValues ? { showSymbol: true, symbolSize: 0 } : { showSymbol: false };
};
