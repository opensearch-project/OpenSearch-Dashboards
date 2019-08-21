import React from 'react';
import { Group, Line, Rect, Text } from 'react-konva';
import {
  AxisTick,
  AxisTicksDimensions,
  centerRotationOrigin,
  getHorizontalAxisTickLineProps,
  getTickLabelProps,
  getVerticalAxisTickLineProps,
  isHorizontal,
  isVertical,
} from '../../chart_types/xy_chart/utils/axis_utils';
import { AxisSpec, Position } from '../../chart_types/xy_chart/utils/specs';
import { Theme } from '../../utils/themes/theme';
import { Dimensions } from '../../utils/dimensions';

interface AxisProps {
  chartTheme: Theme;
  axisSpec: AxisSpec;
  axisTicksDimensions: AxisTicksDimensions;
  axisPosition: Dimensions;
  ticks: AxisTick[];
  debug: boolean;
  chartDimensions: Dimensions;
}

export class Axis extends React.PureComponent<AxisProps> {
  render() {
    return this.renderAxis();
  }

  private renderAxis = () => {
    const { ticks, axisPosition, debug } = this.props;
    return (
      <Group x={axisPosition.left} y={axisPosition.top}>
        {debug && (
          <Rect
            x={0}
            y={0}
            width={axisPosition.width}
            height={axisPosition.height}
            stroke="black"
            strokeWidth={1}
            fill="violet"
            opacity={0.2}
          />
        )}
        <Group key="lines">{this.renderAxisLine()}</Group>
        <Group key="tick-lines">{ticks.map(this.renderTickLine)}</Group>
        <Group key="ticks">{ticks.filter((tick) => tick.label !== null).map(this.renderTickLabel)}</Group>
        {this.renderAxisTitle()}
      </Group>
    );
  };
  private renderAxisLine = () => {
    const {
      axisSpec: { position },
      axisPosition,
      chartTheme: {
        axes: { axisLineStyle },
      },
    } = this.props;
    const lineProps: number[] = [];
    if (isVertical(position)) {
      lineProps[0] = position === Position.Left ? axisPosition.width : 0;
      lineProps[2] = position === Position.Left ? axisPosition.width : 0;
      lineProps[1] = 0;
      lineProps[3] = axisPosition.height;
    } else {
      lineProps[0] = 0;
      lineProps[2] = axisPosition.width;
      lineProps[1] = position === Position.Top ? axisPosition.height : 0;
      lineProps[3] = position === Position.Top ? axisPosition.height : 0;
    }
    return <Line points={lineProps} {...axisLineStyle} />;
  };
  private renderTickLine = (tick: AxisTick, i: number) => {
    const {
      axisSpec: { tickSize, position },
      axisPosition,
      chartTheme: {
        axes: { tickLineStyle },
      },
    } = this.props;

    const lineProps = isVertical(position)
      ? getVerticalAxisTickLineProps(position, axisPosition.width, tickSize, tick.position)
      : getHorizontalAxisTickLineProps(position, axisPosition.height, tickSize, tick.position);

    return <Line {...tickLineStyle} key={`tick-${i}`} points={lineProps} />;
  };
  private renderTickLabel = (tick: AxisTick, i: number) => {
    /**
     * padding is already computed through width
     * and bbox_calculator using tickLabelPadding
     * set padding to 0 to avoid conflict
     */
    const labelStyle = {
      ...this.props.chartTheme.axes.tickLabelStyle,
      padding: 0,
    };

    const {
      axisSpec: { tickSize, tickPadding, position },
      axisTicksDimensions,
      axisPosition,
      debug,
    } = this.props;

    const tickLabelRotation = this.props.axisSpec.tickLabelRotation || 0;

    const tickLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tick.position,
      position,
      axisPosition,
      axisTicksDimensions,
    );

    const { maxLabelTextWidth, maxLabelTextHeight } = axisTicksDimensions;

    const centeredRectProps = centerRotationOrigin(axisTicksDimensions, {
      x: tickLabelProps.x,
      y: tickLabelProps.y,
    });

    const textProps = {
      width: maxLabelTextWidth,
      height: maxLabelTextHeight,
      rotation: tickLabelRotation,
      ...tickLabelProps,
      ...centeredRectProps,
    };

    return (
      <Group key={`tick-${i}`}>
        {debug && <Rect {...textProps} stroke="black" strokeWidth={1} fill="violet" opacity={0.2} />}
        <Text {...textProps} {...labelStyle} text={tick.label} />
      </Group>
    );
  };
  private renderAxisTitle() {
    const {
      axisSpec: { title, position },
    } = this.props;
    if (!title) {
      return null;
    }
    if (isHorizontal(position)) {
      return this.renderHorizontalAxisTitle();
    }
    return this.renderVerticalAxisTitle();
  }
  private renderVerticalAxisTitle() {
    const {
      axisPosition: { height },
      axisSpec: { title, position, tickSize, tickPadding },
      axisTicksDimensions: { maxLabelBboxWidth },
      chartTheme: {
        axes: { axisTitleStyle },
      },
      debug,
    } = this.props;
    if (!title) {
      return null;
    }
    const { padding, ...titleStyle } = axisTitleStyle;
    const top = height;
    const left = position === Position.Left ? 0 : tickSize + tickPadding + maxLabelBboxWidth + padding;

    return (
      <Group>
        {debug && (
          <Rect
            x={left}
            y={top}
            width={height}
            height={titleStyle.fontSize}
            fill="violet"
            stroke="black"
            strokeWidth={1}
            opacity={0.2}
            rotation={-90}
          />
        )}
        <Text align="center" x={left} y={top} text={title} width={height} rotation={-90} {...titleStyle} />
      </Group>
    );
  }
  private renderHorizontalAxisTitle() {
    const {
      axisPosition: { width, height },
      axisSpec: { title, position, tickSize, tickPadding },
      axisTicksDimensions: { maxLabelBboxHeight },
      chartTheme: {
        axes: {
          axisTitleStyle: { padding, ...titleStyle },
        },
      },
      debug,
    } = this.props;

    if (!title) {
      return;
    }

    const top = position === Position.Top ? 0 : maxLabelBboxHeight + tickPadding + tickSize + padding;

    const left = 0;
    return (
      <Group>
        {debug && (
          <Rect
            x={left}
            y={top}
            width={width}
            height={titleStyle.fontSize}
            stroke="black"
            strokeWidth={1}
            fill="violet"
            opacity={0.2}
          />
        )}
        <Text align="center" x={left} y={top} width={width} height={height} text={title} {...titleStyle} />
      </Group>
    );
  }
}
