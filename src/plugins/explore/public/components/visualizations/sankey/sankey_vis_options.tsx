/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StandardOptionsPanel } from '../style_panel/standard_options/standard_options_panel';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { SankeyChartStyle, SankeyChartStyleOptions } from './sankey_vis_config';
import { SankeyExclusiveVisOptions } from './sankey_exclusive_vis_options';

export type SankeyVisStyleControlsProps = StyleControlsProps<SankeyChartStyle>;

export const SankeyVisStyleControls: React.FC<SankeyVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  axisColumnMappings,
}) => {
  const updateStyleOption = <K extends keyof SankeyChartStyleOptions>(
    key: K,
    value: SankeyChartStyleOptions[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  if (isEmpty(axisColumnMappings)) {
    return null;
  }

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <SankeyExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <StandardOptionsPanel
          unit={styleOptions.unitId}
          onUnitChange={(unitId) => updateStyleOption('unitId', unitId)}
          decimals={styleOptions.decimals}
          onDecimalsChange={(decimals) => updateStyleOption('decimals', decimals)}
          unitSuffix={styleOptions.unitSuffix}
          onUnitSuffixChange={(unitSuffix) => updateStyleOption('unitSuffix', unitSuffix)}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <TooltipOptionsPanel
          tooltipOptions={styleOptions.tooltipOptions}
          onTooltipOptionsChange={(tooltipOptions) =>
            updateStyleOption('tooltipOptions', {
              ...styleOptions.tooltipOptions,
              ...tooltipOptions,
            })
          }
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
