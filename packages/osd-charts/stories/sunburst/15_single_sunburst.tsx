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

import { Chart, Datum, Partition, PartitionLayout, Settings } from '../../src';
import { mocks } from '../../src/mocks/hierarchical/index';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import React from 'react';
import { ShapeTreeNode } from '../../src/chart_types/partition_chart/layout/types/viewmodel_types';
import {
  categoricalFillColor,
  colorBrewerCategoricalStark9,
  countryLookup,
  productLookup,
  regionLookup,
} from '../utils/utils';

export const example = () => (
  <Chart className="story-chart" /*size={{ width: 1200, height: 800 }}*/>
    <Settings showLegend />
    <Partition
      id="spec_1"
      data={mocks.miniSunburst.slice(0, 1)}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: any) => productLookup[d].name,
          shape: {
            fillColor: (d: ShapeTreeNode) => {
              return categoricalFillColor(colorBrewerCategoricalStark9, 0.7)(d.sortIndex);
            },
          },
        },
        {
          groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.substr(0, 2),
          nodeLabel: (d: any) => regionLookup[d].regionName,
          shape: {
            fillColor: (d: ShapeTreeNode) => {
              return categoricalFillColor(colorBrewerCategoricalStark9, 0.5)(d.parent.sortIndex);
            },
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          shape: {
            fillColor: (d: ShapeTreeNode) => {
              return categoricalFillColor(colorBrewerCategoricalStark9, 0.3)(d.parent.parent.sortIndex);
            },
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        linkLabel: {
          maxCount: 0,
          fontSize: 14,
        },
        fontFamily: 'Arial',
        fillLabel: {
          valueFormatter: (d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
          fontStyle: 'italic',
          textInvertible: true,
          fontWeight: 900,
          valueFont: {
            fontFamily: 'Menlo',
            fontStyle: 'normal',
            fontWeight: 100,
          },
        },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        minFontSize: 1,
        idealFontSizeJump: 1.1,
        outerSizeRatio: 1,
        emptySizeRatio: 0,
        circlePadding: 4,
        backgroundColor: 'rgba(229,229,229,1)',
      }}
    />
  </Chart>
);
