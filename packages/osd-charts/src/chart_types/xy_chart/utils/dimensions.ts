import { AxisTicksDimensions } from './axis_utils';
import { AxisSpec, Position } from './specs';
import { Theme } from '../../../utils/themes/theme';
import { AxisId } from '../../../utils/ids';
import { Dimensions } from '../../../utils/dimensions';

/**
 * Compute the chart dimensions. It's computed removing from the parent dimensions
 * the axis spaces, the legend and any other specified style margin and padding.
 * @param parentDimensions the parent dimension
 * @param chartTheme the theme style of the chart
 * @param axisDimensions the axis dimensions
 * @param axisSpecs the axis specs
 * @param showLegend is the legend shown
 * @param legendPosition the optional legend position
 */
export function computeChartDimensions(
  parentDimensions: Dimensions,
  chartTheme: Theme,
  axisDimensions: Map<AxisId, AxisTicksDimensions>,
  axisSpecs: Map<AxisId, AxisSpec>,
): {
  chartDimensions: Dimensions;
  leftMargin: number;
} {
  const { chartMargins, chartPaddings } = chartTheme;
  const { axisTitleStyle } = chartTheme.axes;

  const axisTitleHeight = axisTitleStyle.fontSize + axisTitleStyle.padding;

  let vLeftAxisSpecWidth = 0;
  let vRightAxisSpecWidth = 0;
  let hTopAxisSpecHeight = 0;
  let hBottomAxisSpecHeight = 0;
  let horizontalEdgeLabelOverflow = 0;
  let verticalEdgeLabelOverflow = 0;
  axisDimensions.forEach(({ maxLabelBboxWidth = 0, maxLabelBboxHeight = 0 }, id) => {
    const axisSpec = axisSpecs.get(id);
    if (!axisSpec || axisSpec.hide) {
      return;
    }
    const { position, tickSize, tickPadding, title } = axisSpec;
    const titleHeight = title !== undefined ? axisTitleHeight : 0;
    const maxAxisHeight = maxLabelBboxHeight + tickSize + tickPadding + titleHeight;
    const maxAxisWidth = maxLabelBboxWidth + tickSize + tickPadding + titleHeight;
    switch (position) {
      case Position.Top:
        hTopAxisSpecHeight += maxAxisHeight + chartMargins.top;
        // find the max half label size to accomodate the left/right labels
        horizontalEdgeLabelOverflow = Math.max(horizontalEdgeLabelOverflow, maxLabelBboxWidth / 2);
        break;
      case Position.Bottom:
        hBottomAxisSpecHeight += maxAxisHeight + chartMargins.bottom;
        // find the max half label size to accomodate the left/right labels
        horizontalEdgeLabelOverflow = Math.max(horizontalEdgeLabelOverflow, maxLabelBboxWidth / 2);
        break;
      case Position.Left:
        vLeftAxisSpecWidth += maxAxisWidth + chartMargins.left;
        verticalEdgeLabelOverflow = Math.max(verticalEdgeLabelOverflow, maxLabelBboxHeight / 2);
        break;
      case Position.Right:
        vRightAxisSpecWidth += maxAxisWidth + chartMargins.right;
        verticalEdgeLabelOverflow = Math.max(verticalEdgeLabelOverflow, maxLabelBboxHeight / 2);
        break;
    }
  });
  const chartLeftAxisMaxWidth = Math.max(vLeftAxisSpecWidth, horizontalEdgeLabelOverflow + chartMargins.left);
  const chartRightAxisMaxWidth = Math.max(vRightAxisSpecWidth, horizontalEdgeLabelOverflow + chartMargins.right);
  const chartTopAxisMaxHeight = Math.max(hTopAxisSpecHeight, verticalEdgeLabelOverflow + chartMargins.top);
  const chartBottomAxisMaxHeight = Math.max(hBottomAxisSpecHeight, verticalEdgeLabelOverflow + chartMargins.bottom);

  const chartWidth = parentDimensions.width - chartLeftAxisMaxWidth - chartRightAxisMaxWidth;
  const chartHeight = parentDimensions.height - chartTopAxisMaxHeight - chartBottomAxisMaxHeight;

  let top = chartTopAxisMaxHeight + chartPaddings.top;
  let left = chartLeftAxisMaxWidth + chartPaddings.left;

  return {
    leftMargin: chartLeftAxisMaxWidth - vLeftAxisSpecWidth,
    chartDimensions: {
      top,
      left,
      width: chartWidth - chartPaddings.left - chartPaddings.right,
      height: chartHeight - chartPaddings.top - chartPaddings.bottom,
    },
  };
}
