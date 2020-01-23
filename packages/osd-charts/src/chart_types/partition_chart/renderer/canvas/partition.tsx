import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { onChartRendered } from '../../../../state/actions/chart';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { GlobalChartState } from '../../../../state/chart_state';
import { Dimensions } from '../../../../utils/dimensions';
import { partitionGeometries } from '../../state/selectors/geometries';
import { nullSectorViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { renderPartitionCanvas2d } from './canvas_renderers';

interface ReactiveChartStateProps {
  initialized: boolean;
  geometries: ShapeViewModel;
  chartContainerDimensions: Dimensions;
}

interface ReactiveChartDispatchProps {
  onChartRendered: typeof onChartRendered;
}

type PartitionProps = ReactiveChartStateProps & ReactiveChartDispatchProps;
class PartitionComponent extends React.Component<PartitionProps> {
  static displayName = 'Partition';
  // firstRender = true; // this'll be useful for stable resizing of treemaps
  private readonly canvasRef: React.RefObject<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null;
  // see example https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#Example
  private readonly devicePixelRatio: number; // fixme this be no constant: multi-monitor window drag may necessitate modifying the `<canvas>` dimensions
  constructor(props: Readonly<PartitionProps>) {
    super(props);
    this.canvasRef = React.createRef();
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio;
  }

  private drawCanvas() {
    if (this.ctx) {
      const { width, height }: Dimensions = this.props.chartContainerDimensions;
      renderPartitionCanvas2d(this.ctx, this.devicePixelRatio, {
        ...this.props.geometries,
        config: { ...this.props.geometries.config, width, height },
      });
    }
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
      this.props.onChartRendered();
    }
  }

  componentDidMount() {
    // the DOM element has just been appended, and getContext('2d') is always non-null,
    // so we could use a couple of ! non-null assertions but no big plus
    this.tryCanvasContext();
    this.drawCanvas();
  }

  render() {
    const {
      initialized,
      chartContainerDimensions: { width, height },
    } = this.props;
    if (!initialized || width === 0 || height === 0) {
      return null;
    }

    return (
      <canvas
        ref={this.canvasRef}
        className="echCanvasRenderer"
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

const mapDispatchToProps = (dispatch: Dispatch): ReactiveChartDispatchProps =>
  bindActionCreators(
    {
      onChartRendered,
    },
    dispatch,
  );

const DEFAULT_PROPS: ReactiveChartStateProps = {
  initialized: false,
  geometries: nullSectorViewModel(),
  chartContainerDimensions: {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  },
};

const mapStateToProps = (state: GlobalChartState): ReactiveChartStateProps => {
  if (!isInitialized(state)) {
    return DEFAULT_PROPS;
  }
  return {
    initialized: true,
    geometries: partitionGeometries(state),
    chartContainerDimensions: state.parentDimensions,
  };
};

export const Partition = connect(mapStateToProps, mapDispatchToProps)(PartitionComponent);
