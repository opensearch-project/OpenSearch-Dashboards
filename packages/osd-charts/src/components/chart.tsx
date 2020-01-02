import React, { CSSProperties, createRef } from 'react';
import classNames from 'classnames';
import { Provider } from 'react-redux';
import { createStore, Store } from 'redux';
import Konva from 'konva';
import { Stage } from 'react-konva';
import uuid from 'uuid';

import { SpecsParser } from '../specs/specs_parser';
import { ChartResizer } from './chart_resizer';
import { Legend } from './legend/legend';
import { ChartContainer } from './chart_container';
import { isHorizontalAxis } from '../chart_types/xy_chart/utils/axis_utils';
import { Position } from '../chart_types/xy_chart/utils/specs';
import { ChartSize, getChartSize } from '../utils/chart_size';
import { ChartStatus } from './chart_status';
import { chartStoreReducer, GlobalChartState } from '../state/chart_state';
import { isInitialized } from '../state/selectors/is_initialized';
import { createOnElementOutCaller } from '../chart_types/xy_chart/state/selectors/on_element_out_caller';
import { createOnElementOverCaller } from '../chart_types/xy_chart/state/selectors/on_element_over_caller';
import { createOnElementClickCaller } from '../chart_types/xy_chart/state/selectors/on_element_click_caller';
import { ChartTypes } from '../chart_types/index';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { createOnBrushEndCaller } from '../chart_types/xy_chart/state/selectors/on_brush_end_caller';
import { onExternalPointerEvent } from '../state/actions/events';
import { PointerEvent } from '../specs';
import { createOnPointerMoveCaller } from '../chart_types/xy_chart/state/selectors/on_pointer_move_caller';

interface ChartProps {
  /** The type of rendered
   * @default 'canvas'
   */
  renderer: 'svg' | 'canvas';
  size?: ChartSize;
  className?: string;
  id?: string;
}

interface ChartState {
  legendPosition: Position;
}

function getContainerStyle(size: any): CSSProperties {
  if (size) {
    return {
      position: 'relative',
      ...getChartSize(size),
    };
  }
  return {};
}

export class Chart extends React.Component<ChartProps, ChartState> {
  static defaultProps: ChartProps = {
    renderer: 'canvas',
  };
  private chartStore: Store<GlobalChartState>;
  private chartContainerRef: React.RefObject<HTMLDivElement>;
  private chartStageRef: React.RefObject<Stage>;

  constructor(props: any) {
    super(props);
    this.chartContainerRef = createRef();
    this.chartStageRef = createRef();

    const id = uuid.v4();
    const storeReducer = chartStoreReducer(id);
    const enhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, name: `@elastic/charts (id: ${id})` })()
      : undefined;

    this.chartStore = createStore(storeReducer, enhancers);
    this.state = {
      legendPosition: Position.Right,
    };

    const onElementClickCaller = createOnElementClickCaller();
    const onElementOverCaller = createOnElementOverCaller();
    const onElementOutCaller = createOnElementOutCaller();
    const onBrushEndCaller = createOnBrushEndCaller();
    const onPointerMoveCaller = createOnPointerMoveCaller();
    this.chartStore.subscribe(() => {
      const state = this.chartStore.getState();
      if (!isInitialized(state)) {
        return;
      }
      const settings = getSettingsSpecSelector(state);
      if (this.state.legendPosition !== settings.legendPosition) {
        this.setState({
          legendPosition: settings.legendPosition,
        });
      }

      if (state.chartType !== ChartTypes.XYAxis) {
        return;
      }
      onElementOverCaller(state);
      onElementOutCaller(state);
      onElementClickCaller(state);
      onBrushEndCaller(state);
      onPointerMoveCaller(state);
    });
  }

  dispatchExternalPointerEvent(event: PointerEvent) {
    this.chartStore.dispatch(onExternalPointerEvent(event));
  }

  getPNGSnapshot(
    options = {
      backgroundColor: 'transparent',
      pixelRatio: 2,
    },
  ): {
    blobOrDataUrl: any;
    browser: 'IE11' | 'other';
  } | null {
    if (!this.chartStageRef.current) {
      return null;
    }
    const stage = this.chartStageRef.current.getStage().clone(null);
    const width = stage.getWidth();
    const height = stage.getHeight();
    const backgroundLayer = new Konva.Layer();
    const backgroundRect = new Konva.Rect({
      fill: options.backgroundColor,
      x: 0,
      y: 0,
      width,
      height,
    });

    backgroundLayer.add(backgroundRect);
    stage.add(backgroundLayer);
    backgroundLayer.moveToBottom();
    stage.draw();
    const canvasStage = stage.toCanvas({
      width,
      height,
      callback: () => undefined,
    });
    // @ts-ignore
    if (canvasStage.msToBlob) {
      // @ts-ignore
      const blobOrDataUrl = canvasStage.msToBlob();
      return {
        blobOrDataUrl,
        browser: 'IE11',
      };
    } else {
      return {
        blobOrDataUrl: stage.toDataURL({ pixelRatio: options.pixelRatio }),
        browser: 'other',
      };
    }
  }

  getChartContainerRef = () => {
    return this.chartContainerRef;
  };

  render() {
    const { size, className } = this.props;
    const containerStyle = getContainerStyle(size);
    const horizontal = isHorizontalAxis(this.state.legendPosition);
    const chartClassNames = classNames('echChart', className, {
      'echChart--column': horizontal,
    });
    return (
      <Provider store={this.chartStore}>
        <div style={containerStyle} className={chartClassNames} ref={this.chartContainerRef}>
          <ChartStatus />
          <ChartResizer />
          <Legend />
          <SpecsParser>{this.props.children}</SpecsParser>
          <div className="echContainer">
            <ChartContainer getChartContainerRef={this.getChartContainerRef} forwardStageRef={this.chartStageRef} />
          </div>
        </div>
      </Provider>
    );
  }
}
