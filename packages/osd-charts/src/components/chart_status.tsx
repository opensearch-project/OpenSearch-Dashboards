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

import React from 'react';
import { connect } from 'react-redux';

import { RenderChangeListener } from '../specs';
import { GlobalChartState } from '../state/chart_state';
import { globalSelectorCache } from '../state/create_selector';
import { getDebugStateSelector } from '../state/selectors/get_debug_state';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { DebugState } from '../state/types';

interface ChartStatusStateProps {
  chartId: string;
  rendered: boolean;
  renderedCount: number;
  onRenderChange?: RenderChangeListener;
  debugState: DebugState | null;
}

class ChartStatusComponent extends React.Component<ChartStatusStateProps> {
  componentDidMount() {
    this.dispatchRenderChange();
  }

  componentDidUpdate() {
    this.dispatchRenderChange();
  }

  componentWillUnmount() {
    globalSelectorCache.removeKeyFromAll(this.props.chartId);
  }

  dispatchRenderChange = () => {
    const { onRenderChange, rendered } = this.props;
    if (onRenderChange) {
      window.requestAnimationFrame(() => {
        onRenderChange(rendered);
      });
    }
  };

  render() {
    const { rendered, renderedCount, debugState } = this.props;
    const debugStateString: string | null = debugState && JSON.stringify(debugState);

    return (
      <div
        className="echChartStatus"
        data-ech-render-complete={rendered}
        data-ech-render-count={renderedCount}
        data-ech-debug-state={debugStateString}
      />
    );
  }
}

const mapStateToProps = (state: GlobalChartState): ChartStatusStateProps => {
  const { onRenderChange, debugState } = getSettingsSpecSelector(state);

  return {
    chartId: state.chartId,
    rendered: state.chartRendered,
    renderedCount: state.chartRenderedCount,
    onRenderChange,
    debugState: debugState ? getDebugStateSelector(state) : null,
  };
};

/** @internal */
export const ChartStatus = connect(mapStateToProps)(ChartStatusComponent);
