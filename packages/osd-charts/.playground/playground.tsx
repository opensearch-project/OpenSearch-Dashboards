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
/* eslint-disable no-console */
import React from 'react';

import { Chart, Heatmap, HeatmapConfig, RecursivePartial, ScaleType, Settings } from '../src';
import { HeatmapSpec } from '../src/chart_types/heatmap/specs';
import { BABYNAME_DATA } from '../src/utils/data_samples/babynames';

export const SWIM_LANE_DATA = [
  {
    laneLabel: 'Overall',
    time: 1572825600,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572829200,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572832800,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572836400,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572840000,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572843600,
    value: 1.066358,
  },
  {
    laneLabel: 'Overall',
    time: 1572847200,
    value: 1.813946,
  },
  {
    laneLabel: 'Overall',
    time: 1572850800,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572854400,
    value: 0.05191579,
  },
  {
    laneLabel: 'Overall',
    time: 1572858000,
    value: 1.63678,
  },
  {
    laneLabel: 'Overall',
    time: 1572861600,
    value: 2.031104,
  },
  {
    laneLabel: 'Overall',
    time: 1572865200,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572868800,
    value: 1.09738,
  },
  {
    laneLabel: 'Overall',
    time: 1572872400,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572876000,
    value: 0.2232534,
  },
  {
    laneLabel: 'Overall',
    time: 1572879600,
    value: 19.49729,
  },
  {
    laneLabel: 'Overall',
    time: 1572883200,
    value: 34.10214,
  },
  {
    laneLabel: 'Overall',
    time: 1572886800,
    value: 0,
  },
  {
    laneLabel: 'Overall',
    time: 1572890400,
    value: 55.18972,
  },
  {
    laneLabel: 'Overall',
    time: 1572894000,
    value: 0.9794427671013135,
  },
  {
    laneLabel: 'Overall',
    time: 1572897600,
    value: 1.2711643855082817,
  },
  {
    laneLabel: 'Overall',
    time: 1572901200,
    value: 0.12110509647944609,
  },
  {
    laneLabel: 'Overall',
    time: 1572904800,
    value: 0.9807310648820486,
  },
  {
    laneLabel: 'Overall',
    time: 1572908400,
    value: 1.0793822204067567,
  },
];
export class Playground extends React.Component<any, { highlightedData?: HeatmapSpec['highlightedData'] }> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  onBrushEnd: HeatmapConfig['onBrushEnd'] = (e) => {
    console.log('___onBrushEnd___', e);
    this.setState({
      highlightedData: { x: e.x as any[], y: e.y as any[] },
    });
  };

  render() {
    const heatmapConfig: RecursivePartial<HeatmapConfig> = {
      grid: {
        cellHeight: {
          max: 30,
        },
        stroke: {
          width: 1,
          color: '#D3DAE6',
        },
      },
      cell: {
        maxWidth: 'fill',
        maxHeight: 'fill',
        label: {
          visible: false,
        },
        border: {
          stroke: '#D3DAE6',
          strokeWidth: 0,
        },
      },
      yAxisLabel: {
        name: 'instance',
        visible: true,
        width: 170,
        // eui color subdued
        fill: `#6a717d`,
        padding: 8,
      },
      onBrushEnd: this.onBrushEnd,
      maxLegendHeight: 20,
    };
    console.log(
      BABYNAME_DATA.filter(([year]) => year > 1950).map((d) => {
        return [d[0], d[1], d[2], -d[3]];
      }),
    );
    return (
      <div>
        <div className="chart" style={{ height: '88px', overflow: 'auto' }}>
          <Chart>
            <Settings
              onElementClick={console.log}
              showLegend
              legendPosition="top"
              brushAxis="both"
              xDomain={{ min: 1572825600000, max: 1572912000000, minInterval: 1800000 }}
            />
            <Heatmap
              id="heatmap1"
              name="maxAnomalyScore"
              ranges={[0, 3, 25, 50, 75]}
              colorScale={ScaleType.Threshold}
              colors={['#ffffff', '#d2e9f7', '#8bc8fb', '#fdec25', '#fba740', '#fe5050']}
              data={SWIM_LANE_DATA.map((v) => ({ ...v, time: v.time * 1000 }))}
              highlightedData={this.state.highlightedData}
              xAccessor="time"
              yAccessor={(d) => d.laneLabel}
              valueAccessor="value"
              valueFormatter={(d) => d.toFixed(2)}
              ySortPredicate="numAsc"
              xScaleType={ScaleType.Time}
              config={heatmapConfig}
            />
          </Chart>
        </div>
        <br />
        <div className="chart" style={{ height: '500px' }}>
          <Chart>
            <Settings
              onElementClick={console.log}
              showLegend
              legendPosition="left"
              onBrushEnd={console.log}
              brushAxis="both"
            />
            <Heatmap
              id="heatmap2"
              colorScale={ScaleType.Linear}
              colors={['yellow', 'red']}
              data={
                BABYNAME_DATA.filter(([year]) => year > 1950)
                // .map((d, i) => {
                //   return [d[0], d[1], d[2], d[3] > 20000 ? -d[3] : d[3]];
                // })
              }
              xAccessor={(d) => d[2]}
              yAccessor={(d) => d[0]}
              valueAccessor={(d) => d[3]}
              valueFormatter={(value) => value.toFixed(0.2)}
              xSortPredicate="alphaAsc"
              config={{
                grid: {
                  cellHeight: {
                    min: 40,
                    max: 40, // 'fill',
                  },
                  stroke: {
                    width: 0,
                  },
                },
                cell: {
                  maxWidth: 'fill',
                  maxHeight: 20,
                  label: {
                    visible: true,
                  },
                  border: {
                    stroke: 'white',
                    strokeWidth: 1,
                  },
                },
                yAxisLabel: {
                  visible: true,
                  width: 'auto',
                  textColor: '#6a717d',
                },
              }}
            />
          </Chart>
        </div>
      </div>
    );
  }
}
/* eslint-enable no-console */
