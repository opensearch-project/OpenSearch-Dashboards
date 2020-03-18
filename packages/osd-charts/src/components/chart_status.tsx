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
import { connect } from 'react-redux';
import { GlobalChartState } from '../state/chart_state';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { RenderChangeListener } from '../specs';

interface ChartStatusStateProps {
  rendered: boolean;
  renderedCount: number;
  onRenderChange?: RenderChangeListener;
}
class ChartStatusComponent extends React.Component<ChartStatusStateProps> {
  componentDidMount() {
    this.dispatchRenderChange();
  }
  componentDidUpdate() {
    this.dispatchRenderChange();
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
    const { rendered, renderedCount } = this.props;
    return <div className="echChartStatus" data-ech-render-complete={rendered} data-ech-render-count={renderedCount} />;
  }
}

const mapStateToProps = (state: GlobalChartState): ChartStatusStateProps => {
  return {
    rendered: state.chartRendered,
    renderedCount: state.chartRenderedCount,
    onRenderChange: getSettingsSpecSelector(state).onRenderChange,
  };
};

/** @internal */
export const ChartStatus = connect(mapStateToProps)(ChartStatusComponent);
