import { AxisTick, AxisTicksDimensions } from '../../../utils/axis_utils';
import { AxisSpec } from '../../../utils/specs';
import { AxisConfig } from '../../../../../utils/themes/theme';
import { Dimensions } from '../../../../../utils/dimensions';
import { AxisId } from '../../../../../utils/ids';
import { getSpecsById } from '../../../state/utils';
import { withContext } from '../../../../../renderers/canvas';
import { renderDebugRect } from '../utils/debug';
import { renderTitle } from './title';
import { renderLine } from './line';
import { renderTickLabel } from './tick_label';
import { renderTick } from './tick';

export interface AxisProps {
  axisConfig: AxisConfig;
  axisSpec: AxisSpec;
  axisTicksDimensions: AxisTicksDimensions;
  axisPosition: Dimensions;
  ticks: AxisTick[];
  debug: boolean;
  chartDimensions: Dimensions;
}
export interface AxesProps {
  axesVisibleTicks: Map<AxisId, AxisTick[]>;
  axesSpecs: AxisSpec[];
  axesTicksDimensions: Map<AxisId, AxisTicksDimensions>;
  axesPositions: Map<string, Dimensions>;
  axisStyle: AxisConfig;
  debug: boolean;
  chartDimensions: Dimensions;
}

export function renderAxes(ctx: CanvasRenderingContext2D, props: AxesProps) {
  const { axesVisibleTicks, axesSpecs, axesTicksDimensions, axesPositions, axisStyle, debug, chartDimensions } = props;
  axesVisibleTicks.forEach((ticks, axisId) => {
    const axisSpec = getSpecsById<AxisSpec>(axesSpecs, axisId);
    const axisTicksDimensions = axesTicksDimensions.get(axisId);
    const axisPosition = axesPositions.get(axisId);
    if (!ticks || !axisSpec || !axisTicksDimensions || !axisPosition) {
      return;
    }
    renderAxis(ctx, {
      axisSpec,
      axisTicksDimensions,
      axisPosition,
      ticks,
      axisConfig: axisStyle,
      debug,
      chartDimensions,
    });
  });
}

function renderAxis(ctx: CanvasRenderingContext2D, props: AxisProps) {
  withContext(ctx, (ctx) => {
    const { ticks, axisPosition, debug } = props;
    ctx.translate(axisPosition.left, axisPosition.top);
    if (debug) {
      renderDebugRect(ctx, {
        x: 0,
        y: 0,
        width: axisPosition.width,
        height: axisPosition.height,
      });
    }

    withContext(ctx, (ctx) => {
      renderLine(ctx, props);
    });
    withContext(ctx, (ctx) => {
      ticks.map((tick) => {
        renderTick(ctx, tick, props);
      });
    });
    withContext(ctx, (ctx) => {
      ticks
        .filter((tick) => tick.label !== null)
        .map((tick) => {
          renderTickLabel(ctx, tick, props);
        });
    });
    withContext(ctx, (ctx) => {
      renderTitle(ctx, props);
    });
  });
}
