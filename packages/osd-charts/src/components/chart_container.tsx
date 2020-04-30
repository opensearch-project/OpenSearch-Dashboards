/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { deepEqual } from '../utils/fast_deep_equal';
import { GlobalChartState, BackwardRef } from '../state/chart_state';
import { onMouseUp, onMouseDown, onPointerMove } from '../state/actions/mouse';
import { getInternalChartRendererSelector } from '../state/selectors/get_chart_type_components';
import { getInternalPointerCursor } from '../state/selectors/get_internal_cursor_pointer';
import { getInternalIsBrushingAvailableSelector } from '../state/selectors/get_internal_is_brushing_available';
import { isInternalChartEmptySelector } from '../state/selectors/is_chart_empty';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { SettingsSpec } from '../specs';
import { getInternalIsBrushingSelector } from '../state/selectors/get_internal_is_brushing';
import { getInternalIsInitializedSelector } from '../state/selectors/get_internal_is_intialized';

interface ChartContainerComponentStateProps {
  initialized: boolean;
  isChartEmpty?: boolean;
  pointerCursor: string;
  isBrushing: boolean;
  isBrushingAvailable: boolean;
  settings?: SettingsSpec;
  internalChartRenderer: (
    containerRef: BackwardRef,
    forwardStageRef: React.RefObject<HTMLCanvasElement>,
  ) => JSX.Element | null;
}
interface ChartContainerComponentDispatchProps {
  onPointerMove: typeof onPointerMove;
  onMouseUp: typeof onMouseUp;
  onMouseDown: typeof onMouseDown;
}

interface ChartContainerComponentOwnProps {
  getChartContainerRef: BackwardRef;
  forwardStageRef: React.RefObject<HTMLCanvasElement>;
}

type ReactiveChartProps = ChartContainerComponentStateProps &
  ChartContainerComponentDispatchProps &
  ChartContainerComponentOwnProps;

class ChartContainerComponent extends React.Component<ReactiveChartProps> {
  static displayName = 'ChartContainer';

  shouldComponentUpdate(nextProps: ReactiveChartProps) {
    return !deepEqual(this.props, nextProps);
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

const mapDispatchToProps = (dispatch: Dispatch): ChartContainerComponentDispatchProps =>
  bindActionCreators(
    {
      onPointerMove,
      onMouseUp,
      onMouseDown,
    },
    dispatch,
  );
const mapStateToProps = (state: GlobalChartState): ChartContainerComponentStateProps => {
  if (!getInternalIsInitializedSelector(state)) {
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
    isBrushing: getInternalIsBrushingSelector(state),
    internalChartRenderer: getInternalChartRendererSelector(state),
    settings: getSettingsSpecSelector(state),
  };
};

/** @internal */
export const ChartContainer = connect(mapStateToProps, mapDispatchToProps)(ChartContainerComponent);
