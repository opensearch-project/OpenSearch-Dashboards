import { Chart, Datum, Partition, PartitionLayout } from '../../src';
import { mocks } from '../../src/mocks/hierarchical/index';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import { arrayToLookup } from '../../src/chart_types/partition_chart/layout/utils/calcs';
import { countryDimension } from '../../src/mocks/hierarchical/dimension_codes';
import React from 'react';

const countryLookup = arrayToLookup((d: Datum) => d.country, countryDimension);

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
          nodeLabel: () => '',
          fillLabel: {
            valueFormatter: () => '',
          },
          shape: {
            fillColor: (d: any, i: any, a: any) => {
              const shade = Math.pow(0.3 + 0.5 * (i / (a.length - 1)), 1 / 3);
              return `rgb(${Math.round(255 * shade)},${Math.round(255 * shade)},${Math.round(255 * shade)})`;
            },
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
            fillColor: 'rgba(0,0,0,0)',
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
