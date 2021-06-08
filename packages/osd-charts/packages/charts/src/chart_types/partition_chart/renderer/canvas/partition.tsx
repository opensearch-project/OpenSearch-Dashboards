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

import React, { MouseEvent, RefObject } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { ScreenReaderSummary } from '../../../../components/accessibility';
import { clearCanvas } from '../../../../renderers/canvas';
import { onChartRendered } from '../../../../state/actions/chart';
import { ChartId, GlobalChartState } from '../../../../state/chart_state';
import {
  A11ySettings,
  DEFAULT_A11Y_SETTINGS,
  getA11ySettingsSelector,
} from '../../../../state/selectors/get_accessibility_config';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getInternalIsInitializedSelector, InitStatus } from '../../../../state/selectors/get_internal_is_intialized';
import { Dimensions } from '../../../../utils/dimensions';
import { MODEL_KEY } from '../../layout/config';
import {
  nullShapeViewModel,
  QuadViewModel,
  ShapeViewModel,
  SmallMultiplesDescriptors,
} from '../../layout/types/viewmodel_types';
import { INPUT_KEY } from '../../layout/utils/group_by_rollup';
import { isSimpleLinear } from '../../layout/viewmodel/viewmodel';
import { partitionDrilldownFocus, partitionMultiGeometries } from '../../state/selectors/geometries';
import { renderLinearPartitionCanvas2d } from './canvas_linear_renderers';
import { renderPartitionCanvas2d } from './canvas_renderers';

/** @internal */
export interface ContinuousDomainFocus {
  currentFocusX0: number;
  currentFocusX1: number;
  prevFocusX0: number;
  prevFocusX1: number;
}

/** @internal */
export interface IndexedContinuousDomainFocus extends ContinuousDomainFocus, SmallMultiplesDescriptors {}

interface ReactiveChartStateProps {
  initialized: boolean;
  geometries: ShapeViewModel;
  geometriesFoci: ContinuousDomainFocus[];
  multiGeometries: ShapeViewModel[];
  chartContainerDimensions: Dimensions;
  chartId: ChartId;
  a11ySettings: A11ySettings;
}

interface ReactiveChartDispatchProps {
  onChartRendered: typeof onChartRendered;
}
interface ReactiveChartOwnProps {
  forwardStageRef: RefObject<HTMLCanvasElement>;
}

type PartitionProps = ReactiveChartStateProps & ReactiveChartDispatchProps & ReactiveChartOwnProps;

class PartitionComponent extends React.Component<PartitionProps> {
  static displayName = 'Partition';

  // firstRender = true; // this will be useful for stable resizing of treemaps
  private ctx: CanvasRenderingContext2D | null;

  // see example https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#Example
  private readonly devicePixelRatio: number; // fixme this be no constant: multi-monitor window drag may necessitate modifying the `<canvas>` dimensions

  constructor(props: Readonly<PartitionProps>) {
    super(props);
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio;
  }

  componentDidMount() {
    /*
     * the DOM element has just been appended, and getContext('2d') is always non-null,
     * so we could use a couple of ! non-null assertions but no big plus
     */
    this.tryCanvasContext();
    if (this.props.initialized) {
      this.drawCanvas();
      this.props.onChartRendered();
    }
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

  handleMouseMove(e: MouseEvent<HTMLCanvasElement>) {
    const {
      initialized,
      chartContainerDimensions: { width, height },
      forwardStageRef,
    } = this.props;
    if (!forwardStageRef.current || !this.ctx || !initialized || width === 0 || height === 0) {
      return;
    }
    const picker = this.props.geometries.pickQuads;
    const focus = this.props.geometriesFoci[0];
    const box = forwardStageRef.current.getBoundingClientRect();
    const { diskCenter } = this.props.geometries;
    const x = e.clientX - box.left - diskCenter.x;
    const y = e.clientY - box.top - diskCenter.y;
    const pickedShapes: Array<QuadViewModel> = picker(x, y, focus);
    const datumIndices = new Set();
    pickedShapes.forEach((shape) => {
      const node = shape[MODEL_KEY];
      const shapeNode = node.children.find(([key]) => key === shape.dataName);
      if (shapeNode) {
        const indices = shapeNode[1][INPUT_KEY] || [];
        indices.forEach((i) => datumIndices.add(i));
      }
    });

    return pickedShapes; // placeholder
  }

  render() {
    const {
      forwardStageRef,
      initialized,
      chartContainerDimensions: { width, height },
      a11ySettings,
    } = this.props;
    if (!initialized || width === 0 || height === 0) {
      return null;
    }
    return (
      <figure aria-labelledby={a11ySettings.labelId} aria-describedby={a11ySettings.descriptionId}>
        <canvas
          ref={forwardStageRef}
          className="echCanvasRenderer"
          width={width * this.devicePixelRatio}
          height={height * this.devicePixelRatio}
          onMouseMove={this.handleMouseMove.bind(this)}
          style={{
            width,
            height,
          }}
          // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
          role="presentation"
        >
          <ScreenReaderSummary />
        </canvas>
      </figure>
    );
  }

  private drawCanvas() {
    if (this.ctx) {
      const { width, height }: Dimensions = this.props.chartContainerDimensions;
      clearCanvas(this.ctx, width * this.devicePixelRatio, height * this.devicePixelRatio);
      const {
        ctx,
        devicePixelRatio,
        props: { multiGeometries, geometriesFoci, chartId },
      } = this;
      multiGeometries.forEach((geometries, geometryIndex) => {
        const renderer = isSimpleLinear(geometries.config, geometries.layers)
          ? renderLinearPartitionCanvas2d
          : renderPartitionCanvas2d;
        renderer(ctx, devicePixelRatio, geometries, geometriesFoci[geometryIndex], chartId);
      });
    }
  }

  private tryCanvasContext() {
    const canvas = this.props.forwardStageRef.current;
    this.ctx = canvas && canvas.getContext('2d');
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
  chartId: '',
  geometries: nullShapeViewModel(),
  geometriesFoci: [],
  multiGeometries: [],
  chartContainerDimensions: {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  },
  a11ySettings: DEFAULT_A11Y_SETTINGS,
};

const mapStateToProps = (state: GlobalChartState): ReactiveChartStateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return DEFAULT_PROPS;
  }
  const multiGeometries = partitionMultiGeometries(state);
  return {
    initialized: true,
    geometries: multiGeometries.length > 0 ? multiGeometries[0] : nullShapeViewModel(),
    multiGeometries,
    chartContainerDimensions: getChartContainerDimensionsSelector(state),
    geometriesFoci: partitionDrilldownFocus(state),
    chartId: getChartIdSelector(state),
    a11ySettings: getA11ySettingsSelector(state),
  };
};

/** @internal */
export const Partition = connect(mapStateToProps, mapDispatchToProps)(PartitionComponent);
