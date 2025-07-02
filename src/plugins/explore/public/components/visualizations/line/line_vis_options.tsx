/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { LineChartStyleControls } from './line_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { ThresholdOptions } from '../style_panel/threshold/threshold';
import { LineExclusiveVisOptions } from './exclusive_style';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesOptions } from '../style_panel/axes/axes';
import { GridOptionsPanel } from '../style_panel/grid/grid';

export type LineVisStyleControlsProps = StyleControlsProps<LineChartStyleControls>;

export const LineVisStyleControls: React.FC<LineVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const updateStyleOption = <K extends keyof LineChartStyleControls>(
    key: K,
    value: LineChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const notShowLegend =
    (numericalColumns.length === 1 &&
      categoricalColumns.length === 0 &&
      dateColumns.length === 1) ||
    (numericalColumns.length === 1 && categoricalColumns.length === 1 && dateColumns.length === 0);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <LegendOptionsPanel
          shouldShowLegend={!notShowLegend}
          legendOptions={{
            show: styleOptions.addLegend,
            position: styleOptions.legendPosition,
          }}
          onLegendOptionsChange={(legendOptions) => {
            if (legendOptions.show !== undefined) {
              updateStyleOption('addLegend', legendOptions.show);
            }
            if (legendOptions.position !== undefined) {
              updateStyleOption('legendPosition', legendOptions.position);
            }
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <ThresholdOptions
          thresholdLines={styleOptions.thresholdLines}
          onThresholdLinesChange={(thresholdLines) =>
            updateStyleOption('thresholdLines', thresholdLines)
          }
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
      <EuiFlexItem grow={false}>
        <AxesOptions
          categoryAxes={styleOptions.categoryAxes}
          valueAxes={styleOptions.valueAxes}
          onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
          onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <GridOptionsPanel
          grid={styleOptions.grid}
          onGridChange={(grid) => updateStyleOption('grid', grid)}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <LineExclusiveVisOptions
          addTimeMarker={styleOptions.addTimeMarker}
          lineStyle={styleOptions.lineStyle}
          lineMode={styleOptions.lineMode}
          lineWidth={styleOptions.lineWidth}
          onAddTimeMarkerChange={(addTimeMarker) =>
            updateStyleOption('addTimeMarker', addTimeMarker)
          }
          onLineModeChange={(lineMode) => updateStyleOption('lineMode', lineMode)}
          onLineWidthChange={(lineWidth) => updateStyleOption('lineWidth', lineWidth)}
          onLineStyleChange={(lineStyle) => updateStyleOption('lineStyle', lineStyle)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
  //   <EuiSplitPanel.Outer>
  //     <EuiSplitPanel.Inner paddingSize="s">
  //       <EuiButtonEmpty
  //         iconSide="left"
  //         color="text"
  //         iconType={expandedPanels.exclusive ? 'arrowDown' : 'arrowRight'}
  //         onClick={() => togglePanel('general')}
  //         size="xs"
  //         data-test-subj="lineVisGeneralButton"
  //       >
  //         {i18n.translate('explore.vis.lineChart.tabs.general', {
  //           defaultMessage: 'General',
  //         })}
  //       </EuiButtonEmpty>
  //       {expandedPanels.general && (
  //         <ChartTypeSwitcher
  //           availableChartTypes={availableChartTypes}
  //           selectedChartType={selectedChartType}
  //           onChartTypeChange={onChartTypeChange}
  //         />
  //       )}
  //     </EuiSplitPanel.Inner>

  //     <EuiSplitPanel.Inner paddingSize="s">
  //       <EuiButtonEmpty
  //         iconSide="left"
  //         color="text"
  //         iconType={expandedPanels.basic ? 'arrowDown' : 'arrowRight'}
  //         onClick={() => togglePanel('basic')}
  //         size="xs"
  //         data-test-subj="lineVisBasicButton"
  //       >
  //         {i18n.translate('explore.vis.lineChart.tabs.basic', {
  //           defaultMessage: 'Basic',
  //         })}
  //       </EuiButtonEmpty>
  //       {expandedPanels.basic && (
  //         <GeneralVisOptions
  //           shouldShowLegend={!notShowLegend}
  //           addTooltip={styleOptions.addTooltip}
  //           addLegend={styleOptions.addLegend}
  //           legendPosition={styleOptions.legendPosition}
  //           onAddTooltipChange={(addTooltip) => updateStyleOption('addTooltip', addTooltip)}
  //           onAddLegendChange={(addLegend) => updateStyleOption('addLegend', addLegend)}
  //           onLegendPositionChange={(legendPosition) =>
  //             updateStyleOption('legendPosition', legendPosition)
  //           }
  //         />
  //       )}
  //     </EuiSplitPanel.Inner>

  //     <EuiSplitPanel.Inner paddingSize="s">
  //       <EuiButtonEmpty
  //         iconSide="left"
  //         color="text"
  //         iconType={expandedPanels.exclusive ? 'arrowDown' : 'arrowRight'}
  //         onClick={() => togglePanel('exclusive')}
  //         size="xs"
  //         data-test-subj="lineVisExclusiveButton"
  //       >
  //         {i18n.translate('explore.vis.lineChart.tabs.exclusive', {
  //           defaultMessage: 'Exclusive',
  //         })}
  //       </EuiButtonEmpty>
  //       {expandedPanels.exclusive && (
  //         <BasicVisOptions
  //           addTimeMarker={styleOptions.addTimeMarker}
  //           showLine={styleOptions.showLine}
  //           lineMode={styleOptions.lineMode}
  //           lineWidth={styleOptions.lineWidth}
  //           showDots={styleOptions.showDots}
  //           onAddTimeMarkerChange={(addTimeMarker) =>
  //             updateStyleOption('addTimeMarker', addTimeMarker)
  //           }
  //           onShowLineChange={(showLine) => updateStyleOption('showLine', showLine)}
  //           onLineModeChange={(lineMode) => updateStyleOption('lineMode', lineMode)}
  //           onLineWidthChange={(lineWidth) => updateStyleOption('lineWidth', lineWidth)}
  //           onShowDotsChange={(showDots) => updateStyleOption('showDots', showDots)}
  //         />
  //       )}
  //     </EuiSplitPanel.Inner>

  //     <EuiSplitPanel.Inner paddingSize="s">
  //       <EuiButtonEmpty
  //         iconSide="left"
  //         color="text"
  //         iconType={expandedPanels.threshold ? 'arrowDown' : 'arrowRight'}
  //         onClick={() => togglePanel('threshold')}
  //         size="xs"
  //         data-test-subj="lineVisThresholdButton"
  //       >
  //         {i18n.translate('explore.vis.lineChart.tabs.threshold', {
  //           defaultMessage: 'Threshold',
  //         })}
  //       </EuiButtonEmpty>
  //       {expandedPanels.threshold && (
  //         <ThresholdOptions
  //           thresholdLine={styleOptions.thresholdLine}
  //           onThresholdChange={(thresholdLine) => updateStyleOption('thresholdLine', thresholdLine)}
  //         />
  //       )}
  //     </EuiSplitPanel.Inner>

  //     <EuiSplitPanel.Inner paddingSize="s">
  //       <EuiButtonEmpty
  //         iconSide="left"
  //         color="text"
  //         iconType={expandedPanels.grid ? 'arrowDown' : 'arrowRight'}
  //         onClick={() => togglePanel('grid')}
  //         size="xs"
  //         data-test-subj="lineVisGridButton"
  //       >
  //         {i18n.translate('explore.vis.lineChart.tabs.grid', {
  //           defaultMessage: 'Grid',
  //         })}
  //       </EuiButtonEmpty>
  //       {expandedPanels.grid && (
  //         <GridOptionsPanel
  //           grid={styleOptions.grid}
  //           onGridChange={(grid) => updateStyleOption('grid', grid)}
  //         />
  //       )}
  //     </EuiSplitPanel.Inner>

  //     <EuiSplitPanel.Inner paddingSize="s">
  //       <EuiButtonEmpty
  //         iconSide="left"
  //         color="text"
  //         iconType={expandedPanels.axes ? 'arrowDown' : 'arrowRight'}
  //         onClick={() => togglePanel('axes')}
  //         size="xs"
  //         data-test-subj="lineVisAxesButton"
  //       >
  //         {i18n.translate('explore.vis.lineChart.tabs.axes', {
  //           defaultMessage: 'Axes',
  //         })}
  //       </EuiButtonEmpty>
  //       {expandedPanels.axes && (
  //         <AxesOptions
  //           categoryAxes={styleOptions.categoryAxes}
  //           valueAxes={styleOptions.valueAxes}
  //           onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
  //           onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
  //           numericalColumns={numericalColumns}
  //           categoricalColumns={categoricalColumns}
  //           dateColumns={dateColumns}
  //         />
  //       )}
  //     </EuiSplitPanel.Inner>
  //   </EuiSplitPanel.Outer>
  // );
};
