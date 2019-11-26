import React from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import { connect } from 'react-redux';
import { Dimensions } from '../../../../utils/dimensions';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { computeChartTransformSelector } from '../../state/selectors/compute_chart_transform';
import { Transform } from '../../state/utils';
import { GlobalChartState } from '../../../../state/chart_state';
import { getBrushAreaSelector } from '../../state/selectors/get_brush_area';
import { isBrushAvailableSelector } from '../../state/selectors/is_brush_available';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { isBrushingSelector } from '../../state/selectors/is_brushing';

interface Props {
  initialized: boolean;
  chartDimensions: Dimensions;
  chartTransform: Transform;
  isBrushing: boolean | undefined;
  isBrushAvailable: boolean | undefined;
  brushArea: Dimensions | null;
}

class BrushToolComponent extends React.Component<Props> {
  static displayName = 'BrushToolComponent';

  renderBrushTool = (brushArea: Dimensions | null) => {
    if (!brushArea) {
      return null;
    }
    const { top, left, width, height } = brushArea;
    return <Rect x={left} y={top} width={width} height={height} fill="gray" opacity={0.6} />;
  };

  render() {
    const { initialized, isBrushAvailable, isBrushing, chartDimensions, chartTransform, brushArea } = this.props;
    if (!initialized || !isBrushAvailable || !isBrushing) {
      return null;
    }

    return (
      <Stage
        width={chartDimensions.width}
        height={chartDimensions.height}
        className="echBrushTool"
        style={{
          top: chartDimensions.top + chartTransform.x,
          left: chartDimensions.left + chartTransform.y,
          width: chartDimensions.width,
          height: chartDimensions.height,
        }}
      >
        <Layer hitGraphEnabled={false} listening={false}>
          {this.renderBrushTool(brushArea)}
        </Layer>
      </Stage>
    );
  }
}

const mapStateToProps = (state: GlobalChartState): Props => {
  if (!isInitialized(state)) {
    return {
      initialized: false,
      isBrushing: false,
      isBrushAvailable: false,
      brushArea: null,
      chartDimensions: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
      chartTransform: {
        x: 0,
        y: 0,
        rotate: 0,
      },
    };
  }
  return {
    initialized: state.specsInitialized,
    brushArea: getBrushAreaSelector(state),
    isBrushAvailable: isBrushAvailableSelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    chartTransform: computeChartTransformSelector(state),
    isBrushing: isBrushingSelector(state),
  };
};

export const BrushTool = connect(mapStateToProps)(BrushToolComponent);
