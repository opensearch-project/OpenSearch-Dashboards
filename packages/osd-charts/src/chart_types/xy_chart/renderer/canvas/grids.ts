import { AxisLinePosition, isVerticalGrid } from '../../utils/axis_utils';
import { mergeGridLineConfigs, Theme } from '../../../../utils/themes/theme';
import { Dimensions } from '../../../../utils/dimensions';
import { AxisId } from '../../../../utils/ids';
import { AxisSpec } from '../../../../chart_types/xy_chart/utils/specs';
import { getSpecsById } from '../../state/utils';
import { renderMultiLine, MIN_STROKE_WIDTH } from './primitives/line';
import { Line, Stroke } from '../../../../geoms/types';
import { stringToRGB } from '../../../partition_chart/layout/utils/d3_utils';
import { withContext } from '../../../../renderers/canvas';

interface GridProps {
  chartTheme: Theme;
  axesGridLinesPositions: Map<AxisId, AxisLinePosition[]>;
  axesSpecs: AxisSpec[];
  chartDimensions: Dimensions;
}

export function renderGrids(ctx: CanvasRenderingContext2D, props: GridProps) {
  const { axesGridLinesPositions, axesSpecs, chartDimensions, chartTheme } = props;
  withContext(ctx, (ctx) => {
    ctx.translate(chartDimensions.left, chartDimensions.top);
    axesGridLinesPositions.forEach((axisGridLinesPositions, axisId) => {
      const axisSpec = getSpecsById<AxisSpec>(axesSpecs, axisId);
      if (axisSpec && axisGridLinesPositions.length > 0) {
        const themeConfig = isVerticalGrid(axisSpec.position)
          ? chartTheme.axes.gridLineStyle.vertical
          : chartTheme.axes.gridLineStyle.horizontal;

        const axisSpecConfig = axisSpec.gridLineStyle;
        const gridLineStyle = axisSpecConfig ? mergeGridLineConfigs(axisSpecConfig, themeConfig) : themeConfig;
        if (!gridLineStyle.stroke || !gridLineStyle.strokeWidth || gridLineStyle.strokeWidth < MIN_STROKE_WIDTH) {
          return;
        }
        const strokeColor = stringToRGB(gridLineStyle.stroke);
        strokeColor.opacity =
          gridLineStyle.opacity !== undefined ? strokeColor.opacity * gridLineStyle.opacity : strokeColor.opacity;
        const stroke: Stroke = {
          color: strokeColor,
          width: gridLineStyle.strokeWidth,
          dash: gridLineStyle.dash,
        };
        const lines = axisGridLinesPositions.map<Line>((position) => {
          return {
            x1: position[0],
            y1: position[1],
            x2: position[2],
            y2: position[3],
          };
        });
        renderMultiLine(ctx, lines, stroke);
      }
    });
  });
}
