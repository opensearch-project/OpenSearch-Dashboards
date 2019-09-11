import React from 'react';
import { Group, Line } from 'react-konva';
import { AxisLinePosition } from '../../chart_types/xy_chart/utils/axis_utils';
import { GridLineConfig } from '../../utils/themes/theme';
import { Dimensions } from '../../utils/dimensions';

interface GridProps {
  chartDimensions: Dimensions;
  debug: boolean;
  gridLineStyle: GridLineConfig;
  linesPositions: AxisLinePosition[];
}

export class Grid extends React.PureComponent<GridProps> {
  render() {
    return this.renderGrid();
  }
  private renderGridLine = (linePosition: AxisLinePosition, i: number) => {
    const { gridLineStyle } = this.props;

    return <Line {...gridLineStyle} key={`tick-${i}`} points={linePosition} />;
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
