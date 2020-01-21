import { Chart, Datum, Partition, PartitionLayout } from '../src';
import { mocks } from '../src/mocks/hierarchical/index';
import { config } from '../src/chart_types/partition_chart/layout/config/config';
import { arrayToLookup, hueInterpolator } from '../src/chart_types/partition_chart/layout/utils/calcs';
import { productDimension, regionDimension, countryDimension } from '../src/mocks/hierarchical/dimension_codes';
import { getRandomNumber } from '../src/mocks/utils';
import { palettes } from '../src/mocks/hierarchical/palettes';
import React from 'react';

const productLookup = arrayToLookup((d: Datum) => d.sitc1, productDimension);
const regionLookup = arrayToLookup((d: Datum) => d.region, regionDimension);
const countryLookup = arrayToLookup((d: Datum) => d.country, countryDimension);

export default {
  title: 'Sunburst',
  parameters: {
    info: {
      source: false,
    },
  },
};

// style calcs
const interpolatorCET2s = hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, 0.8]));
const interpolatorTurbo = hueInterpolator(palettes.turbo.map(([r, g, b]) => [r, g, b, 0.8]));

const defaultFillColor = (colorMaker: any) => (d: any, i: number, a: any[]) => colorMaker(i / (a.length + 1));

export const SimplePieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorTurbo),
          },
        },
      ]}
    />
  </Chart>
);
SimplePieChart.story = {
  name: 'Most basic PieChart',
  info: {
    source: false,
  },
};

export const PieChartWithFillLabels = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        linkLabel: {
          maxCount: 32,
          fontSize: 14,
        },
        fontFamily: 'Arial',
        fillLabel: {
          formatter: (d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`,
          fontStyle: 'italic',
        },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        minFontSize: 1,
        idealFontSizeJump: 1.1,
        outerSizeRatio: 0.9, // - 0.5 * Math.random(),
        emptySizeRatio: 0,
        circlePadding: 4,
        backgroundColor: 'rgba(229,229,229,1)',
      }}
    />
  </Chart>
);

PieChartWithFillLabels.story = {
  name: 'Pie chart with fill labels',
};

export const DonutChartWithFillLabels = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        linkLabel: {
          maxCount: 32,
          fontSize: 14,
        },
        fontFamily: 'Arial',
        fillLabel: {
          formatter: (d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`,
          fontStyle: 'italic',
        },
        margin: { top: 0, bottom: 0, left: 0.2, right: 0 },
        minFontSize: 1,
        idealFontSizeJump: 1.1,
        outerSizeRatio: 0.9, // - 0.5 * Math.random(),
        emptySizeRatio: 0.4,
        circlePadding: 4,
        backgroundColor: 'rgba(229,229,229,1)',
      }}
    />
  </Chart>
);
DonutChartWithFillLabels.story = {
  name: 'Donut chart with fill labels',
};

export const PieChartLabels = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={[
        { sitc1: 'Machinery and transport equipment', exportVal: 5 },
        { sitc1: 'Mineral fuels, lubricants and related materials', exportVal: 4 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d))}`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          // nodeLabel: (d: Datum) => d,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
PieChartLabels.story = {
  name: 'Pie chart with direct text labels instead of dimensions lookup',
};

export const SomeZeroValueSlice = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie
        .slice(0, 2)
        .concat(mocks.pie.slice(2, 4).map((s) => ({ ...s, exportVal: 0 })))
        .concat(mocks.pie.slice(4))}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
SomeZeroValueSlice.story = {
  name: 'Some slices has a zero value',
};

export const SunburstTwoLayers = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.sunburst}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.substr(0, 2),
          nodeLabel: (d: any) => regionLookup[d].regionName,
          fillLabel: {
            fontFamily: 'Impact',
            textInvertible: true,
            formatter: (d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000000))}\xa0Tn`,
          },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
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
          formatter: (d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`,
          fontStyle: 'italic',
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

SunburstTwoLayers.story = {
  name: 'Sunburst with two layers',
};

export const SunburstThreeLayers = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.miniSunburst}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: any) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
        {
          groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.substr(0, 2),
          nodeLabel: (d: any) => regionLookup[d].regionName,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
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
          formatter: (d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`,
          fontStyle: 'italic',
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
SunburstThreeLayers.story = {
  name: 'Sunburst with three layers',
};

export const TwoSlicesPieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie.slice(0, 2)}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
TwoSlicesPieChart.story = {
  name: 'Pie Chart with two slices',
};

