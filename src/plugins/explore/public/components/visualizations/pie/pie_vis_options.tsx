/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiSplitPanel, EuiButtonEmpty } from '@elastic/eui';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { PieChartStyleControls } from './pie_vis_config';
import { PieExclusiveVisOptions } from './pie_exclusive_vis_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher';

export type PieVisStyleControlsProps = StyleControlsProps<PieChartStyleControls>;

export const PieVisStyleControls: React.FC<PieVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
  onChartTypeChange,
}) => {
  // State to track expanded/collapsed state of each panel
  const [expandedPanels, setExpandedPanels] = useState({
    general: false,
    basic: false,
    exclusive: false,
  });

  const togglePanel = (panelId: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [panelId]: !expandedPanels[panelId as keyof typeof expandedPanels],
    });
  };

  const updateStyleOption = <K extends keyof PieChartStyleControls>(
    key: K,
    value: PieChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  return (
    <EuiSplitPanel.Outer>
      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.general ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('general')}
          size="xs"
          data-test-subj="pieVisGeneralButton"
        >
          {i18n.translate('explore.vis.pieChart.tabs.general', {
            defaultMessage: 'General',
          })}
        </EuiButtonEmpty>
        {expandedPanels.general && (
          <ChartTypeSwitcher
            availableChartTypes={availableChartTypes}
            selectedChartType={selectedChartType}
            onChartTypeChange={onChartTypeChange}
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.basic ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('basic')}
          size="xs"
          data-test-subj="pieVisBasicButton"
        >
          {i18n.translate('explore.vis.pieChart.tabs.basic', {
            defaultMessage: 'Basic',
          })}
        </EuiButtonEmpty>
        {expandedPanels.basic && (
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
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.exclusive ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('exclusive')}
          size="xs"
          data-test-subj="pieVisExclusiveButton"
        >
          {i18n.translate('explore.vis.pieChart.tabs.exclusive', {
            defaultMessage: 'Pie',
          })}
        </EuiButtonEmpty>
        {expandedPanels.exclusive && (
          <PieExclusiveVisOptions
            styles={styleOptions.exclusive}
            onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
          />
        )}
      </EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
