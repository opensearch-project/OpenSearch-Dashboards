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

import React, { RefObject } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { onChartRendered } from '../../../../state/actions/chart';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { Dimensions } from '../../../../utils/dimensions';
import { AnnotationId, AxisId } from '../../../../utils/ids';
import { LIGHT_THEME } from '../../../../utils/themes/light_theme';
import { Theme } from '../../../../utils/themes/theme';
import { AnnotationDimensions } from '../../annotations/annotation_utils';
import { LegendItem } from '../../../../commons/legend';
import { computeAnnotationDimensionsSelector } from '../../state/selectors/compute_annotations';
import { computeAxisTicksDimensionsSelector } from '../../state/selectors/compute_axis_ticks_dimensions';
import { AxisVisibleTicks, computeAxisVisibleTicksSelector } from '../../state/selectors/compute_axis_visible_ticks';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { computeChartTransformSelector } from '../../state/selectors/compute_chart_transform';
import { computeSeriesGeometriesSelector } from '../../state/selectors/compute_series_geometries';
import { getHighlightedSeriesSelector } from '../../state/selectors/get_highlighted_series';
import { getAnnotationSpecsSelector, getAxisSpecsSelector } from '../../state/selectors/get_specs';
import { Geometries, Transform } from '../../state/utils';
import { AxisLinePosition, AxisTicksDimensions } from '../../utils/axis_utils';
import { AxisSpec, AnnotationSpec } from '../../utils/specs';
import { renderXYChartCanvas2d } from './renderers';
import { isChartEmptySelector } from '../../state/selectors/is_chart_empty';
import { deepEqual } from '../../../../utils/fast_deep_equal';
import { Rotation } from '../../../../utils/commons';
import { IndexedGeometryMap } from '../../utils/indexed_geometry_map';

/** @internal */
export interface ReactiveChartStateProps {
  initialized: boolean;
  debug: boolean;
  isChartEmpty: boolean;
  geometries: Geometries;
  geometriesIndex: IndexedGeometryMap;
  theme: Theme;
  chartContainerDimensions: Dimensions;
  chartRotation: Rotation;
  chartDimensions: Dimensions;
  chartTransform: Transform;
  highlightedLegendItem?: LegendItem;
  axesSpecs: AxisSpec[];
  axesTicksDimensions: Map<AxisId, AxisTicksDimensions>;
  axisTickPositions: AxisVisibleTicks;
  axesGridLinesPositions: Map<AxisId, AxisLinePosition[]>;
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>;
  annotationSpecs: AnnotationSpec[];
}

interface ReactiveChartDispatchProps {
  onChartRendered: typeof onChartRendered;
}
interface ReactiveChartOwnProps {
  forwardStageRef: RefObject<HTMLCanvasElement>;
}

type XYChartProps = ReactiveChartStateProps & ReactiveChartDispatchProps & ReactiveChartOwnProps;
class XYChartComponent extends React.Component<XYChartProps> {
  static displayName = 'XYChart';
  private ctx: CanvasRenderingContext2D | null;
  // see example https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#Example
  private readonly devicePixelRatio: number; // fixme this be no constant: multi-monitor window drag may necessitate modifying the `<canvas>` dimensions
  constructor(props: Readonly<XYChartProps>) {
    super(props);
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio;
  }

  private drawCanvas() {
    if (this.ctx) {
      const { chartDimensions, chartRotation } = this.props;
      const clippings = {
        x: 0,
        y: 0,
        width: [90, -90].includes(chartRotation) ? chartDimensions.height : chartDimensions.width,
        height: [90, -90].includes(chartRotation) ? chartDimensions.width : chartDimensions.height,
      };
      renderXYChartCanvas2d(this.ctx, this.devicePixelRatio, clippings, this.props);
    }
  }

  private tryCanvasContext() {
    const canvas = this.props.forwardStageRef.current;
    this.ctx = canvas && canvas.getContext('2d');
  }
  shouldComponentUpdate(nextProps: ReactiveChartStateProps) {
    return !deepEqual(this.props, nextProps);
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

  render() {
    const {
      forwardStageRef,
      initialized,
      isChartEmpty,
      chartContainerDimensions: { width, height },
    } = this.props;
    if (!initialized || width === 0 || height === 0) {
      this.ctx = null;
      return null;
    }

    if (isChartEmpty) {
      this.ctx = null;
      return (
        <div className="echReactiveChart_unavailable">
          <p>No data to display</p>
        </div>
      );
    }
    return (
      <canvas
        ref={forwardStageRef}
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
  debug: false,
  isChartEmpty: true,
  geometries: {
    areas: [],
    bars: [],
    lines: [],
    points: [],
    bubbles: [],
  },
  geometriesIndex: new IndexedGeometryMap(),
  theme: LIGHT_THEME,
  chartContainerDimensions: {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  },
  chartRotation: 0 as 0,
  chartDimensions: {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  },
  chartTransform: {
    x: 0,
    y: 0,
    rotate: 0,
  },

  axesSpecs: [],
  axisTickPositions: {
    axisGridLinesPositions: new Map(),
    axisPositions: new Map(),
    axisTicks: new Map(),
    axisVisibleTicks: new Map(),
  },
  axesTicksDimensions: new Map(),
  axesGridLinesPositions: new Map(),
  annotationDimensions: new Map(),
  annotationSpecs: [],
};

const mapStateToProps = (state: GlobalChartState): ReactiveChartStateProps => {
  if (!isInitialized(state)) {
    return DEFAULT_PROPS;
  }

  const { geometries, geometriesIndex } = computeSeriesGeometriesSelector(state);

  return {
    initialized: true,
    isChartEmpty: isChartEmptySelector(state),
    debug: getSettingsSpecSelector(state).debug,
    geometries,
    geometriesIndex,
    theme: getChartThemeSelector(state),
    chartContainerDimensions: getChartContainerDimensionsSelector(state),
    highlightedLegendItem: getHighlightedSeriesSelector(state),
    chartRotation: getChartRotationSelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    chartTransform: computeChartTransformSelector(state),
    axesSpecs: getAxisSpecsSelector(state),
    axisTickPositions: computeAxisVisibleTicksSelector(state),
    axesTicksDimensions: computeAxisTicksDimensionsSelector(state),
    axesGridLinesPositions: computeAxisVisibleTicksSelector(state).axisGridLinesPositions,
    annotationDimensions: computeAnnotationDimensionsSelector(state),
    annotationSpecs: getAnnotationSpecsSelector(state),
  };
};

/** @internal */
export const XYChart = connect(mapStateToProps, mapDispatchToProps)(XYChartComponent);
