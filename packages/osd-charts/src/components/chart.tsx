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

import classNames from 'classnames';
import React, { createRef } from 'react';
import { Provider } from 'react-redux';
import { createStore, Store, Unsubscribe, StoreEnhancer, applyMiddleware, Middleware } from 'redux';
import uuid from 'uuid';

import { isHorizontalAxis } from '../chart_types/xy_chart/utils/axis_type_utils';
import { PointerEvent } from '../specs';
import { SpecsParser } from '../specs/specs_parser';
import { onExternalPointerEvent } from '../state/actions/events';
import { chartStoreReducer, GlobalChartState } from '../state/chart_state';
import { getInternalIsInitializedSelector, InitStatus } from '../state/selectors/get_internal_is_intialized';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { ChartSize, getChartSize } from '../utils/chart_size';
import { Position } from '../utils/commons';
import { ChartBackground } from './chart_background';
import { ChartContainer } from './chart_container';
import { ChartResizer } from './chart_resizer';
import { ChartStatus } from './chart_status';
import { ErrorBoundary } from './error_boundary';
import { Legend } from './legend/legend';

interface ChartProps {
  /**
   * The type of rendered
   * @defaultValue `canvas`
   */
  renderer?: 'svg' | 'canvas';
  size?: ChartSize;
  className?: string;
  id?: string;
}

interface ChartState {
  legendPosition: Position;
}

const getMiddlware = (id: string): StoreEnhancer => {
  const middlware: Middleware<any, any, any>[] = [];

  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      trace: true,
      name: `@elastic/charts (id: ${id})`,
    })(applyMiddleware(...middlware));
  }

  return applyMiddleware(...middlware);
};

export class Chart extends React.Component<ChartProps, ChartState> {
  static defaultProps: ChartProps = {
    renderer: 'canvas',
  };

  private unsubscribeToStore: Unsubscribe;
  private chartStore: Store<GlobalChartState>;
  private chartContainerRef: React.RefObject<HTMLDivElement>;
  private chartStageRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: ChartProps) {
    super(props);
    this.chartContainerRef = createRef();
    this.chartStageRef = createRef();

    const id = props.id ?? uuid.v4();
    const storeReducer = chartStoreReducer(id);
    const enhancer = getMiddlware(id);
    this.chartStore = createStore(storeReducer, enhancer);
    this.state = {
      legendPosition: Position.Right,
    };
    this.unsubscribeToStore = this.chartStore.subscribe(() => {
      const state = this.chartStore.getState();
      if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
        return;
      }

      const settings = getSettingsSpecSelector(state);
      if (this.state.legendPosition !== settings.legendPosition) {
        this.setState({
          legendPosition: settings.legendPosition,
        });
      }
      if (state.internalChartState) {
        state.internalChartState.eventCallbacks(state);
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeToStore();
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
    const canvas = this.chartStageRef.current;
    const backgroundCanvas = document.createElement('canvas');
    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;
    const bgCtx = backgroundCanvas.getContext('2d');
    if (!bgCtx) {
      return null;
    }
    bgCtx.fillStyle = options.backgroundColor;
    bgCtx.fillRect(0, 0, canvas.width, canvas.height);
    bgCtx.drawImage(canvas, 0, 0);

    // @ts-ignore
    if (bgCtx.msToBlob) {
      // @ts-ignore
      const blobOrDataUrl = bgCtx.msToBlob();
      return {
        blobOrDataUrl,
        browser: 'IE11',
      };
    }
    return {
      blobOrDataUrl: backgroundCanvas.toDataURL(),
      browser: 'other',
    };
  }

  getChartContainerRef = () => this.chartContainerRef;

  dispatchExternalPointerEvent(event: PointerEvent) {
    this.chartStore.dispatch(onExternalPointerEvent(event));
  }

  render() {
    const { size, className } = this.props;
    const containerSizeStyle = getChartSize(size);
    const horizontal = isHorizontalAxis(this.state.legendPosition);
    const chartClassNames = classNames('echChart', className, {
      'echChart--column': horizontal,
    });

    return (
      <Provider store={this.chartStore}>
        <div className={chartClassNames} style={containerSizeStyle} ref={this.chartContainerRef}>
          <ChartBackground />
          <ChartStatus />
          <ChartResizer />
          <Legend />
          {/* TODO: Add renderFn to error boundary */}
          <ErrorBoundary>
            <SpecsParser>{this.props.children}</SpecsParser>
            <div className="echContainer">
              <ChartContainer getChartContainerRef={this.getChartContainerRef} forwardStageRef={this.chartStageRef} />
            </div>
          </ErrorBoundary>
        </div>
      </Provider>
    );
  }
}
