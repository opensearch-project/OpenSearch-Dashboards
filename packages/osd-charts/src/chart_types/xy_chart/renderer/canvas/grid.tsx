import React from 'react';
import { Group, Line } from 'react-konva';
import { connect } from 'react-redux';
import { AxisLinePosition, isVerticalGrid } from '../../utils/axis_utils';
import { GridLineConfig, mergeGridLineConfigs, Theme } from '../../../../utils/themes/theme';
import { Dimensions } from '../../../../utils/dimensions';
import { AxisId } from '../../../../utils/ids';
import { AxisSpec } from '../../../../chart_types/xy_chart/utils/specs';
import { GlobalChartState } from '../../../../state/chart_state';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { getAxisSpecsSelector } from '../../state/selectors/get_specs';
import { computeAxisVisibleTicksSelector } from '../../state/selectors/compute_axis_visible_ticks';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { LIGHT_THEME } from '../../../../utils/themes/light_theme';
import { getSpecsById } from '../../state/utils';

interface GridProps {
  chartTheme: Theme;
  axesGridLinesPositions: Map<AxisId, AxisLinePosition[]>;
  axesSpecs: AxisSpec[];
  chartDimensions: Dimensions;
}

class GridComponent extends React.PureComponent<GridProps> {
  render() {
    const { axesGridLinesPositions, axesSpecs, chartDimensions, chartTheme } = this.props;
    const gridComponents: JSX.Element[] = [];
    axesGridLinesPositions.forEach((axisGridLinesPositions, axisId) => {
      const axisSpec = getSpecsById<AxisSpec>(axesSpecs, axisId);
      if (axisSpec && axisGridLinesPositions.length > 0) {
        const themeConfig = isVerticalGrid(axisSpec.position)
          ? chartTheme.axes.gridLineStyle.vertical
          : chartTheme.axes.gridLineStyle.horizontal;

        const axisSpecConfig = axisSpec.gridLineStyle;
        const gridLineStyle = axisSpecConfig ? mergeGridLineConfigs(axisSpecConfig, themeConfig) : themeConfig;
        gridComponents.push(
          <Group key={`axis-grid-${axisId}`} x={chartDimensions.left} y={chartDimensions.top}>
            <Group key="grid-lines">
              {axisGridLinesPositions.map((linePosition, index) => {
                return this.renderGridLine(linePosition, index, gridLineStyle);
              })}
            </Group>
          </Group>,
        );
      }
    });

    return gridComponents;
  }
  private renderGridLine = (linePosition: AxisLinePosition, i: number, gridLineStyle?: GridLineConfig) => {
    return <Line {...gridLineStyle} key={`tick-${i}`} points={linePosition} />;
  };
}

const mapStateToProps = (state: GlobalChartState): GridProps => {
  if (!state.specsInitialized) {
    return {
      chartTheme: LIGHT_THEME,
      chartDimensions: {
        width: 0,
        left: 0,
        top: 0,
        height: 0,
      },
      axesSpecs: [],
      axesGridLinesPositions: new Map(),
    };
  }
  return {
    chartTheme: getChartThemeSelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    axesSpecs: getAxisSpecsSelector(state),
    axesGridLinesPositions: computeAxisVisibleTicksSelector(state).axisGridLinesPositions,
  };
};

export const Grid = connect(mapStateToProps)(GridComponent);
