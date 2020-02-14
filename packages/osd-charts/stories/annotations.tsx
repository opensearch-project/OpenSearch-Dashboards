import { boolean, color, number, select } from '@storybook/addon-knobs';
import React from 'react';
import {
  AnnotationDomainTypes,
  AnnotationTooltipFormatter,
  Axis,
  BarSeries,
  Chart,
  getAnnotationId,
  getAxisId,
  getSpecId,
  LineAnnotation,
  LineAnnotationDatum,
  LineSeries,
  RectAnnotation,
  ScaleType,
  Settings,
  timeFormatter,
} from '../src';
import { Icon } from '../src/components/icons/icon';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
import { getChartRotationKnob, arrayKnobs } from './common';
import { BandedAccessorType } from '../src/utils/geometry';
import { Position } from '../src/utils/commons';

const dateFormatter = timeFormatter('HH:mm:ss');

function generateAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({ dataValue: value, details: `detail-${index}` }));
}

function generateTimeAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({
    dataValue: value,
    details: `detail-${index}`,
    header: dateFormatter(value),
  }));
}

export default {
  title: 'Annotations',
  parameters: {
    info: {
      source: false,
    },
  },
};

export const lineBasicXDomainContinous = () => {
  const data = arrayKnobs('data values', [2.5, 7.2]);
  const dataValues = generateAnnotationData(data);

  const style = {
    line: {
      strokeWidth: 3,
      stroke: '#f00',
      opacity: 1,
    },
    details: {
      fontSize: 12,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: 'gray',
      padding: 0,
    },
  };

  const isBottom = boolean('x domain axis is bottom', true);
  const axisPosition = isBottom ? Position.Bottom : Position.Top;

  return (
    <Chart className={'story-chart'}>
      <Settings showLegend debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <LineAnnotation
        id={getAnnotationId('anno_1')}
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        style={style}
        marker={<Icon type="alert" />}
      />
      <Axis id={getAxisId('horizontal')} position={axisPosition} title={'x-domain axis'} />
      <Axis id={getAxisId('vertical')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
lineBasicXDomainContinous.story = {
  name: '[line] basic xDomain continuous',
};

export const lineBasicXDomainOrdinal = () => {
  const dataValues = generateAnnotationData(arrayKnobs('annotation values', ['a', 'c']));
  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <LineAnnotation
        id={'anno_1'}
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        marker={<Icon type="alert" />}
      />
      <Axis id={getAxisId('top')} position={Position.Top} title={'x-domain axis (top)'} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'x-domain axis (bottom)'} />
      <Axis id={getAxisId('left')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 2 },
          { x: 'b', y: 7 },
          { x: 'c', y: 3 },
          { x: 'd', y: 6 },
        ]}
      />
    </Chart>
  );
};
lineBasicXDomainOrdinal.story = {
  name: '[line] basic xDomain ordinal',
};

export const lineBasicYDomain = () => {
  const data = arrayKnobs('data values', [1.5, 7.2]);
  const dataValues = generateAnnotationData(data);

  const isLeft = boolean('y-domain axis is Position.Left', true);
  const axisTitle = isLeft ? 'y-domain axis (left)' : 'y-domain axis (right)';
  const axisPosition = isLeft ? Position.Left : Position.Right;

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <LineAnnotation
        id={'anno_'}
        domainType={AnnotationDomainTypes.YDomain}
        dataValues={dataValues}
        marker={<Icon type="alert" />}
      />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'x-domain axis'} />
      <Axis id={getAxisId('left')} title={axisTitle} position={axisPosition} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
lineBasicYDomain.story = {
  name: '[line] basic yDomain',
};

export const lineTimeSeries = () => {
  const dataValues = generateTimeAnnotationData([
    1551438150000,
    1551438180000,
    1551438390000,
    1551438450000,
    1551438480000,
  ]);

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <LineAnnotation
        id={'anno_1'}
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        marker={<Icon type="alert" />}
      />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'x-domain axis'} tickFormat={dateFormatter} />
      <Axis id={getAxisId('left')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20)}
      />
    </Chart>
  );
};
lineTimeSeries.story = {
  name: '[line] time series',
};

