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

import React, { CSSProperties, createRef } from 'react';
import classNames from 'classnames';
import { Provider } from 'react-redux';
import { createStore, Store, Unsubscribe } from 'redux';
import uuid from 'uuid';
import { SpecsParser } from '../specs/specs_parser';
import { ChartResizer } from './chart_resizer';
import { Legend } from './legend/legend';
import { ChartContainer } from './chart_container';
import { isHorizontalAxis } from '../chart_types/xy_chart/utils/axis_utils';
import { Position } from '../utils/commons';
import { ChartSize, getChartSize } from '../utils/chart_size';
import { ChartStatus } from './chart_status';
import { chartStoreReducer, GlobalChartState } from '../state/chart_state';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { onExternalPointerEvent } from '../state/actions/events';
import { PointerEvent } from '../specs';
import { getInternalIsInitializedSelector } from '../state/selectors/get_internal_is_intialized';

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
  private unsubscribeToStore: Unsubscribe;
  private chartStore: Store<GlobalChartState>;
  private chartContainerRef: React.RefObject<HTMLDivElement>;
  private chartStageRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: any) {
    super(props);
    this.chartContainerRef = createRef();
    this.chartStageRef = createRef();

    const id = uuid.v4();
    const storeReducer = chartStoreReducer(id);
    const enhancers =
      typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, name: `@elastic/charts (id: ${id})` })()
        : undefined;

    this.chartStore = createStore(storeReducer, enhancers);
    this.state = {
      legendPosition: Position.Right,
    };

    this.unsubscribeToStore = this.chartStore.subscribe(() => {
      const state = this.chartStore.getState();
      if (!getInternalIsInitializedSelector(state)) {
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
    } else {
      return {
        blobOrDataUrl: backgroundCanvas.toDataURL(),
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
