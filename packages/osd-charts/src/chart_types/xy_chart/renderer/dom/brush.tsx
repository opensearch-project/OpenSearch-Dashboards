import React, { RefObject } from 'react';
import { connect } from 'react-redux';
import { Dimensions } from '../../../../utils/dimensions';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { GlobalChartState } from '../../../../state/chart_state';
import { getBrushAreaSelector } from '../../state/selectors/get_brush_area';
import { isBrushAvailableSelector } from '../../state/selectors/is_brush_available';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { isBrushingSelector } from '../../state/selectors/is_brushing';
import { renderRect } from '../canvas/primitives/rect';
import { clearCanvas, withContext, withClip } from '../../../../renderers/canvas';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';

interface Props {
  initialized: boolean;
  chartDimensions: Dimensions;
  chartContainerDimensions: Dimensions;
  isBrushing: boolean | undefined;
  isBrushAvailable: boolean | undefined;
  brushArea: Dimensions | null;
}

class BrushToolComponent extends React.Component<Props> {
  static displayName = 'BrushToolComponent';
  private readonly devicePixelRatio: number;
  private ctx: CanvasRenderingContext2D | null;
  private canvasRef: RefObject<HTMLCanvasElement>;

  constructor(props: Readonly<Props>) {
    super(props);
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio;
    this.canvasRef = React.createRef();
  }
  private tryCanvasContext() {
    const canvas = this.canvasRef.current;
    this.ctx = canvas && canvas.getContext('2d');
  }
  componentDidUpdate() {
    if (!this.ctx) {
      this.tryCanvasContext();
    }
    if (this.props.initialized) {
      this.drawCanvas();
    }
  }

  componentDidMount() {
    // the DOM element has just been appended, and getContext('2d') is always non-null,
    // so we could use a couple of ! non-null assertions but no big plus
    this.tryCanvasContext();
    this.drawCanvas();
  }
  private drawCanvas = () => {
    const { brushArea, chartDimensions } = this.props;
    if (!this.ctx || !brushArea) {
      return;
    }
    const { top, left, width, height } = brushArea;
    withContext(this.ctx, (ctx) => {
      ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
      withClip(
        ctx,
        {
          x: chartDimensions.left,
          y: chartDimensions.top,
          width: chartDimensions.width,
          height: chartDimensions.height,
        },
        (ctx) => {
          clearCanvas(ctx, 200000, 200000);
          ctx.translate(chartDimensions.left, chartDimensions.top);
          renderRect(
            ctx,
            {
              x: left,
              y: top,
              width,
              height,
            },
            {
              color: {
                r: 128,
                g: 128,
                b: 128,
                opacity: 0.6,
              },
            },
          );
        },
      );
    });
  };

  render() {
    const { initialized, isBrushAvailable, isBrushing, chartContainerDimensions } = this.props;
    if (!initialized || !isBrushAvailable || !isBrushing) {
      this.ctx = null;
      return null;
    }
    const { width, height } = chartContainerDimensions;
    return (
      <canvas
        ref={this.canvasRef}
        className="echBrushTool"
        width={width * this.devicePixelRatio}
        height={height * this.devicePixelRatio}
        style={{
          width,
          height,
        }}
      />
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
      chartContainerDimensions: {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
      },
      chartDimensions: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
    };
  }
  return {
    initialized: state.specsInitialized,
    chartContainerDimensions: getChartContainerDimensionsSelector(state),
    brushArea: getBrushAreaSelector(state),
    isBrushAvailable: isBrushAvailableSelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    isBrushing: isBrushingSelector(state),
  };
};

export const BrushTool = connect(mapStateToProps)(BrushToolComponent);
