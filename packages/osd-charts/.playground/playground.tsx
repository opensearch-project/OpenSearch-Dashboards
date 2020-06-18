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
  Chart,
  Settings,
  Axis,
  Position,
  BarSeries,
  ScaleType,
  PointerEvent,
  LineSeries,
  CustomTooltip,
  TooltipType,
  LineAnnotation, AnnotationDomainTypes,
} from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';


const TestCustomTooltip: CustomTooltip = (props) => (
  <div style={{ border: '1px solid black', background: 'white', fontSize: 12, padding: 4 }}>
    <p>Testing a custom tooltip </p>
    <ul>
      {
        props.values.map((value) => (
          <li key={value.label} style={{ color: value.color }}>
            {value.label}
            {' - '}
            {value.value}
          </li>
        ))
      }
    </ul>
  </div>
);
export const Playground = () => {
  const ref1 = React.createRef<Chart>();
  const ref2 = React.createRef<Chart>();
  const ref3 = React.createRef<Chart>();
  const ref4 = React.createRef<Chart>();

  const pointerUpdate = (event: PointerEvent) => {
    if (ref1.current) {
      ref1.current.dispatchExternalPointerEvent(event);
    }
    if (ref2.current) {
      ref2.current.dispatchExternalPointerEvent(event);
    }
    if (ref3.current) {
      ref3.current.dispatchExternalPointerEvent(event);
    }
    if (ref4.current) {
      ref4.current.dispatchExternalPointerEvent(event);
    }
  };

  return (
    <div className="testing">
      <button
        type="button"
        onClick={() => {
          // if (ref1.current) {
          //   ref1.current.dispatchExternalPointerEvent({
          //     chartId: 'chart1',
          //     type: 'Over',
          //     scale: 'time',
          //     value: 1551438420000,
          //   });
          // }
          if (ref1.current) {
            ref1.current.dispatchExternalPointerEvent({ chartId: 'chart2', type: 'Over', unit: undefined, scale: 'time', value: 1551439800000 });
          }
        }}
      >
        out

      </button>

      <button
        type="button"
        onClick={() => {
          if (ref1.current) {
            ref1.current.dispatchExternalPointerEvent({ chartId: 'chart2', type: 'Over', unit: undefined, scale: 'time', value: 1551439770000 });
          }
        }}
      >
        valid

      </button>

      <div className="chart">
        <Chart className="story-chart" ref={ref1} id="chart1">
          <Settings onPointerUpdate={pointerUpdate} externalPointerEvents={{ tooltip: { visible: true } }} />
          <Axis
            id="bottom"
            position={Position.Bottom}
            title="External tooltip VISIBLE"

          />
          <Axis id="left2" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />
          <LineAnnotation
            marker={<div>Hello</div>}
            dataValues={[{ dataValue: KIBANA_METRICS.metrics.kibana_os_load[0].data[10][0], details: 'hello' }]}
            id="test"
            domainType={AnnotationDomainTypes.XDomain}
          />
          <BarSeries
            id="bars"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(3, 60)}
          />
        </Chart>

      </div>

      <div className="chart">
        <Chart className="story-chart" ref={ref2} id="chart2">
          <Settings onPointerUpdate={pointerUpdate} externalPointerEvents={{ tooltip: { visible: true, boundary: 'chart' } }} />
          <Axis
            id="bottom"
            position={Position.Bottom}
            title="External tooltip VISIBLE - boundary => chart"
          />
          <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

          <BarSeries
            id="bars"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
          />
        </Chart>

      </div>


      <div className="chart">
        <Chart className="story-chart" ref={ref3}>
          <Settings
            onPointerUpdate={pointerUpdate}
            externalPointerEvents={{ tooltip: { visible: true, boundary: 'chart' } }}
            tooltip={{
              type: TooltipType.Follow,
              customTooltip: TestCustomTooltip,
            }}
          />
          <Axis
            id="bottom"
            position={Position.Bottom}
            title="External tooltip VISIBLE - boundary => chart"
          />
          <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

          <LineSeries
            id="bars"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 50)}
          />
          <LineSeries
            id="bars2"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[2].data.slice(20, 30)}
          />
        </Chart>
      </div>

      <div className="chart">
        <Chart className="story-chart" ref={ref4} id="chart4">
          <Settings onPointerUpdate={pointerUpdate} tooltip={{ type: TooltipType.None }} externalPointerEvents={{ tooltip: { visible: false } }} />
          <Axis
            id="bottom"
            position={Position.Bottom}
            title="External tooltip HIDDEN"
          />
          <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

          <LineSeries
            id="bars"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 50)}
          />
          <LineSeries
            id="bars2"
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            data={KIBANA_METRICS.metrics.kibana_os_load[2].data.slice(20, 30)}
          />
        </Chart>
      </div>
    </div>
  );
};
