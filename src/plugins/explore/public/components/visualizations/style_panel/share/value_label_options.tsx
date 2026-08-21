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

interface BuildValueLabelProps {
  showValues: boolean | undefined;
  valueField?: string;
  decimals?: number;
  unitId?: string;
  unitSuffix?: string;
  isPercentage?: boolean;
  isStack?: boolean;
  chartType?: 'non_bar' | 'bar';
}
/**
 * Builds the ECharts label config that prints each data point's value.
 */
export const buildValueLabel = ({
  showValues,
  valueField,
  decimals,
  unitId,
  unitSuffix,
  isStack = false,
  isPercentage = false,
  chartType = 'non_bar',
}: BuildValueLabelProps) => {
  if (!showValues || !valueField) return {};
  const isBar = chartType === 'bar';
  return {
    label: {
      show: showValues ?? false,
      position: !isStack || !isBar ? 'top' : 'inside',
      formatter: (params: { value?: unknown; dimensionNames?: string[] }) => {
        const valueIndex = params.dimensionNames?.indexOf(valueField) ?? -1;
        const value =
          Array.isArray(params.value) && valueIndex >= 0 ? params.value[valueIndex] : params.value;
        // stack:Percentage won't consider unit display
        if (isPercentage) return formatSeriesValueLabel(value, true, decimals);
        return formatUnitValue(value, unitId, decimals, unitSuffix);
      },
    },
    labelLayout: isStack ? { hideOverlap: true } : {},
  };
};
