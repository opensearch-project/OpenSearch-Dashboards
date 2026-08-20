/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiSwitch } from '@elastic/eui';
import { formatUnitValue } from '../unit/collection';
import { formatSeriesValueLabel } from '../../utils/utils';

interface ShowValuesSwitchProps {
  showValues?: boolean;
  onShowValuesChange: (showValues: boolean) => void;
  testsubj?: string;
}

export const ShowValuesSwitch = ({
  showValues = false,
  onShowValuesChange,
  testsubj = 'showValuesSwitch',
}: ShowValuesSwitchProps) => {
  const label = i18n.translate('explore.stylePanel.basic.showValues', {
    defaultMessage: 'Show values',
  });

  return (
    <EuiSwitch
      compressed
      label={label}
      checked={showValues}
      onChange={(e) => onShowValuesChange(e.target.checked)}
      data-test-subj={testsubj}
    />
  );
};

/**
 * Builds the ECharts label config that prints each data point's value.
 */
export const buildValueLabel = (
  showValues: boolean | undefined,
  valueField?: string,
  decimals?: number,
  unitId?: string,
  unitSuffix?: string,
  isPercentage = false
) => {
  if (!showValues || !valueField) return {};
  return {
    label: {
      show: showValues ?? false,
      position: 'top' as const,
      formatter: (params: { value?: unknown; dimensionNames?: string[] }) => {
        if (!Array.isArray(params.value)) {
          return '';
        }
        const valueIndex = params.dimensionNames?.indexOf(valueField) ?? -1;
        const value = valueIndex >= 0 ? params.value[valueIndex] : undefined;
        // stack:Percentage won't consider unit display
        if (isPercentage) return formatSeriesValueLabel(value, true, decimals);
        return formatUnitValue(value, unitId, decimals, unitSuffix);
      },
    },
    labelLayout: { hideOverlap: true },
  };
};