export const LargeSmallPieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={[
        { sitc1: 'Machinery and transport equipment', exportVal: 280 },
        { sitc1: 'Mineral fuels, lubricants and related materials', exportVal: 80 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d))}`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => d,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        clockwiseSectors: true,
        specialFirstInnermostSector: false,
        outerSizeRatio: 1,
      }}
    />
  </Chart>
);
LargeSmallPieChart.story = {
  name: 'Pie chart with one large and one small slice',
};
export const VeryLargeSmallPieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={[
        { sitc1: 'Machinery and transport equipment', exportVal: 9 },
        { sitc1: 'Mineral fuels, lubricants and related materials', exportVal: 1 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d))}`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => d,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
VeryLargeSmallPieChart.story = {
  name: 'Pie chart with one very large and one very small slice',
};

export const BigEmptyPieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={[
        { sitc1: '7', exportVal: 999999 },
        { sitc1: '3', exportVal: 1 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d))}`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
BigEmptyPieChart.story = {
  name: 'Pie chart with one near-full and one near-zero slice',
};

export const FullZeroSlicePieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={[
        { sitc1: '7', exportVal: 1000000 },
        { sitc1: '3', exportVal: 0 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d))}`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
FullZeroSlicePieChart.story = {
  name: 'Pie chart with one full and one zero slice',
};
export const SingleSlicePieChart = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie.slice(0, 1)}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
SingleSlicePieChart.story = {
  name: 'Pie chart with a single slice',
};
export const NoSliceNoPie = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={[]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
NoSliceNoPie.story = {
  name: 'No pie chart if no slices',
};
export const NegativeNoPie = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie
        .slice(0, 2)
        .concat(mocks.pie.slice(2, 3).map((s) => ({ ...s, exportVal: -0.1 })))
        .concat(mocks.pie.slice(3))}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
NegativeNoPie.story = {
  name: 'No pie chart if some slices are negative',
};
export const TotalZeroNoPie = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie.map((s) => ({ ...s, exportVal: 0 }))}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
TotalZeroNoPie.story = {
  name: 'No pie chart if total is zero',
};

export const HighNumberOfSlice = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.manyPie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.origin,
          nodeLabel: (d: Datum) => countryLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        linkLabel: { maxCount: 15 },
      }}
    />
  </Chart>
);
HighNumberOfSlice.story = {
  name: 'Hundreds of slices, vanishing & tapering borders',
};

export const CounterClockwiseSpecial = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        clockwiseSectors: false,
      }}
    />
  </Chart>
);
CounterClockwiseSpecial.story = {
  name: 'Counterclockwise, special 1st',
};

export const ClockwiseNoSpecial = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        specialFirstInnermostSector: false,
      }}
    />
  </Chart>
);
ClockwiseNoSpecial.story = {
  name: 'Clockwise, non-special 1st',
};

export const LinkedLabelsOnly = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        linkLabel: { maximumSection: Infinity },
      }}
    />
  </Chart>
);
LinkedLabelsOnly.story = {
  name: 'Linked labels only',
};
export const NoLabels = () => (
  <Chart className={'story-chart'}>
    <Partition
      id={'spec_' + getRandomNumber()}
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.formatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.sunburst,
        linkLabel: { maximumSection: Infinity, maxCount: 0 },
      }}
    />
  </Chart>
);
NoLabels.story = {
  name: 'No labels at all',
};
