import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { GlobalChartState, BackwardRef } from '../state/chart_state';
import { onMouseUp, onMouseDown, onPointerMove } from '../state/actions/mouse';
import { getInternalChartRendererSelector } from '../state/selectors/get_chart_type_components';
import { getInternalPointerCursor } from '../state/selectors/get_internal_cursor_pointer';
import { getInternalIsBrushingAvailableSelector } from '../state/selectors/get_internal_is_brushing_available';
import { isInternalChartEmptySelector } from '../state/selectors/is_chart_empty';
import { isInitialized } from '../state/selectors/is_initialized';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { SettingsSpec } from '../specs';
import { isBrushingSelector } from '../chart_types/xy_chart/state/selectors/is_brushing';
import { Stage } from 'react-konva';

interface ReactiveChartStateProps {
  initialized: boolean;
  isChartEmpty?: boolean;
  pointerCursor: string;
  isBrushing: boolean;
  isBrushingAvailable: boolean;
  settings?: SettingsSpec;
  internalChartRenderer: (containerRef: BackwardRef, forwardStageRef: React.RefObject<Stage>) => JSX.Element | null;
}
interface ReactiveChartDispatchProps {
  onPointerMove: typeof onPointerMove;
  onMouseUp: typeof onMouseUp;
  onMouseDown: typeof onMouseDown;
}

interface ReactiveChartOwnProps {
  getChartContainerRef: BackwardRef;
  forwardStageRef: React.RefObject<Stage>;
}

type ReactiveChartProps = ReactiveChartStateProps & ReactiveChartDispatchProps & ReactiveChartOwnProps;

class ChartContainerComponent extends React.Component<ReactiveChartProps> {
  static displayName = 'ChartContainer';

  shouldComponentUpdate(props: ReactiveChartProps) {
    return props.initialized;
  }
  handleMouseMove = ({
    nativeEvent: { offsetX, offsetY, timeStamp },
  }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { isChartEmpty, onPointerMove } = this.props;
    if (isChartEmpty) {
      return;
    }
    onPointerMove(
      {
        x: offsetX,
        y: offsetY,
      },
      timeStamp,
    );
  };
  handleMouseLeave = ({ nativeEvent: { timeStamp } }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { isChartEmpty, onPointerMove, isBrushing } = this.props;
    if (isChartEmpty) {
      return;
    }
    if (isBrushing) {
      return;
    }
    onPointerMove({ x: -1, y: -1 }, timeStamp);
  };
  handleMouseDown = ({
    nativeEvent: { offsetX, offsetY, timeStamp },
  }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { isChartEmpty, onMouseDown, isBrushingAvailable } = this.props;
    if (isChartEmpty) {
      return;
    }
    if (isBrushingAvailable) {
      window.addEventListener('mouseup', this.handleBrushEnd);
    }
    onMouseDown(
      {
        x: offsetX,
        y: offsetY,
      },
      timeStamp,
    );
  };
  handleMouseUp = ({ nativeEvent: { offsetX, offsetY, timeStamp } }: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { isChartEmpty, onMouseUp } = this.props;
    if (isChartEmpty) {
      return;
    }
    onMouseUp(
      {
        x: offsetX,
        y: offsetY,
      },
      timeStamp,
    );
  };
  handleBrushEnd = () => {
    const { onMouseUp } = this.props;

    window.removeEventListener('mouseup', this.handleBrushEnd);
    requestAnimationFrame(() => {
      onMouseUp(
        {
          x: -1,
          y: -1,
        },
        Date.now(),
      );
    });
  };

  render() {
    const { initialized } = this.props;
    if (!initialized) {
      return (
        <div className="echReactiveChart_unavailable">
          <p>No data to display</p>
        </div>
      );
    }
    const { pointerCursor, internalChartRenderer, getChartContainerRef, forwardStageRef } = this.props;
    return (
      <div
        className="echChartPointerContainer"
        style={{
          cursor: pointerCursor,
        }}
        onMouseMove={this.handleMouseMove}
        onMouseLeave={this.handleMouseLeave}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
      >
        {internalChartRenderer(getChartContainerRef, forwardStageRef)}
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): ReactiveChartDispatchProps =>
  bindActionCreators(
    {
      onPointerMove,
      onMouseUp,
      onMouseDown,
    },
    dispatch,
  );
const mapStateToProps = (state: GlobalChartState): ReactiveChartStateProps => {
  if (!isInitialized(state)) {
    return {
      initialized: false,
      isChartEmpty: true,
      pointerCursor: 'default',
      isBrushingAvailable: false,
      isBrushing: false,
      internalChartRenderer: () => null,
    };
  }

  return {
    initialized: true,
    isChartEmpty: isInternalChartEmptySelector(state),
    pointerCursor: getInternalPointerCursor(state),
    isBrushingAvailable: getInternalIsBrushingAvailableSelector(state),
    isBrushing: isBrushingSelector(state),
    internalChartRenderer: getInternalChartRendererSelector(state),
    settings: getSettingsSpecSelector(state),
  };
};

export const ChartContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartContainerComponent);
