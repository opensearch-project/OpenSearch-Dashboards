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
import { Chart, Partition, Settings, PartitionLayout, XYChartElementEvent, PartitionElementEvent } from '../src';

export class Playground extends React.Component {
  onElementClick = (elements: (XYChartElementEvent | PartitionElementEvent)[]) => {
    // eslint-disable-next-line no-console
    console.log(elements);
  };
  render() {
    return (
      <div className="chart">
        <Chart>
          <Settings onElementClick={this.onElementClick} />
          <Partition
            id="111"
            config={{
              partitionLayout: PartitionLayout.treemap,
            }}
            valueAccessor={(d: { v: number }) => {
              return d.v;
            }}
            data={[
              { g1: 'a', g2: 'a', v: 1 },
              { g1: 'a', g2: 'b', v: 1 },
              { g1: 'b', g2: 'a', v: 1 },
              { g1: 'b', g2: 'b', v: 1 },
            ]}
            layers={[
              {
                groupByRollup: (datum: { g1: string }) => datum.g1,
              },
              {
                groupByRollup: (datum: { g2: string }) => datum.g2,
              },
            ]}
          />
        </Chart>
      </div>
    );
  }
}
