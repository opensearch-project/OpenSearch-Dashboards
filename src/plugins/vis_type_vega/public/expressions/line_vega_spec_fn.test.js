/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildLayerMark,
  buildXAxis,
  buildYAxis,
  cleanString,
  createSpecFromDatatable,
  formatDataTable,
  setupConfig,
} from './line_vega_spec_fn';

describe('cleanString()', function () {
  it('string should not contain "', function () {
    const dirtyString = '"someString"';
    expect(cleanString(dirtyString)).toBe('someString');
  });
});

describe('setupConfig()', function () {
  it('check all legend positions', function () {
    const baseConfig = {
      view: {
        stroke: null,
      },
      concat: {
        spacing: 0,
      },
      legend: {
        orient: null,
      },
    };
    const positions = ['top', 'right', 'left', 'bottom'];
    positions.forEach((position) => {
      const visParams = { legendPosition: position };
      baseConfig.legend.orient = position;
      expect(setupConfig(visParams)).toStrictEqual(baseConfig);
    });
  });
});

describe('buildLayerMark()', function () {
  const types = ['line', 'area', 'histogram'];
  const interpolates = ['linear', 'cardinal', 'step-after'];
  const strokeWidths = [-1, 0, 1, 2, 3, 4];
  const showCircles = [false, true];

  it('check each mark possible value', function () {
    const mark = {
      type: null,
      interpolate: null,
      strokeWidth: null,
      point: null,
    };
    types.forEach((type) => {
      mark.type = type;
      interpolates.forEach((interpolate) => {
        mark.interpolate = interpolate;
        strokeWidths.forEach((strokeWidth) => {
          mark.strokeWidth = strokeWidth;
          showCircles.forEach((showCircle) => {
            mark.point = showCircle;
            const param = {
              type: type,
              interpolate: interpolate,
              lineWidth: strokeWidth,
              showCircles: showCircle,
            };
            expect(buildLayerMark(param)).toStrictEqual(mark);
          });
        });
      });
    });
  });
});

describe('buildXAxis()', function () {
  it('build different XAxis', function () {
    const xAxisTitle = 'someTitle';
    const xAxisId = 'someId';
    const startTime = 1676596400;
    const endTime = 1676796400;
    [true, false].forEach((enableGrid) => {
      const visParams = { grid: { categoryLines: enableGrid } };
      const vegaXAxis = {
        axis: {
          title: xAxisTitle,
          grid: enableGrid,
        },
        field: xAxisId,
        type: 'temporal',
        scale: {
          domain: [startTime, endTime],
        },
      };
      expect(buildXAxis(xAxisTitle, xAxisId, startTime, endTime, visParams)).toStrictEqual(
        vegaXAxis
      );
    });
  });
});

describe('buildYAxis()', function () {
  it('build different XAxis', function () {
    const valueAxis = {
      id: 'someId',
      labels: {
        rotate: 75,
        show: false,
      },
      position: 'left',
      title: {
        text: 'someText',
      },
    };
    const column = { name: 'columnName', id: 'columnId' };
    const visParams = { grid: { valueAxis: true } };
    const vegaYAxis = {
      axis: {
        title: 'someText',
        grid: true,
        orient: 'left',
        labels: false,
        labelAngle: 75,
      },
      field: 'columnId',
      type: 'quantitative',
    };
    expect(buildYAxis(column, valueAxis, visParams)).toStrictEqual(vegaYAxis);

    valueAxis.title.text = '""';
    vegaYAxis.axis.title = 'columnName';
    expect(buildYAxis(column, valueAxis, visParams)).toStrictEqual(vegaYAxis);
  });
});

