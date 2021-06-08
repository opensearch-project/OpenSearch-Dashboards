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
import { Dispatch, bindActionCreators } from 'redux';
import ResizeObserver from 'resize-observer-polyfill';
import { debounce } from 'ts-debounce';

import { updateParentDimensions } from '../state/actions/chart_settings';
import { GlobalChartState } from '../state/chart_state';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { isDefined } from '../utils/common';
import { Dimensions } from '../utils/dimensions';

interface ResizerStateProps {
  resizeDebounce: number;
}

interface ResizerDispatchProps {
  updateParentDimensions(dimension: Dimensions): void;
}

type ResizerProps = ResizerStateProps & ResizerDispatchProps;

const DEFAULT_RESIZE_DEBOUNCE = 200;

class Resizer extends React.Component<ResizerProps> {
  private initialResizeComplete = false;

  private containerRef: RefObject<HTMLDivElement>;

  private ro: ResizeObserver;

  private animationFrameID: number | null;

  private onResizeDebounced: (entries: ResizeObserverEntry[]) => void;

  constructor(props: ResizerProps) {
    super(props);
    this.containerRef = React.createRef();
    this.ro = new ResizeObserver(this.handleResize);
    this.animationFrameID = null;
    this.onResizeDebounced = () => {};
  }

  componentDidMount() {
    this.onResizeDebounced = debounce(this.onResize, this.props.resizeDebounce);
    if (this.containerRef.current) {
      this.ro.observe(this.containerRef.current as Element);
    }
  }

  componentWillUnmount() {
    if (this.animationFrameID) {
      window.cancelAnimationFrame(this.animationFrameID);
    }
    this.ro.disconnect();
  }

  onResize = (entries: ResizeObserverEntry[]) => {
    if (!Array.isArray(entries)) {
      return;
    }
    if (entries.length === 0 || !entries[0]) {
      return;
    }
    const { width, height } = entries[0].contentRect;
    this.animationFrameID = window.requestAnimationFrame(() => {
      this.props.updateParentDimensions({ width, height, top: 0, left: 0 });
    });
  };

  handleResize = (entries: ResizeObserverEntry[]) => {
    if (this.initialResizeComplete) {
      this.onResizeDebounced(entries);
    } else {
      this.initialResizeComplete = true;
      this.onResize(entries);
    }
  };

  render() {
    return <div ref={this.containerRef} className="echChartResizer" />;
  }
}

const mapDispatchToProps = (dispatch: Dispatch): ResizerDispatchProps =>
  bindActionCreators(
    {
      updateParentDimensions,
    },
    dispatch,
  );

const mapStateToProps = (state: GlobalChartState): ResizerStateProps => {
  const settings = getSettingsSpecSelector(state);
  const resizeDebounce =
    settings.resizeDebounce === undefined || settings.resizeDebounce === null ? 200 : settings.resizeDebounce;
  return {
    resizeDebounce:
      !isDefined(resizeDebounce) || Number.isNaN(resizeDebounce) ? DEFAULT_RESIZE_DEBOUNCE : resizeDebounce,
  };
};

/** @internal */
export const ChartResizer = connect(mapStateToProps, mapDispatchToProps)(Resizer);
