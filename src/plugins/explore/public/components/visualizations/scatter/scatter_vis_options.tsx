/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { VisColumn, FieldSetting, AxisRole, StandardAxes, Positions } from '../types';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/standard_axes_options';

export interface ScatterVisStyleControlsProps {
  styleOptions: ScatterChartStyleControls;
  onStyleChange: (newOptions: Partial<ScatterChartStyleControls>) => void;
  numericalColumns?: VisColumn[];
  categoricalColumns?: VisColumn[];
  dateColumns?: VisColumn[];
}

export const ScatterVisStyleControls: React.FC<ScatterVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const updateStyleOption = <K extends keyof ScatterChartStyleControls>(
    key: K,
    value: ScatterChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  function interAxesFromColumns(
    numerical?: DiscoverVisColumn[],
    categorical?: DiscoverVisColumn[]
  ): { x: FieldSetting | undefined; y: FieldSetting | undefined } {
    if (numerical?.length === 2 && categorical?.length === 0) {
      return {
        x: {
          default: numerical[0],
        },
        y: {
          default: numerical[1],
        },
      };
    }
    if (numerical?.length === 2 && categorical?.length === 1) {
      return {
        x: {
          default: numerical[0],
        },
        y: { default: numerical[1] },
      };
    }

    if (numerical?.length === 3 && categorical?.length === 1) {
      return {
        x: {
          default: numerical[0],
          options: numerical,
        },
        y: { default: numerical[1], options: numerical },
      };
    }
    return { x: undefined, y: undefined };
  }

  useEffect(() => {
    const { x, y } = interAxesFromColumns(numericalColumns, categoricalColumns);
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

  function swapAxes(axes: StandardAxes[]) {
    return axes.map((axis) => {
      if (axis.axisRole === AxisRole.Y) {
        return {
          ...axis,
          axisRole: AxisRole.X,
          position:
            axis.position === Positions.LEFT
              ? Positions.BOTTOM
              : axis.position === Positions.RIGHT
              ? Positions.TOP
              : axis.position,
        };
      }

      if (axis.axisRole === AxisRole.X) {
        return {
          ...axis,
          axisRole: AxisRole.Y,
          position:
            axis.position === Positions.BOTTOM
              ? Positions.LEFT
              : axis.position === Positions.TOP
              ? Positions.RIGHT
              : axis.position,
        };
      }
      return axis;
    });
  }

  const handleChangeSwitchAxes = (axes: StandardAxes[]) => {
    const updateAxes = swapAxes(axes);
    updateStyleOption('StandardAxes', updateAxes);
  };

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'basic',
      name: i18n.translate('explore.vis.scatterChart.tabs.basic', {
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
      name: i18n.translate('explore.vis.scatterChart.tabs.exclusive', {
        defaultMessage: 'Exclusive',
      }),
      content: (
        <ScatterExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      ),
    },
    {
      id: 'axes',
      name: i18n.translate('explore.vis.lineChart.tabs.axes', {
        defaultMessage: 'Axes',
      }),
      content: (
        <AllAxesOptions
          disableGrid={false}
          standardAxes={styleOptions.StandardAxes}
          onChangeSwitchAxes={handleChangeSwitchAxes}
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
