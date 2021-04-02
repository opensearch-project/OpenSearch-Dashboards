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

import { Chart, BarSeries, ScaleType, LineAnnotation, AnnotationDomainTypes, LineAnnotationDatum } from '../src';

function generateAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({ dataValue: value, details: `detail-${index}` }));
}
export class Playground extends React.Component {
  render() {
    return (
      <div className="App">
        <Chart size={[500, 200]}>
          <LineAnnotation
            domainType={AnnotationDomainTypes.XDomain}
            id="ann"
            dataValues={[{ dataValue: 'bags' }]}
            marker={<div style={{ background: 'red' }}>hello</div>}
            // markerPosition="top"
          />
          <LineAnnotation
            domainType={AnnotationDomainTypes.YDomain}
            id="ann1"
            dataValues={generateAnnotationData([30])}
            marker={<div style={{ background: 'yellow' }}>Horizontal</div>}
            // markerPosition="right"
          />
          <BarSeries
            id="bars"
            name="amount"
            xScaleType={ScaleType.Ordinal}
            xAccessor="x"
            yAccessors={['y']}
            data={[
              { x: 'trousers', y: 390, val: 1222 },
              { x: 'watches', y: 23, val: 1222 },
              { x: 'bags', y: 750, val: 1222 },
              { x: 'cocktail dresses', y: 854, val: 1222 },
            ]}
          />
        </Chart>
      </div>
    );
  }
}
