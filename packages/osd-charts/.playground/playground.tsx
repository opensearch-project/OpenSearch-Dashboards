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
import {
  Chart,
  ScaleType,
  Position,
  Axis,
  LineSeries,
  LineAnnotation,
  RectAnnotation,
  AnnotationDomainTypes,
  LineAnnotationDatum,
  RectAnnotationDatum,
} from '../src';
import { SeededDataGenerator } from '../src/mocks/utils';

export class Playground extends React.Component<{}, { isSunburstShown: boolean }> {
  render() {
    const dg = new SeededDataGenerator();
    const data = dg.generateGroupedSeries(10, 2).map((item) => ({
      ...item,
      y1: item.y + 100,
    }));
    const lineDatum: LineAnnotationDatum[] = [{ dataValue: 321321 }];
    const rectDatum: RectAnnotationDatum[] = [{ coordinates: { x1: 100 } }];

    return (
      <>
        <div className="chart">
          <Chart>
            <Axis id="y1" position={Position.Left} title="y1" />
            <Axis id="y2" domain={{ fit: true }} groupId="g2" position={Position.Right} title="y2" />
            <Axis id="x" position={Position.Bottom} title="x" />
            <LineSeries
              id="line1"
              xScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              splitSeriesAccessors={['g']}
              data={data}
            />
            <LineSeries
              id="line2"
              groupId="g2"
              xScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y1']}
              splitSeriesAccessors={['g']}
              data={data}
            />
            <LineAnnotation id="sss" dataValues={lineDatum} domainType={AnnotationDomainTypes.XDomain} />
            <RectAnnotation id="111" dataValues={rectDatum} />
          </Chart>
        </div>
      </>
    );
  }
}
