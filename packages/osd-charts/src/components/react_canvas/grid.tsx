import React from 'react';
import { Group, Line } from 'react-konva';
import { AxisLinePosition } from '../../lib/axes/axis_utils';
import { DEFAULT_GRID_LINE_CONFIG, GridLineConfig, mergeWithDefaultGridLineConfig } from '../../lib/themes/theme';
import { Dimensions } from '../../lib/utils/dimensions';

interface GridProps {
  chartDimensions: Dimensions;
  debug: boolean;
  gridLineStyle: GridLineConfig | undefined;
  linesPositions: AxisLinePosition[];
}

export class Grid extends React.PureComponent<GridProps> {
  render() {
    return this.renderGrid();
  }
  private renderGridLine = (linePosition: AxisLinePosition, i: number) => {
    const { gridLineStyle } = this.props;

    const config = gridLineStyle ? mergeWithDefaultGridLineConfig(gridLineStyle) : DEFAULT_GRID_LINE_CONFIG;

    return <Line {...config} key={`tick-${i}`} points={linePosition} />;
  };

  private renderGrid = () => {
    const { chartDimensions, linesPositions } = this.props;

    return (
      <Group x={chartDimensions.left} y={chartDimensions.top}>
        <Group key="grid-lines">{linesPositions.map(this.renderGridLine)}</Group>
      </Group>
    );
  };
}
