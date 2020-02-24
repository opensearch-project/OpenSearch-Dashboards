import { Chart, Datum, Partition, PartitionLayout } from '../src';
import { mocks } from '../src/mocks/hierarchical/index';
import { config } from '../src/chart_types/partition_chart/layout/config/config';
import { arrayToLookup, hueInterpolator } from '../src/chart_types/partition_chart/layout/utils/calcs';
import { countryDimension, productDimension, regionDimension } from '../src/mocks/hierarchical/dimension_codes';
import { palettes } from '../src/mocks/hierarchical/palettes';
import React from 'react';
import { ShapeTreeNode } from '../src/chart_types/partition_chart/layout/types/viewmodel_types';
import { categoricalFillColor, colorBrewerCategoricalPastel12 } from './utils/utils';

const productLookup = arrayToLookup((d: Datum) => d.sitc1, productDimension);
const regionLookup = arrayToLookup((d: Datum) => d.region, regionDimension);
const countryLookup = arrayToLookup((d: Datum) => d.country, countryDimension);

// style calcs
const interpolatorCET2s = hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, 0.7]));
const interpolatorTurbo = hueInterpolator(palettes.turbo.map(([r, g, b]) => [r, g, b, 0.7]));

const defaultFillColor = (colorMaker: any) => (d: any, i: number, a: any[]) => colorMaker(i / (a.length + 1));

export default {
  title: 'Treemap',
  parameters: {
    info: {
      source: false,
    },
  },
};

export const OneLayer = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_1'}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: {
            textInvertible: true,
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
          },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
      }}
    />
  </Chart>
);
OneLayer.story = {
  name: 'One-layer, resizing treemap',
};

export const OneLayer2 = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_1'}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: {
            textInvertible: true,
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            valueFont: {
              fontWeight: 100,
            },
          },
          shape: {
            fillColor: (d: ShapeTreeNode) => categoricalFillColor(colorBrewerCategoricalPastel12)(d.sortIndex),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
      }}
    />
  </Chart>
);
OneLayer2.story = {
  name: 'One-layer, ColorBrewer treemap',
};

export const MidTwoLayers = () => (
  <Chart
    className={'story-chart'}
    size={
      {
        /*height: 800*/
      }
    }
  >
    <Partition
      id={'spec_1'}
      data={mocks.sunburst}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.substr(0, 2),
          nodeLabel: (d: any) => regionLookup[d].regionName,
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            fontFamily: 'Phosphate-Inline',
            textColor: 'yellow',
            textInvertible: false,
          },
          shape: { fillColor: 'rgba(0,0,0,0)' },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            textColor: 'black',
            textInvertible: false,
            fontWeight: 200,
            fontStyle: 'normal',
            fontFamily: 'Helvetica',
            fontVariant: 'small-caps',
            valueFont: { fontWeight: 400, fontStyle: 'italic' },
          },
          shape: {
            fillColor: (d: ShapeTreeNode) => {
              // primarily, pick color based on parent's index, but then perturb by the index within the parent
              return interpolatorTurbo(
                (d.parent.sortIndex + d.sortIndex / d.parent.children.length) / (d.parent.parent.children.length + 1),
              );
            },
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        minFontSize: 4,
        maxFontSize: 84,
        idealFontSizeJump: 1.15,
        outerSizeRatio: 1,
      }}
    />
  </Chart>
);
MidTwoLayers.story = {
  name: 'Midsize two-layer treemap',
};

export const TwoLayersStressTest = () => (
  <Chart
    className={'story-chart'}
    size={
      {
        /*
      height: 800,
        */
      }
    }
  >
    <Partition
      id={'spec_1'}
      data={mocks.sunburst}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: any) => productLookup[d].name.toUpperCase(),
          fillLabel: {
            valueFormatter: () => '',
            fontFamily: 'Phosphate-Inline',
            textColor: 'rgba(255,255,0, 0.6)',
            textInvertible: true,
          },
          shape: {
            fillColor: (d: ShapeTreeNode) => {
              // primarily, pick color based on parent's index, but then perturb by the index within the parent
              return interpolatorTurbo(d.sortIndex / (d.parent.children.length + 1));
            },
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            textColor: 'black',
            textInvertible: true,
            fontWeight: 900,
            fontStyle: 'normal',
            fontFamily: 'Helvetica',
            fontVariant: 'normal',
            valueFont: {
              fontWeight: 100,
            },
          },
          shape: {
            fillColor: (d: ShapeTreeNode) => {
              // primarily, pick color based on parent's index, but then perturb by the index within the parent
              return interpolatorTurbo(
                (d.parent.sortIndex + d.sortIndex / d.parent.children.length) / (d.parent.parent.children.length + 1),
              );
            },
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        minFontSize: 4,
        maxFontSize: 84,
        idealFontSizeJump: 1.35,
        outerSizeRatio: 1,
      }}
    />
  </Chart>
);
TwoLayersStressTest.story = {
  name: 'Two-layer treemap stress test',
};

export const MultiColor = () => (
  <Chart
    className={'story-chart'}
    size={
      {
        /*height: 800*/
      }
    }
  >
    <Partition
      id={'spec_1'}
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
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            textColor: 'rgb(60,60,60,1)',
            textInvertible: false,
            fontWeight: 100,
            fontStyle: 'normal',
            fontFamily: 'Din Condensed',
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
        minFontSize: 4,
        maxFontSize: 84,
        idealFontSizeJump: 1.05,
        outerSizeRatio: 1,
      }}
    />
  </Chart>
);
MultiColor.story = {
  name: 'Each color identifies a region in a (future) legend',
};

export const CustomStyle = () => (
  <Chart
    className={'story-chart'}
    size={
      {
        /*height: 800*/
      }
    }
  >
    <Partition
      id={'spec_1'}
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
CustomStyle.story = {
  name: 'Custom style',
};
