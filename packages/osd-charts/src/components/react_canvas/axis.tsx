import React from 'react';
import { Group, Line, Rect, Text } from 'react-konva';
import {
  AxisTick, AxisTicksDimensions, centerRotationOrigin,
  getHorizontalAxisTickLineProps, getTickLabelProps,
  getVerticalAxisTickLineProps, isHorizontal, isVertical,
} from '../../lib/axes/axis_utils';
import { AxisSpec, Position } from '../../lib/series/specs';
import { Theme } from '../../lib/themes/theme';
import { Dimensions } from '../../lib/utils/dimensions';

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
  renderTickLabel = (tick: AxisTick, i: number) => {
    const {
      axes: { tickFontFamily, tickFontSize, tickFontStyle },
    } = this.props.chartTheme;
    const {
      axisSpec: {
        tickSize,
        tickPadding,
        position,
      },
      axisTicksDimensions,
      debug,
    } = this.props;

    const tickLabelRotation = this.props.axisSpec.tickLabelRotation || 0;

    const tickLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tick.position,
      position,
      axisTicksDimensions,
    );

    const { maxLabelTextWidth, maxLabelTextHeight } = axisTicksDimensions;
    const centeredRectProps = centerRotationOrigin(axisTicksDimensions, { x: tickLabelProps.x, y: tickLabelProps.y });

    const textProps = {
      width: maxLabelTextWidth,
      height: maxLabelTextHeight,
      rotation: tickLabelRotation,
      ...tickLabelProps,
      ...centeredRectProps,
    };

    return (
      <Group key={`tick-${i}`}>
        {debug && <Rect {...textProps} stroke="black" strokeWidth={1} fill="violet" />}
        <Text
          {...textProps}
          fill="gray"
          fontFamily={tickFontFamily}
          fontSize={tickFontSize}
          fontStyle={tickFontStyle}
          text={tick.label}
        />
      </Group>
    );
  }

  private renderTickLine = (tick: AxisTick, i: number) => {
    const {
      axisSpec: { tickSize, tickPadding, position },
      axisTicksDimensions: { maxLabelBboxHeight },
    } = this.props;

    const lineProps = isVertical(position) ?
      getVerticalAxisTickLineProps(
        position,
        tickPadding,
        tickSize,
        tick.position,
      ) : getHorizontalAxisTickLineProps(
        position,
        tickPadding,
        tickSize,
        tick.position,
        maxLabelBboxHeight,
      );

    return <Line key={`tick-${i}`} points={lineProps} stroke={'gray'} strokeWidth={1} />;
  }
  private renderAxis = () => {
    const { ticks, axisPosition } = this.props;
    return (
      <Group x={axisPosition.left} y={axisPosition.top}>
        <Group key="lines">{this.renderAxisLine()}</Group>
        <Group key="tick-lines">{ticks.map(this.renderTickLine)}</Group>
        <Group key="ticks">
          {ticks.filter((tick) => tick.label !== null).map(this.renderTickLabel)}
        </Group>
        {this.renderAxisTitle()}
      </Group>
    );
  }
  private renderAxisLine = () => {
    const {
      axisSpec: { tickSize, tickPadding, position },
      axisPosition,
      axisTicksDimensions,
    } = this.props;
    const lineProps: number[] = [];
    if (isVertical(position)) {
      lineProps[0] = position === Position.Left ? tickSize + tickPadding : 0;
      lineProps[2] = position === Position.Left ? tickSize + tickPadding : 0;
      lineProps[1] = 0;
      lineProps[3] = axisPosition.height;
    } else {
      lineProps[0] = 0;
      lineProps[2] = axisPosition.width;
      lineProps[1] =
        position === Position.Top ? axisTicksDimensions.maxLabelBboxHeight + tickSize + tickPadding : 0;
      lineProps[3] =
        position === Position.Top ? axisTicksDimensions.maxLabelBboxHeight + tickSize + tickPadding : 0;
    }
    return <Line points={lineProps} stroke={'gray'} strokeWidth={1} />;
  }
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
        axes: { titleFontFamily, titleFontSize, titleFontStyle, titlePadding },
      },
      debug,
    } = this.props;
    if (!title) {
      return null;
    }
    const top = height;
    const left =
      position === Position.Left
        ? -(maxLabelBboxWidth + titleFontSize + titlePadding)
        : tickSize + tickPadding + maxLabelBboxWidth + titlePadding;

    return (
      <Group>
        {debug && (
          <Rect
            x={left}
            y={top}
            width={height}
            height={titleFontSize}
            fill="violet"
            stroke="black"
            strokeWidth={1}
            rotation={-90}
          />
        )}
        <Text
          align="center"
          x={left}
          y={top}
          text={title}
          fill="gray"
          width={height}
          rotation={-90}
          fontFamily={titleFontFamily}
          fontStyle={titleFontStyle}
          fontSize={titleFontSize}
        />
      </Group>
    );
  }
  private renderHorizontalAxisTitle() {
    const {
      axisPosition: { width, height },
      axisSpec: { title, position, tickSize, tickPadding },
      axisTicksDimensions: { maxLabelBboxHeight },
      chartTheme: {
        axes: { titleFontSize, titlePadding },
      },
      debug,
    } = this.props;

    if (!title) {
      return;
    }

    const top = position === Position.Top ?
      -maxLabelBboxHeight - titlePadding :
      maxLabelBboxHeight + tickPadding + tickSize + titlePadding;

    const left = 0;
    return (
      <Group>
        {debug && (
          <Rect
            x={left}
            y={top}
            width={width}
            height={titleFontSize}
            stroke="black"
            strokeWidth={1}
            fill="violet"
          />
        )}
        <Text
          align="center"
          x={left}
          y={top}
          width={width}
          height={height}
          verticalAlign="middle"
          text={title}
          fill="gray"
          fontStyle="bold"
          fontSize={titleFontSize}
        />
      </Group>
    );
  }
}
