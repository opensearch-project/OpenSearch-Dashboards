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

import {
  AnnotationDomainTypes,
  Axis,
  BarSeries,
  Chart,
  LineAnnotation,
  LineAnnotationDatum,
  ScaleType,
  Settings,
} from '../src';
import { Icon } from '../src/components/icons/icon';
import { Position } from '../src/utils/commons';
import { arrayKnobs } from '../stories/utils/knobs';

function generateAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({ dataValue: value, details: `detail-${index}` }));
}
const data = arrayKnobs('data values', [2.5, 7.2]);
const dataValues = generateAnnotationData(data);

export class Playground extends React.Component {
  render() {
    return (
      <div className="chart">
        <Chart className="story-chart">
          <Settings showLegend showLegendExtra />
          <LineAnnotation
            id="annotation_1"
            domainType={AnnotationDomainTypes.XDomain}
            dataValues={dataValues}
            marker={<Icon type="alert" />}
          />
          <LineAnnotation id="1" domainType={AnnotationDomainTypes.YDomain} dataValues={dataValues} />
          <Axis id="horizontal" position={Position.Bottom} title="x-domain axis" />
          <Axis id="left" title="y-domain axis left" position={Position.Left} />
          <Axis id="right" title="y-domain axis right" position={Position.Right} />
          <BarSeries
            id="bars"
            groupId="group1"
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={[
              { x: 0, y: 0 },
              { x: 1, y: 5 },
              { x: 3, y: 20 },
            ]}
          />
          <BarSeries
            id="bars1"
            groupId="group2"
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={[
              { x: 0, y: 100 },
              { x: 1, y: 50 },
              { x: 3, y: 200 },
            ]}
          />
        </Chart>
      </div>
    );
  }
}
