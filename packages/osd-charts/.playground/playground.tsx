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

import { Chart, Settings, Partition, PartitionLayout } from '../src';

export class Playground extends React.Component {
  render() {
    return (
      <div className="chart">
        <Chart className="story-chart">
          <Settings showLegend flatLegend={false} />
          <Partition
            id="spec_1"
            data={[
              { cat1: 'A', cat2: 'A', val: 1 },
              { cat1: 'A', cat2: 'B', val: 1 },
              { cat1: 'B', cat2: 'A', val: 1 },
              { cat1: 'B', cat2: 'B', val: 1 },
              { cat1: 'C', cat2: 'A', val: 1 },
              { cat1: 'C', cat2: 'B', val: 1 },
            ]}
            valueAccessor={(d: any) => d.val as number}
            layers={[
              {
                groupByRollup: (d: any) => d.cat1,
              },
              {
                groupByRollup: (d: any) => d.cat2,
              },
            ]}
            config={{
              partitionLayout: PartitionLayout.sunburst,
            }}
          />
        </Chart>
      </div>
    );
  }
}
