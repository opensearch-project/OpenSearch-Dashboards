/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { PieChartStyleControls } from './pie_vis_config';
import { PieExclusiveVisOptions } from './pie_exclusive_vis_options';
import { StyleControlsProps } from '../utils/use_visualization_types';

export type PieVisStyleControlsProps = StyleControlsProps<PieChartStyleControls>;

export const PieVisStyleControls: React.FC<PieVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const updateStyleOption = <K extends keyof PieChartStyleControls>(
    key: K,
    value: PieChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'basic',
      name: i18n.translate('explore.vis.pieChart.tabs.general', {
        defaultMessage: 'Basic',
      }),
      content: (
        <GeneralVisOptions
          addTooltip={styleOptions.addTooltip}
          addLegend={styleOptions.addLegend}
          legendPosition={styleOptions.legendPosition}
          onAddTooltipChange={(addTooltip) => updateStyleOption('addTooltip', addTooltip)}
          onAddLegendChange={(addLegend) => updateStyleOption('addLegend', addLegend)}
          onLegendPositionChange={(legendPosition) =>
            updateStyleOption('legendPosition', legendPosition)
          }
        />
      ),
    },
    {
      id: 'exclusive',
      name: i18n.translate('explore.vis.pieChart.tabs.exclusive', {
        defaultMessage: 'Exclusive',
      }),
      content: (
        <PieExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      ),
    },
  ];

  return (
    <EuiTabbedContent
      tabs={tabs}
      initialSelectedTab={tabs[0]}
      autoFocus="selected"
      size="s"
      expand={false}
    />
  );
};