describe('createSpecFromDatatable()', function () {
  it('build simple line chart"', function () {
    const datatable =
      '{"type":"opensearch_dashboards_datatable","rows":[{"col-0-2":1672214400000,"col-1-1":44},{"col-0-2":1672300800000,"col-1-1":150},{"col-0-2":1672387200000,"col-1-1":154},{"col-0-2":1672473600000,"col-1-1":144},{"col-0-2":1672560000000,"col-1-1":133},{"col-0-2":1672646400000,"col-1-1":149},{"col-0-2":1672732800000,"col-1-1":152},{"col-0-2":1672819200000,"col-1-1":144},{"col-0-2":1672905600000,"col-1-1":166},{"col-0-2":1672992000000,"col-1-1":151},{"col-0-2":1673078400000,"col-1-1":143},{"col-0-2":1673164800000,"col-1-1":148},{"col-0-2":1673251200000,"col-1-1":146},{"col-0-2":1673337600000,"col-1-1":137},{"col-0-2":1673424000000,"col-1-1":152},{"col-0-2":1673510400000,"col-1-1":152},{"col-0-2":1673596800000,"col-1-1":151},{"col-0-2":1673683200000,"col-1-1":157},{"col-0-2":1673769600000,"col-1-1":151},{"col-0-2":1673856000000,"col-1-1":152},{"col-0-2":1673942400000,"col-1-1":142},{"col-0-2":1674028800000,"col-1-1":151},{"col-0-2":1674115200000,"col-1-1":163},{"col-0-2":1674201600000,"col-1-1":156},{"col-0-2":1674288000000,"col-1-1":153},{"col-0-2":1674374400000,"col-1-1":162},{"col-0-2":1674460800000,"col-1-1":152},{"col-0-2":1674547200000,"col-1-1":159},{"col-0-2":1674633600000,"col-1-1":165},{"col-0-2":1674720000000,"col-1-1":153},{"col-0-2":1674806400000,"col-1-1":149},{"col-0-2":1674892800000,"col-1-1":94}],"columns":[{"id":"col-0-2","name":"order_date per day","meta":{"type":"date_histogram","indexPatternId":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","aggConfigParams":{"field":"order_date","timeRange":{"from":"now-90d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}}}},{"id":"col-1-1","name":"Count","meta":{"type":"count","indexPatternId":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","aggConfigParams":{}}}]}';
    const visParams =
      '{"addLegend":true,"addTimeMarker":false,"addTooltip":true,"categoryAxes":[{"id":"CategoryAxis-1","labels":{"filter":true,"show":true,"truncate":100},"position":"bottom","scale":{"type":"linear"},"show":true,"style":{},"title":{},"type":"category"}],"grid":{"categoryLines":false},"labels":{},"legendPosition":"right","seriesParams":[{"data":{"id":"1","label":"Count"},"drawLinesBetweenPoints":true,"interpolate":"linear","lineWidth":2,"mode":"normal","show":true,"showCircles":true,"type":"line","valueAxis":"ValueAxis-1"}],"thresholdLine":{"color":"#E7664C","show":false,"style":"full","value":10,"width":1},"times":[],"type":"line","valueAxes":[{"id":"ValueAxis-1","labels":{"filter":false,"rotate":0,"show":true,"truncate":100},"name":"LeftAxis-1","position":"left","scale":{"mode":"normal","type":"linear"},"show":true,"style":{},"title":{"text":"Count"},"type":"value"}]}';
    const dimensions =
      '{"x":{"accessor":0,"format":{"id":"date","params":{"pattern":"YYYY-MM-DD"}},"params":{"date":true,"interval":"P1D","intervalESValue":1,"intervalESUnit":"d","format":"YYYY-MM-DD","bounds":{"min":"2022-11-18T00:14:09.617Z","max":"2023-02-16T00:14:09.617Z"}},"label":"order_date per day","aggType":"date_histogram"},"y":[{"accessor":1,"format":{"id":"number"},"params":{},"label":"Count","aggType":"count"}]}';
    const spec =
      '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","data":{"values":[{"col-0-2":1672214400000,"col-1-1":44},{"col-0-2":1672300800000,"col-1-1":150},{"col-0-2":1672387200000,"col-1-1":154},{"col-0-2":1672473600000,"col-1-1":144},{"col-0-2":1672560000000,"col-1-1":133},{"col-0-2":1672646400000,"col-1-1":149},{"col-0-2":1672732800000,"col-1-1":152},{"col-0-2":1672819200000,"col-1-1":144},{"col-0-2":1672905600000,"col-1-1":166},{"col-0-2":1672992000000,"col-1-1":151},{"col-0-2":1673078400000,"col-1-1":143},{"col-0-2":1673164800000,"col-1-1":148},{"col-0-2":1673251200000,"col-1-1":146},{"col-0-2":1673337600000,"col-1-1":137},{"col-0-2":1673424000000,"col-1-1":152},{"col-0-2":1673510400000,"col-1-1":152},{"col-0-2":1673596800000,"col-1-1":151},{"col-0-2":1673683200000,"col-1-1":157},{"col-0-2":1673769600000,"col-1-1":151},{"col-0-2":1673856000000,"col-1-1":152},{"col-0-2":1673942400000,"col-1-1":142},{"col-0-2":1674028800000,"col-1-1":151},{"col-0-2":1674115200000,"col-1-1":163},{"col-0-2":1674201600000,"col-1-1":156},{"col-0-2":1674288000000,"col-1-1":153},{"col-0-2":1674374400000,"col-1-1":162},{"col-0-2":1674460800000,"col-1-1":152},{"col-0-2":1674547200000,"col-1-1":159},{"col-0-2":1674633600000,"col-1-1":165},{"col-0-2":1674720000000,"col-1-1":153},{"col-0-2":1674806400000,"col-1-1":149},{"col-0-2":1674892800000,"col-1-1":94}]},"config":{"view":{"stroke":null},"concat":{"spacing":0},"legend":{"orient":"right"}},"layer":[{"mark":{"type":"line","interpolate":"linear","strokeWidth":2,"point":true},"encoding":{"x":{"axis":{"title":"order_date per day","grid":false},"field":"col-0-2","type":"temporal","scale":{"domain":[1668730449617,1676506449617]}},"y":{"axis":{"title":"Count","orient":"left","labels":true,"labelAngle":0},"field":"col-1-1","type":"quantitative"},"tooltip":[{"field":"col-0-2","type":"temporal","title":"order_date per day"},{"field":"col-1-1","type":"quantitative","title":"Count"}],"color":{"datum":"Count"}}}]}';
    expect(
      JSON.stringify(
        createSpecFromDatatable(
          formatDataTable(JSON.parse(datatable)),
          JSON.parse(visParams),
          JSON.parse(dimensions)
        )
      )
    ).toBe(spec);
  });

  it('build empty chart if no x-axis is defined"', function () {
    const datatable =
      '{"type":"opensearch_dashboards_datatable","rows":[{"col-0-1":4675}],"columns":[{"id":"col-0-1","name":"Count","meta":{"type":"count","indexPatternId":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","aggConfigParams":{}}}]}';
    const visParams =
      '{"type":"line","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"line","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"interpolate":"linear","showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}';
    const dimensions =
      '{"x":null,"y":[{"accessor":0,"format":{"id":"number"},"params":{},"label":"Count","aggType":"count"}]}';
    const spec =
      '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","data":{"values":[{"col-0-1":4675}]},"config":{"view":{"stroke":null},"concat":{"spacing":0},"legend":{"orient":"right"}},"layer":[]}';
    expect(
      JSON.stringify(
        createSpecFromDatatable(
          formatDataTable(JSON.parse(datatable)),
          JSON.parse(visParams),
          JSON.parse(dimensions)
        )
      )
    ).toBe(spec);
  });

  it('build complicated line chart"', function () {
    const datatable =
      '{"type":"opensearch_dashboards_datatable","rows":[{"col-0-2":1672214400000,"col-1-1":44,"col-2-3":60.9375},{"col-0-2":1672300800000,"col-1-1":150,"col-2-3":82.5},{"col-0-2":1672387200000,"col-1-1":154,"col-2-3":79.5},{"col-0-2":1672473600000,"col-1-1":144,"col-2-3":75.875},{"col-0-2":1672560000000,"col-1-1":133,"col-2-3":259.25},{"col-0-2":1672646400000,"col-1-1":149,"col-2-3":90},{"col-0-2":1672732800000,"col-1-1":152,"col-2-3":79.0625},{"col-0-2":1672819200000,"col-1-1":144,"col-2-3":82.5},{"col-0-2":1672905600000,"col-1-1":166,"col-2-3":85.25},{"col-0-2":1672992000000,"col-1-1":151,"col-2-3":92},{"col-0-2":1673078400000,"col-1-1":143,"col-2-3":90.75},{"col-0-2":1673164800000,"col-1-1":148,"col-2-3":92},{"col-0-2":1673251200000,"col-1-1":146,"col-2-3":83.25},{"col-0-2":1673337600000,"col-1-1":137,"col-2-3":98},{"col-0-2":1673424000000,"col-1-1":152,"col-2-3":83.6875},{"col-0-2":1673510400000,"col-1-1":152,"col-2-3":83.6875},{"col-0-2":1673596800000,"col-1-1":151,"col-2-3":87.4375},{"col-0-2":1673683200000,"col-1-1":157,"col-2-3":63.75},{"col-0-2":1673769600000,"col-1-1":151,"col-2-3":81.5625},{"col-0-2":1673856000000,"col-1-1":152,"col-2-3":100.6875},{"col-0-2":1673942400000,"col-1-1":142,"col-2-3":98},{"col-0-2":1674028800000,"col-1-1":151,"col-2-3":100.8125},{"col-0-2":1674115200000,"col-1-1":163,"col-2-3":83.6875},{"col-0-2":1674201600000,"col-1-1":156,"col-2-3":85.8125},{"col-0-2":1674288000000,"col-1-1":153,"col-2-3":98},{"col-0-2":1674374400000,"col-1-1":162,"col-2-3":75.9375},{"col-0-2":1674460800000,"col-1-1":152,"col-2-3":113.375},{"col-0-2":1674547200000,"col-1-1":159,"col-2-3":73.625},{"col-0-2":1674633600000,"col-1-1":165,"col-2-3":72.8125},{"col-0-2":1674720000000,"col-1-1":153,"col-2-3":113.375},{"col-0-2":1674806400000,"col-1-1":149,"col-2-3":82.5},{"col-0-2":1674892800000,"col-1-1":94,"col-2-3":54}],"columns":[{"id":"col-0-2","name":"order_date per day","meta":{"type":"date_histogram","indexPatternId":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","aggConfigParams":{"field":"order_date","timeRange":{"from":"now-90d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}}}},{"id":"col-1-1","name":"Count","meta":{"type":"count","indexPatternId":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","aggConfigParams":{}}},{"id":"col-2-3","name":"Max products.min_price","meta":{"type":"max","indexPatternId":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","aggConfigParams":{"field":"products.min_price"}}}]}';
    const visParams =
      '{"addLegend":true,"addTimeMarker":true,"addTooltip":true,"categoryAxes":[{"id":"CategoryAxis-1","labels":{"filter":true,"show":true,"truncate":100},"position":"bottom","scale":{"type":"linear"},"show":true,"style":{},"title":{},"type":"category"}],"grid":{"categoryLines":false,"valueAxis":"ValueAxis-1"},"labels":{},"legendPosition":"bottom","seriesParams":[{"data":{"id":"1","label":"Count"},"drawLinesBetweenPoints":true,"interpolate":"linear","lineWidth":2,"mode":"normal","show":true,"showCircles":true,"type":"line","valueAxis":"ValueAxis-1"},{"data":{"id":"3","label":"Max products.min_price"},"drawLinesBetweenPoints":true,"interpolate":"linear","lineWidth":2,"mode":"normal","show":true,"showCircles":true,"type":"line","valueAxis":"ValueAxis-1"}],"thresholdLine":{"color":"#E7664C","show":true,"style":"dashed","value":100,"width":1},"times":[],"type":"line","valueAxes":[{"id":"ValueAxis-1","labels":{"filter":false,"rotate":75,"show":true,"truncate":100},"name":"RightAxis-1","position":"right","scale":{"mode":"normal","type":"linear"},"show":true,"style":{},"title":{"text":"Count"},"type":"value"}]}';
    const dimensions =
      '{"x":{"accessor":0,"format":{"id":"date","params":{"pattern":"YYYY-MM-DD"}},"params":{"date":true,"interval":"P1D","intervalESValue":1,"intervalESUnit":"d","format":"YYYY-MM-DD","bounds":{"min":"2022-11-19T03:26:04.730Z","max":"2023-02-17T03:26:04.730Z"}},"label":"order_date per day","aggType":"date_histogram"},"y":[{"accessor":1,"format":{"id":"number"},"params":{},"label":"Count","aggType":"count"},{"accessor":2,"format":{"id":"number","params":{"parsedUrl":{"origin":"http://localhost:5603","pathname":"/rao/app/visualize","basePath":"/rao"}}},"params":{},"label":"Max products.min_price","aggType":"max"}]}';
    const spec =
      '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","data":{"values":[{"col-0-2":1672214400000,"col-1-1":44,"col-2-3":60.9375},{"col-0-2":1672300800000,"col-1-1":150,"col-2-3":82.5},{"col-0-2":1672387200000,"col-1-1":154,"col-2-3":79.5},{"col-0-2":1672473600000,"col-1-1":144,"col-2-3":75.875},{"col-0-2":1672560000000,"col-1-1":133,"col-2-3":259.25},{"col-0-2":1672646400000,"col-1-1":149,"col-2-3":90},{"col-0-2":1672732800000,"col-1-1":152,"col-2-3":79.0625},{"col-0-2":1672819200000,"col-1-1":144,"col-2-3":82.5},{"col-0-2":1672905600000,"col-1-1":166,"col-2-3":85.25},{"col-0-2":1672992000000,"col-1-1":151,"col-2-3":92},{"col-0-2":1673078400000,"col-1-1":143,"col-2-3":90.75},{"col-0-2":1673164800000,"col-1-1":148,"col-2-3":92},{"col-0-2":1673251200000,"col-1-1":146,"col-2-3":83.25},{"col-0-2":1673337600000,"col-1-1":137,"col-2-3":98},{"col-0-2":1673424000000,"col-1-1":152,"col-2-3":83.6875},{"col-0-2":1673510400000,"col-1-1":152,"col-2-3":83.6875},{"col-0-2":1673596800000,"col-1-1":151,"col-2-3":87.4375},{"col-0-2":1673683200000,"col-1-1":157,"col-2-3":63.75},{"col-0-2":1673769600000,"col-1-1":151,"col-2-3":81.5625},{"col-0-2":1673856000000,"col-1-1":152,"col-2-3":100.6875},{"col-0-2":1673942400000,"col-1-1":142,"col-2-3":98},{"col-0-2":1674028800000,"col-1-1":151,"col-2-3":100.8125},{"col-0-2":1674115200000,"col-1-1":163,"col-2-3":83.6875},{"col-0-2":1674201600000,"col-1-1":156,"col-2-3":85.8125},{"col-0-2":1674288000000,"col-1-1":153,"col-2-3":98},{"col-0-2":1674374400000,"col-1-1":162,"col-2-3":75.9375},{"col-0-2":1674460800000,"col-1-1":152,"col-2-3":113.375},{"col-0-2":1674547200000,"col-1-1":159,"col-2-3":73.625},{"col-0-2":1674633600000,"col-1-1":165,"col-2-3":72.8125},{"col-0-2":1674720000000,"col-1-1":153,"col-2-3":113.375},{"col-0-2":1674806400000,"col-1-1":149,"col-2-3":82.5},{"col-0-2":1674892800000,"col-1-1":94,"col-2-3":54}]},"config":{"view":{"stroke":null},"concat":{"spacing":0},"legend":{"orient":"bottom"}},"layer":[{"mark":{"type":"line","interpolate":"linear","strokeWidth":2,"point":true},"encoding":{"x":{"axis":{"title":"order_date per day","grid":false},"field":"col-0-2","type":"temporal","scale":{"domain":[1668828364730,1676604364730]}},"y":{"axis":{"title":"Count","grid":"ValueAxis-1","orient":"right","labels":true,"labelAngle":75},"field":"col-1-1","type":"quantitative"},"tooltip":[{"field":"col-0-2","type":"temporal","title":"order_date per day"},{"field":"col-1-1","type":"quantitative","title":"Count"}],"color":{"datum":"Count"}}},{"mark":{"type":"line","interpolate":"linear","strokeWidth":2,"point":true},"encoding":{"x":{"axis":{"title":"order_date per day","grid":false},"field":"col-0-2","type":"temporal","scale":{"domain":[1668828364730,1676604364730]}},"y":{"axis":{"title":"Count","grid":"ValueAxis-1","orient":"right","labels":true,"labelAngle":75},"field":"col-2-3","type":"quantitative"},"tooltip":[{"field":"col-0-2","type":"temporal","title":"order_date per day"},{"field":"col-2-3","type":"quantitative","title":"Max products.min_price"}],"color":{"datum":"Max products.min_price"}}},{"mark":"rule","encoding":{"x":{"type":"temporal","field":"now_field"},"color":{"value":"red"},"size":{"value":1}}},{"mark":{"type":"rule","color":"#E7664C","strokeDash":[8,8]},"encoding":{"y":{"datum":100}}}],"transform":[{"calculate":"now()","as":"now_field"}]}';
    expect(
      JSON.stringify(
        createSpecFromDatatable(
          formatDataTable(JSON.parse(datatable)),
          JSON.parse(visParams),
          JSON.parse(dimensions)
        )
      )
    ).toBe(spec);
  });
});
