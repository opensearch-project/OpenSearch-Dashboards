import { AxisTick, getTickLabelProps } from '../../../utils/axis_utils';
import { AxisProps } from '.';
import { renderText } from '../primitives/text';
import { renderDebugRectCenterRotated } from '../utils/debug';
import { Font, FontStyle } from '../../../../partition_chart/layout/types/types';
import { withContext } from '../../../../../renderers/canvas';

export function renderTickLabel(ctx: CanvasRenderingContext2D, tick: AxisTick, props: AxisProps) {
  /**
   * padding is already computed through width
   * and bbox_calculator using tickLabelPadding
   * set padding to 0 to avoid conflict
   */
  const labelStyle = {
    ...props.axisConfig.tickLabelStyle,
    padding: 0,
  };

  const {
    axisSpec: { tickSize, tickPadding, position },
    axisTicksDimensions,
    axisPosition,
    debug,
  } = props;

  const tickLabelRotation = props.axisSpec.tickLabelRotation || 0;

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

  const { x, y, offsetX, offsetY, align, verticalAlign } = tickLabelProps;

  if (debug) {
    renderDebugRectCenterRotated(
      ctx,
      {
        x: x + offsetX,
        y: y + offsetY,
      },
      {
        x: x + offsetX,
        y: y + offsetY,
        height: maxLabelTextHeight,
        width: maxLabelTextWidth,
      },
      undefined,
      undefined,
      tickLabelRotation,
    );
  }
  const font: Font = {
    fontFamily: labelStyle.fontFamily,
    fontStyle: labelStyle.fontStyle ? (labelStyle.fontStyle as FontStyle) : 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
  };
  withContext(ctx, (ctx) => {
    const textOffsetX = tickLabelRotation === 0 ? 0 : offsetX;
    const textOffsetY = tickLabelRotation === 0 ? 0 : offsetY;
    renderText(
      ctx,
      {
        x: x + textOffsetX,
        y: y + textOffsetY,
      },
      tick.label,
      {
        ...font,
        fontSize: labelStyle.fontSize,
        fill: labelStyle.fill,
        align: align as CanvasTextAlign,
        baseline: verticalAlign as CanvasTextBaseline,
      },
      tickLabelRotation,
    );
  });
}
