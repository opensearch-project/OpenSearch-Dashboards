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

import { Chart, Datum, Partition, PartitionLayout } from '../../src';
import { mocks } from '../../src/mocks/hierarchical/index';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import { arrayToLookup } from '../../src/chart_types/partition_chart/layout/utils/calcs';
import { countryDimension } from '../../src/mocks/hierarchical/dimension_codes';
import React from 'react';
import { regionLookup } from '../utils/utils';

const countryLookup = arrayToLookup((d: Datum) => d.country, countryDimension);

const fillColor = ({ parent }: any) => {
  const root = parent.parent;
  const siblingCountLayer1 = root.children.length;
  const i = parent.sortIndex;
  const shade = Math.pow(0.3 + 0.5 * (i / (siblingCountLayer1 - 1)), 1 / 3);
  return `rgb(${Math.round(255 * shade)},${Math.round(255 * shade)},${Math.round(255 * shade)})`;
};

export const example = () => (
  <Chart
    className="story-chart"
    size={
      {
        /*height: 800*/
      }
    }
  >
    <Partition
      id="spec_1"
      data={mocks.sunburst}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.substr(0, 2),
          nodeLabel: (d: any) => regionLookup[d].regionName,
          fillLabel: {
            valueFormatter: () => '',
            textColor: 'black',
          },
          shape: {
            fillColor: 'rgba(0,0,0,0)',
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            textColor: 'rgb(60,60,60,1)',
            textInvertible: false,
            fontWeight: 600,
            fontStyle: 'normal',
            fontFamily: 'Courier New',
            fontVariant: 'normal',
          },
          shape: {
            fillColor,
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        minFontSize: 8,
        maxFontSize: 14,
        idealFontSizeJump: 1.05,
        outerSizeRatio: 1,
      }}
    />
  </Chart>
);
