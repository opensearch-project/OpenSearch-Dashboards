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
 * under the License.
 */

import React, { RefObject } from 'react';
import { connect } from 'react-redux';

import { renderRect } from '../../chart_types/xy_chart/renderer/canvas/primitives/rect';
import { RgbObject } from '../../common/color_library_wrappers';
import { clearCanvas, withContext, withClip } from '../../renderers/canvas';
import { GlobalChartState } from '../../state/chart_state';
import { getInternalBrushAreaSelector } from '../../state/selectors/get_internal_brush_area';
import { getInternalIsBrushingSelector } from '../../state/selectors/get_internal_is_brushing';
import { getInternalIsBrushingAvailableSelector } from '../../state/selectors/get_internal_is_brushing_available';
import { getInternalIsInitializedSelector, InitStatus } from '../../state/selectors/get_internal_is_intialized';
import { getInternalMainProjectionAreaSelector } from '../../state/selectors/get_internal_main_projection_area';
import { getInternalProjectionContainerAreaSelector } from '../../state/selectors/get_internal_projection_container_area';
import { Dimensions } from '../../utils/dimensions';

interface OwnProps {
  fillColor?: RgbObject;
}
interface StateProps {
  initialized: boolean;
  mainProjectionArea: Dimensions;
  projectionContainer: Dimensions;
  isBrushing: boolean | undefined;
  isBrushAvailable: boolean | undefined;
  brushArea: Dimensions | null;
  zIndex: number;
}

const DEFAULT_FILL_COLOR: RgbObject = {
  r: 128,
  g: 128,
  b: 128,
  opacity: 0.6,
};

type Props = OwnProps & StateProps;

class BrushToolComponent extends React.Component<Props> {
  static displayName = 'BrushTool';

  private readonly devicePixelRatio: number;

  private ctx: CanvasRenderingContext2D | null;

  private canvasRef: RefObject<HTMLCanvasElement>;

  constructor(props: Readonly<Props>) {
    super(props);
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio;
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    /*
     * the DOM element has just been appended, and getContext('2d') is always non-null,
     * so we could use a couple of ! non-null assertions but no big plus
     */
    this.tryCanvasContext();
    this.drawCanvas();
  }

  componentDidUpdate() {
    if (!this.ctx) {
      this.tryCanvasContext();
    }
    if (this.props.initialized) {
      this.drawCanvas();
    }
  }

  private drawCanvas = () => {
    const { brushArea, mainProjectionArea, fillColor } = this.props;
    if (!this.ctx || !brushArea) {
      return;
    }
    const { top, left, width, height } = brushArea;
    withContext(this.ctx, (ctx) => {
      ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
      withClip(
        ctx,
        {
          x: mainProjectionArea.left,
          y: mainProjectionArea.top,
          width: mainProjectionArea.width,
          height: mainProjectionArea.height,
        },
        (ctx) => {
          clearCanvas(ctx, 200000, 200000);
          ctx.translate(mainProjectionArea.left, mainProjectionArea.top);
          renderRect(
            ctx,
            {
              x: left,
              y: top,
              width,
              height,
            },
            {
              color: fillColor ?? DEFAULT_FILL_COLOR,
            },
          );
        },
      );
    });
  };

  private tryCanvasContext() {
    const canvas = this.canvasRef.current;
    this.ctx = canvas && canvas.getContext('2d');
  }

  render() {
    const { initialized, isBrushAvailable, isBrushing, projectionContainer, zIndex } = this.props;
    if (!initialized || !isBrushAvailable || !isBrushing) {
      this.ctx = null;
      return null;
    }
    const { width, height } = projectionContainer;
    return (
      <canvas
        ref={this.canvasRef}
        className="echBrushTool"
        width={width * this.devicePixelRatio}
        height={height * this.devicePixelRatio}
        style={{
          width,
          height,
          zIndex,
        }}
      />
    );
  }
}

const mapStateToProps = (state: GlobalChartState): StateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return {
      initialized: false,
      projectionContainer: {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
      },
      mainProjectionArea: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
      isBrushing: false,
      isBrushAvailable: false,
      brushArea: null,
      zIndex: 0,
    };
  }
  return {
    initialized: state.specsInitialized,
    projectionContainer: getInternalProjectionContainerAreaSelector(state),
    mainProjectionArea: getInternalMainProjectionAreaSelector(state),
    isBrushAvailable: getInternalIsBrushingAvailableSelector(state),
    isBrushing: getInternalIsBrushingSelector(state),
    brushArea: getInternalBrushAreaSelector(state),
    zIndex: state.zIndex,
  };
};

/** @internal */
export const BrushTool = connect(mapStateToProps)(BrushToolComponent);
