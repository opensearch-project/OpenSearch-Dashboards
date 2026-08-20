/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexItem } from '@elastic/eui';
import { LegendOptions, LegendOptionsPanel } from './legend';
import { Positions } from '../../types';

interface LegendStyleOptions {
  addLegend?: boolean;
  legendPosition?: Positions;
  legendTitle?: string;
}

interface LegendOptionsWrapperProps<T extends LegendStyleOptions> {
  styleOptions: T;
  updateStyleOption: <K extends keyof T>(key: K, value: T[K]) => void;
  shouldShow: boolean;
}

export const LegendOptionsWrapper = <T extends LegendStyleOptions>({
  styleOptions,
  updateStyleOption,
  shouldShow,
}: LegendOptionsWrapperProps<T>) => {
  if (!shouldShow) {
    return null;
  }

  const legendOptions = {
    show: styleOptions.addLegend ?? true,
    position: styleOptions.legendPosition || Positions.RIGHT,
    title: styleOptions.legendTitle,
  };

  const handleLegendOptionsChange = (updatedLegendOptions: Partial<LegendOptions>) => {
    if (updatedLegendOptions.show !== undefined) {
      updateStyleOption('addLegend', updatedLegendOptions.show);
    }
    if (updatedLegendOptions.position !== undefined) {
      updateStyleOption('legendPosition', updatedLegendOptions.position);
    }
    if (updatedLegendOptions.title !== undefined) {
      updateStyleOption('legendTitle', updatedLegendOptions.title);
    }
  };

  return (
    <EuiFlexItem grow={false}>
      <LegendOptionsPanel
        legendOptions={legendOptions}
        onLegendOptionsChange={handleLegendOptionsChange}
      />
    </EuiFlexItem>
  );
};
