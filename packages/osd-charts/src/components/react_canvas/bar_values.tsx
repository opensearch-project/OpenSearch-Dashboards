import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { BarGeometry } from '../../lib/series/rendering';
import { Rotation } from '../../lib/series/specs';
import { DisplayValueStyle } from '../../lib/themes/theme';
import { Dimensions } from '../../lib/utils/dimensions';
import { buildBarValueProps } from './utils/rendering_props_utils';

interface BarValuesProps {
  chartDimensions: Dimensions;
  chartRotation: Rotation;
  debug: boolean;
  bars: BarGeometry[];
  displayValueStyle: DisplayValueStyle;
}

export class BarValues extends React.PureComponent<BarValuesProps> {
  render() {
    const { chartDimensions } = this.props;

    return (
      <Group x={chartDimensions.left} y={chartDimensions.top}>
        {this.renderBarValues()}
      </Group>
    );
  }

  private renderBarValues = () => {
    const { bars, displayValueStyle, debug, chartRotation, chartDimensions } = this.props;
    return bars.map((bar, index) => {
      const { displayValue, x, y, height, width } = bar;
      if (!displayValue) {
        return;
      }

      const key = `bar-value-${index}`;
      const displayValueProps = buildBarValueProps({
        x,
        y,
        barHeight: height,
        barWidth: width,
        displayValueStyle,
        displayValue,
        chartRotation,
        chartDimensions,
      });

      const debugProps = {
        ...displayValueProps,
        stroke: 'violet',
        strokeWidth: 1,
        fill: 'transparent',
      };

      return (
        <Group key={key}>
          {debug && <Rect {...debugProps} />}
          {displayValue && <Text {...displayValueProps} />}
        </Group>
      );
    });
  };
}