export const lineStyling = () => {
  const data = [2.5, 7.2];
  const dataValues = generateAnnotationData(data);

  const dashWidth = number('dash line width', 1);
  const dashGapWidth = number('dash gap width', 0);

  const style = {
    line: {
      strokeWidth: number('line stroke width', 3),
      stroke: color('line & marker color', '#f00'),
      dash: [dashWidth, dashGapWidth],
      opacity: number('line opacity', 1, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };

  const axisPosition = Position.Bottom;

  const marker = select<'alert' | 'eye' | 'questionInCircle'>(
    'marker icon (examples from internal Icon library)',
    {
      alert: 'alert',
      eye: 'eye',
      questionInCircle: 'questionInCircle',
    },
    'alert',
  );

  const hideLines = boolean('annotation lines hidden', false);
  const hideTooltips = boolean('annotation tooltips hidden', false);

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <LineAnnotation
        id={'anno_1'}
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        style={style}
        marker={<Icon type={marker} />}
        hideLines={hideLines}
        hideTooltips={hideTooltips}
      />
      <Axis id={getAxisId('horizontal')} position={axisPosition} title={'x-domain axis'} />
      <Axis id={getAxisId('vertical')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
lineStyling.story = {
  name: '[line] styling',
};

export const rectBasicAnnotationLinearBar = () => {
  const dataValues = [
    {
      coordinates: {
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 7,
      },
      details: 'details about this annotation',
    },
  ];

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <RectAnnotation dataValues={dataValues} id={'rect'} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'x-domain axis'} />
      <Axis id={getAxisId('left')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={'x'}
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
rectBasicAnnotationLinearBar.story = {
  name: '[rect] basic annotation (linear bar)',
};

export const rectBasicAnnotationOrdinalBar = () => {
  const dataValues = [
    {
      coordinates: {
        x0: 'a',
        x1: 'b',
      },
      details: 'details about this annotation',
    },
  ];

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <RectAnnotation dataValues={dataValues} id={'rect'} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'x-domain axis'} />
      <Axis id={getAxisId('left')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor={'x'}
        yAccessors={['y']}
        data={[
          { x: 'a', y: 2 },
          { x: 'b', y: 7 },
          { x: 'c', y: 0 },
          { x: 'd', y: 6 },
        ]}
      />
    </Chart>
  );
};
rectBasicAnnotationOrdinalBar.story = {
  name: '[rect] basic annotation (ordinal bar)',
};

export const rectBasicAnnotationLine = () => {
  const definedCoordinate = select(
    'defined coordinate',
    {
      x0: 'x0',
      x1: 'x1',
      y0: BandedAccessorType.Y0,
      y1: BandedAccessorType.Y1,
    },
    'x0',
  );

  const dataValues = [
    {
      coordinates: {
        x0: 1,
        x1: 1.25,
        y0: 0,
        y1: 7,
      },
      details: 'details about this annotation',
    },
    {
      coordinates: {
        x0: 2.0,
        x1: 2.1,
        y0: 0,
        y1: 7,
      },
      details: 'details about this annotation',
    },
    {
      coordinates: {
        x0: definedCoordinate === 'x0' ? 0.25 : null,
        x1: definedCoordinate === 'x1' ? 2.75 : null,
        y0: definedCoordinate === BandedAccessorType.Y0 ? 0.25 : null,
        y1: definedCoordinate === BandedAccessorType.Y1 ? 6.75 : null,
      },
      details: 'can have null values',
    },
  ];

  const isLeft = boolean('y-domain axis is Position.Left', true);
  const yAxisTitle = isLeft ? 'y-domain axis (left)' : 'y-domain axis (right)';
  const yAxisPosition = isLeft ? Position.Left : Position.Right;

  const isBottom = boolean('x-domain axis is Position.Bottom', true);
  const xAxisTitle = isBottom ? 'x-domain axis (botttom)' : 'x-domain axis (top)';
  const xAxisPosition = isBottom ? Position.Bottom : Position.Top;

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <RectAnnotation dataValues={dataValues} id={'rect'} />
      <Axis id={getAxisId('bottom')} position={xAxisPosition} title={xAxisTitle} />
      <Axis id={getAxisId('left')} title={yAxisTitle} position={yAxisPosition} />
      <LineSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={'x'}
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
rectBasicAnnotationLine.story = {
  name: '[rect] basic annotation (line)',
};

export const rectStyling = () => {
  const dataValues = [
    {
      coordinates: {
        x0: 0,
        x1: 0.25,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 1',
    },
    {
      coordinates: {
        x0: -0.1,
        x1: 0,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 2',
    },
    {
      coordinates: {
        x0: 1.1,
        x1: 1.3,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 2',
    },
    {
      coordinates: {
        x0: 2.5,
        x1: 3,
        y0: 0,
        y1: 7,
      },
      details: 'annotation 3',
    },
  ];

  const zIndex = number('annotation zIndex', 0);

  const style = {
    strokeWidth: number('rect border stroke width', 1),
    stroke: color('rect border stroke color', '#e5e5e5'),
    fill: color('fill color', '#e5e5e5'),
    opacity: number('annotation opacity', 0.5, {
      range: true,
      min: 0,
      max: 1,
      step: 0.1,
    }),
  };

  const hasCustomTooltip = boolean('has custom tooltip render', false);

  const customTooltip = (details?: string) => (
    <div>
      <Icon type="alert" />
      {details}
    </div>
  );
  const renderTooltip = hasCustomTooltip ? customTooltip : undefined;

  const isLeft = boolean('y-domain axis is Position.Left', true);
  const yAxisTitle = isLeft ? 'y-domain axis (left)' : 'y-domain axis (right)';
  const yAxisPosition = isLeft ? Position.Left : Position.Right;

  const isBottom = boolean('x-domain axis is Position.Bottom', true);
  const xAxisTitle = isBottom ? 'x-domain axis (botttom)' : 'x-domain axis (top)';
  const xAxisPosition = isBottom ? Position.Bottom : Position.Top;

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} />
      <RectAnnotation
        dataValues={dataValues}
        id={'rect'}
        style={style}
        renderTooltip={renderTooltip}
        zIndex={zIndex}
        hideTooltips={boolean('hide tooltips', false)}
      />
      <Axis id={getAxisId('bottom')} position={xAxisPosition} title={xAxisTitle} />
      <Axis id={getAxisId('left')} title={yAxisTitle} position={yAxisPosition} />
      <LineSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={'x'}
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
rectStyling.story = {
  name: '[rect] styling',
};

export const testLineAnnotationSingleValueHistogram = () => {
  const dataValues = [
    {
      dataValue: 3.5,
    },
  ];

  const style = {
    line: {
      strokeWidth: 3,
      stroke: '#f00',
      opacity: 1,
    },
    details: {
      fontSize: 12,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: 'gray',
      padding: 0,
    },
  };

  const xDomain = {
    minInterval: 1,
  };

  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} rotation={getChartRotationKnob()} xDomain={xDomain} />
      <LineAnnotation id={'anno_1'} domainType={AnnotationDomainTypes.XDomain} dataValues={dataValues} style={style} />
      <Axis id={getAxisId('horizontal')} position={Position.Bottom} title={'x-domain axis'} />
      <Axis id={getAxisId('vertical')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        enableHistogramMode={true}
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[{ x: 3, y: 2 }]}
      />
    </Chart>
  );
};
testLineAnnotationSingleValueHistogram.story = {
  name: '[test] line annotation single value histogram',
};

export const rectTooltipVisilibityDependentOnContent = () => {
  const tooltipOptions = {
    'default formatter, details defined': 'default_defined',
    'default formatter, details undefined': 'default_undefined',
    'custom formatter, return element': 'custom_element',
    'custom formatter, return null': 'custom_null',
  };

  const tooltipFormat = select('tooltip format', tooltipOptions, 'default_defined');

  const isDefaultDefined = tooltipFormat === 'default_defined';

  const dataValues = [
    {
      coordinates: {
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 7,
      },
      details: isDefaultDefined ? 'foo' : undefined,
    },
  ];

  const isCustomTooltipElement = tooltipFormat === 'custom_element';
  const tooltipFormatter: AnnotationTooltipFormatter = () => {
    if (!isCustomTooltipElement) {
      return null;
    }

    return <div>{'custom formatter'}</div>;
  };

  const isCustomTooltip = tooltipFormat.includes('custom');

  return (
    <Chart className={'story-chart'}>
      <RectAnnotation
        dataValues={dataValues}
        id={'rect'}
        renderTooltip={isCustomTooltip ? tooltipFormatter : undefined}
      />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'x-domain axis'} />
      <Axis id={getAxisId('left')} title={'y-domain axis'} position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={'x'}
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
rectTooltipVisilibityDependentOnContent.story = {
  name: '[rect] tooltip visibility dependent on content',
};
