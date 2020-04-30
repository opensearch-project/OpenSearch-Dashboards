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
import { Chart, Axis, Position, Settings, AreaSeries, ScaleType, DataGenerator } from '../src';
import { getRandomNumberGenerator } from '../src/mocks/utils';

const dg = new DataGenerator(500, getRandomNumberGenerator());
const basicData = dg.generateBasicSeries();
export class Playground extends React.Component {
  state = {
    data: basicData,
  };
  onBrushEnd = () => {
    this.setState({ data: [] });
    setTimeout(() => {
      this.setState({
        data: dg.generateBasicSeries(),
      });
    }, 100);
  };
  render() {
    return (
      <div className="testing">
        <div className="chart">
          <Chart className="story-chart">
            <Settings onBrushEnd={this.onBrushEnd} />
            <Axis id="bottom" position={Position.Bottom} title="bottom" showOverlappingTicks={true} />
            <Axis id="left" title="left" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
            <Axis id="top" position={Position.Top} title="top" showOverlappingTicks={true} />
            <Axis id="right" title="right" position={Position.Right} tickFormat={(d) => Number(d).toFixed(2)} />
            {this.state.data.length > 0 && (
              <AreaSeries
                id="lines"
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={['y']}
                data={this.state.data}
              />
            )}
          </Chart>
        </div>
      </div>
    );
  }
}
