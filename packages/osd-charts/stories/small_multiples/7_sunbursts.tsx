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

import { boolean, select, number } from '@storybook/addon-knobs';
import React from 'react';

import {
  Chart,
  Datum,
  GroupBy,
  MODEL_KEY,
  Partition,
  PartitionLayout,
  Settings,
  ShapeTreeNode,
  SmallMultiples,
} from '../../src';
import { config } from '../../src/chart_types/partition_chart/layout/config';
import { mocks } from '../../src/mocks/hierarchical';
import { STORYBOOK_LIGHT_THEME } from '../shared';
import {
  discreteColor,
  colorBrewerCategoricalStark9,
  countryLookup,
  productLookup,
  regionLookup,
} from '../utils/utils';

const data = mocks.sunburst; // .filter((d) => countryLookup[d.dest].continentCountry.slice(0, 2) === 'eu');

export const Example = () => {
  const layout = select(
    'Inner breakdown layout',
    {
      horizontal: 'h',
      vertical: 'v',
      zigzag: 'z',
    },
    'z',
  );

  return (
    <Chart className="story-chart">
      <Settings
        showLegend={boolean('Show legend', false)}
        legendStrategy="pathWithDescendants"
        flatLegend={false}
        theme={STORYBOOK_LIGHT_THEME}
      />
      <GroupBy
        id="split"
        by={(_, d: Datum) => countryLookup[d.dest].continentCountry.slice(0, 2)}
        format={(name) => regionLookup[name].regionName}
        sort={select('Panel order', { alphaAsc: 'alphaAsc', alphaDesc: 'alphaDesc' }, 'alphaAsc')}
      />
      <SmallMultiples
        id="sm"
        splitHorizontally={layout === 'h' ? 'split' : undefined}
        splitVertically={layout === 'v' ? 'split' : undefined}
        splitZigzag={layout === 'z' ? 'split' : undefined}
        style={{
          horizontalPanelPadding: {
            outer: number('Horizontal outer pad', 0.15, {
              range: true,
              min: 0,
              max: 0.5,
              step: 0.05,
            }),
            inner: number('Horizontal inner pad', 0.05, {
              range: true,
              min: 0,
              max: 0.5,
              step: 0.05,
            }),
          },
          verticalPanelPadding: {
            outer: number('Vertical outer pad', 0.15, {
              range: true,
              min: 0,
              max: 0.5,
              step: 0.05,
            }),
            inner: number('Vertical inner pad', 0.05, {
              range: true,
              min: 0,
              max: 0.5,
              step: 0.05,
            }),
          },
        }}
      />
      <Partition
        id="spec_2"
        data={data}
        valueAccessor={(d: Datum) => d.exportVal as number}
        valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`}
        smallMultiples="sm"
        layers={
          [
            {
              groupByRollup: (d: Datum) => d.sitc1,
              nodeLabel: (d: any) => productLookup[d].name,
              fillLabel: { maximizeFontSize: true },
              shape: {
                fillColor: (d: ShapeTreeNode) => discreteColor(colorBrewerCategoricalStark9, 0.7)(d.sortIndex),
              },
            },
            {
              groupByRollup: (d: Datum) => d.dest,
              nodeLabel: (d: any) => countryLookup[d].name,
              fillLabel: { maximizeFontSize: true },
              shape: {
                fillColor: (d: ShapeTreeNode) =>
                  discreteColor(colorBrewerCategoricalStark9, 0.3)(d[MODEL_KEY].sortIndex),
              },
            },
          ] /* .slice(layerFrom, layerTo) */
        }
        config={{
          partitionLayout: PartitionLayout.sunburst,
          linkLabel: {
            maxCount: 0,
          },
          fontFamily: 'Arial',
          fillLabel: {
            valueFormatter: (d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`,
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
};
