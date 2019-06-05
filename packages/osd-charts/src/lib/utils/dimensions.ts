import { AxisTicksDimensions } from '../axes/axis_utils';
import { AxisSpec, Position } from '../series/specs';
import { Theme } from '../themes/theme';
import { AxisId } from './ids';

export interface Dimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

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
  showLegend: boolean,
  legendPosition?: Position,
): Dimensions {
  const { chartMargins, chartPaddings } = chartTheme;
  const legendStyle = chartTheme.legend;
  const { axisTitleStyle } = chartTheme.axes;

  const axisTitleHeight = axisTitleStyle.fontSize + axisTitleStyle.padding;

  let vLeftAxisSpecWidth = 0;
  let vRightAxisSpecWidth = 0;
  let hTopAxisSpecHeight = 0;
  let hBottomAxisSpecHeight = 0;

  axisDimensions.forEach(({ maxLabelBboxWidth = 0, maxLabelBboxHeight = 0 }, id) => {
    const axisSpec = axisSpecs.get(id);
    if (!axisSpec || axisSpec.hide) {
      return;
    }
    const { position, tickSize, tickPadding, title } = axisSpec;
    const titleHeight = title !== undefined ? axisTitleHeight : 0;
    switch (position) {
      case Position.Top:
        hTopAxisSpecHeight +=
          maxLabelBboxHeight + tickSize + tickPadding + chartMargins.top + titleHeight;
        break;
      case Position.Bottom:
        hBottomAxisSpecHeight +=
          maxLabelBboxHeight + tickSize + tickPadding + chartMargins.bottom + titleHeight;
        break;
      case Position.Left:
        vLeftAxisSpecWidth +=
          maxLabelBboxWidth + tickSize + tickPadding + chartMargins.left + titleHeight;
        break;
      case Position.Right:
        vRightAxisSpecWidth +=
          maxLabelBboxWidth + tickSize + tickPadding + chartMargins.right + titleHeight;
        break;
    }
  });
  // const hMargins = chartMargins.left + chartMargins.right;
  const chartWidth = parentDimensions.width - vLeftAxisSpecWidth - vRightAxisSpecWidth;
  const chartHeight = parentDimensions.height - hTopAxisSpecHeight - hBottomAxisSpecHeight;
  let vMargin = 0;
  if (hTopAxisSpecHeight === 0) {
    vMargin += chartMargins.top;
  }
  if (hBottomAxisSpecHeight === 0) {
    vMargin += chartMargins.bottom;
  }
  let hMargin = 0;
  if (vLeftAxisSpecWidth === 0) {
    hMargin += chartMargins.left;
  }
  if (vRightAxisSpecWidth === 0) {
    hMargin += chartMargins.right;
  }
  let legendTopMargin = 0;
  let legendLeftMargin = 0;
  if (showLegend) {
    switch (legendPosition) {
      case Position.Right:
        hMargin += legendStyle.verticalWidth;
        break;
      case Position.Left:
        hMargin += legendStyle.verticalWidth;
        legendLeftMargin = legendStyle.verticalWidth;
        break;
      case Position.Top:
        vMargin += legendStyle.horizontalHeight;
        legendTopMargin = legendStyle.horizontalHeight;
        break;
      case Position.Bottom:
        vMargin += legendStyle.horizontalHeight;
        break;
    }
  }
  let top = 0;
  let left = 0;
  if (hTopAxisSpecHeight === 0) {
    top = chartMargins.top + chartPaddings.top + legendTopMargin;
  } else {
    top = hTopAxisSpecHeight + chartPaddings.top + legendTopMargin;
  }
  if (vLeftAxisSpecWidth === 0) {
    left = chartMargins.left + chartPaddings.left + legendLeftMargin;
  } else {
    left = vLeftAxisSpecWidth + chartPaddings.left + legendLeftMargin;
  }
  return {
    top,
    left,
    width: chartWidth - hMargin - chartPaddings.left - chartPaddings.right,
    height: chartHeight - vMargin - chartPaddings.top - chartPaddings.bottom,
  };
}
