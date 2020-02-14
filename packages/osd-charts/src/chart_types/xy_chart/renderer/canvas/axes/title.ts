import { AxisProps } from '.';
import { isHorizontalAxis } from '../../../utils/axis_utils';
import { renderDebugRect } from '../utils/debug';
import { renderText } from '../primitives/text';
import { Position } from '../../../../../utils/commons';
import { Font, FontStyle } from '../../../../partition_chart/layout/types/types';

export function renderTitle(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    axisSpec: { title, position },
  } = props;
  if (!title) {
    return null;
  }
  if (isHorizontalAxis(position)) {
    return renderHorizontalTitle(ctx, props);
  }
  return renderVerticalTitle(ctx, props);
}

function renderVerticalTitle(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    axisPosition: { height },
    axisSpec: { title, position, tickSize, tickPadding },
    axisTicksDimensions: { maxLabelTextWidth },
    axisConfig: { axisTitleStyle },
    debug,
  } = props;
  if (!title) {
    return null;
  }
  const { padding, ...titleStyle } = axisTitleStyle;
  const top = height;
  const left = position === Position.Left ? 0 : tickSize + tickPadding + maxLabelTextWidth + padding;

  if (debug) {
    renderDebugRect(ctx, { x: left, y: top, width: height, height: titleStyle.fontSize }, undefined, undefined, -90);
  }

  const font: Font = {
    fontFamily: titleStyle.fontFamily,
    fontVariant: 'normal',
    fontStyle: titleStyle.fontStyle ? (titleStyle.fontStyle as FontStyle) : 'normal',
    fontWeight: 'normal',
  };
  renderText(
    ctx,
    {
      x: left + titleStyle.fontSize / 2,
      y: top - height / 2,
    },
    title,
    { ...font, fill: titleStyle.fill, align: 'center', baseline: 'middle', fontSize: titleStyle.fontSize },
    -90,
  );
}
function renderHorizontalTitle(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    axisPosition: { width },
    axisSpec: { title, position, tickSize, tickPadding },
    axisTicksDimensions: { maxLabelBboxHeight },
    axisConfig: {
      axisTitleStyle: { padding, ...titleStyle },
    },
    debug,
  } = props;

  if (!title) {
    return;
  }

  const top = position === Position.Top ? 0 : maxLabelBboxHeight + tickPadding + tickSize + padding;

  const left = 0;
  if (debug) {
    renderDebugRect(ctx, { x: left, y: top, width, height: titleStyle.fontSize });
  }
  const font: Font = {
    fontFamily: titleStyle.fontFamily,
    fontVariant: 'normal',
    fontStyle: titleStyle.fontStyle ? (titleStyle.fontStyle as FontStyle) : 'normal',
    fontWeight: 'normal',
  };
  renderText(
    ctx,
    {
      x: left + width / 2,
      y: top + titleStyle.fontSize / 2,
    },
    title,
    {
      ...font,
      fill: titleStyle.fill,
      align: 'center',
      baseline: 'middle',
      fontSize: titleStyle.fontSize,
    },
  );
}
