/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { StandardAxes, AxisRole } from '../types';
import {
  HeatmapLabelVisOptions,
  HeatmapExclusiveVisOptions,
} from './heatmap_exclusive_vis_options';
import { inferAxesFromColumns } from './heatmap_chart_utils';
import { AllAxesOptions } from '../style_panel/standard_axes_options';
import { swapAxes } from '../utils/utils';
import { StyleControlsProps } from '../utils/use_visualization_types';

export type HeatmapVisStyleControlsProps = StyleControlsProps<HeatmapChartStyleControls>;

export const HeatmapVisStyleControls: React.FC<HeatmapVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const shouldShowType = numericalColumns.length === 3;
  const updateStyleOption = <K extends keyof HeatmapChartStyleControls>(
    key: K,
    value: HeatmapChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  useEffect(() => {
    const { x, y } = inferAxesFromColumns(numericalColumns, categoricalColumns);
    const axesWithFields = styleOptions.StandardAxes.map((axis) => {
      if (axis.axisRole === AxisRole.X) {
        return { ...axis, field: x };
      }
      if (axis.axisRole === AxisRole.Y) {
        return { ...axis, field: y };
      }
      return axis;
    });

    updateStyleOption('StandardAxes', axesWithFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericalColumns, categoricalColumns, dateColumns]);

  const handleSwitchAxes = (axes: StandardAxes[]) => {
    const updateAxes = swapAxes(axes);
    updateStyleOption('StandardAxes', updateAxes);
  };

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'basic',
      name: i18n.translate('explore.vis.heatmapChart.tabs.basic', {
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
      name: i18n.translate('explore.vis.heatmapChart.tabs.exclusive', {
        defaultMessage: 'Exclusive',
      }),
      content: (
        <HeatmapExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      ),
    },
    {
      id: 'label',
      name: i18n.translate('explore.vis.heatmapChart.tabs.label', {
        defaultMessage: 'Label',
      }),
      content: (
        <HeatmapLabelVisOptions
          shouldShowType={shouldShowType}
          styles={styleOptions.label}
          onChange={(label) => updateStyleOption('label', label)}
        />
      ),
    },
    {
      id: 'axes',
      name: i18n.translate('explore.vis.heatmapChart.tabs.axes', {
        defaultMessage: 'Axes',
      }),
      content: (
        <AllAxesOptions
          disableGrid={true}
          standardAxes={styleOptions.StandardAxes}
          onChangeSwitchAxes={handleSwitchAxes}
          onStandardAxesChange={(standardAxes) => updateStyleOption('StandardAxes', standardAxes)}
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
