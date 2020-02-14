import { isVerticalAxis } from '../../../utils/axis_utils';
import { AxisProps } from '.';
import { Position } from '../../../../../utils/commons';

export function renderLine(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    axisSpec: { position },
    axisPosition,
    axisConfig: { axisLineStyle },
  } = props;
  const lineProps: number[] = [];
  if (isVerticalAxis(position)) {
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
  ctx.beginPath();
  ctx.moveTo(lineProps[0], lineProps[1]);
  ctx.lineTo(lineProps[2], lineProps[3]);
  ctx.strokeStyle = axisLineStyle.stroke;
  ctx.lineWidth = axisLineStyle.strokeWidth;
  ctx.stroke();
}
