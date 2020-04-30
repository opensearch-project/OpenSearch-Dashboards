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

import React, { MouseEvent } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { onChartRendered } from '../../../../state/actions/chart';
import { GlobalChartState } from '../../../../state/chart_state';
import { Dimensions } from '../../../../utils/dimensions';
import { geometries } from '../../state/selectors/geometries';
import { BulletViewModel, nullShapeViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { renderCanvas2d } from './canvas_renderers';
import { getInternalIsInitializedSelector } from '../../../../state/selectors/get_internal_is_intialized';

interface ReactiveChartStateProps {
  initialized: boolean;
  geometries: ShapeViewModel;
  chartContainerDimensions: Dimensions;
}

interface ReactiveChartDispatchProps {
  onChartRendered: typeof onChartRendered;
}

type Props = ReactiveChartStateProps & ReactiveChartDispatchProps;
class Component extends React.Component<Props> {
  static displayName = 'Goal';
  // firstRender = true; // this'll be useful for stable resizing of treemaps
  private readonly canvasRef: React.RefObject<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null;
  // see example https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#Example
  private readonly devicePixelRatio: number; // fixme this be no constant: multi-monitor window drag may necessitate modifying the `<canvas>` dimensions
  constructor(props: Readonly<Props>) {
    super(props);
    this.canvasRef = React.createRef();
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio;
  }

  private drawCanvas() {
    if (this.ctx) {
      const { width, height }: Dimensions = this.props.chartContainerDimensions;
      renderCanvas2d(this.ctx, this.devicePixelRatio, {
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
    if (this.props.initialized) {
      this.drawCanvas();
      this.props.onChartRendered();
    }
  }

  handleMouseMove(e: MouseEvent<HTMLCanvasElement>) {
    const {
      initialized,
      chartContainerDimensions: { width, height },
    } = this.props;
    if (!this.canvasRef.current || !this.ctx || !initialized || width === 0 || height === 0) {
      return;
    }
    const picker = this.props.geometries.pickQuads;
    const box = this.canvasRef.current.getBoundingClientRect();
    const chartCenter = this.props.geometries.chartCenter;
    const x = e.clientX - box.left - chartCenter.x;
    const y = e.clientY - box.top - chartCenter.y;
    const pickedShapes: Array<BulletViewModel> = picker(x, y);
    return pickedShapes;
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
        onMouseMove={this.handleMouseMove.bind(this)}
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
  geometries: nullShapeViewModel(),
  chartContainerDimensions: {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  },
};

const mapStateToProps = (state: GlobalChartState): ReactiveChartStateProps => {
  if (!getInternalIsInitializedSelector(state)) {
    return DEFAULT_PROPS;
  }
  return {
    initialized: true,
    geometries: geometries(state),
    chartContainerDimensions: state.parentDimensions,
  };
};

/** @internal */
export const Goal = connect(mapStateToProps, mapDispatchToProps)(Component);
