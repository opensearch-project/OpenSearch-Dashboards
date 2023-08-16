/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint max-len: 0 */
import { i18n } from '@osd/i18n';
import { SavedObject } from 'opensearch-dashboards/server';

export const getSavedObjects = (): SavedObject[] => [
  {
    id: 'e1d0f010-9ee7-11e7-8711-e7a007dcef99',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.uniqueVisitorsTitle', {
        defaultMessage: '[Logs] Unique Visitors vs. Average Bytes',
      }),
      visState:
        '{"title":"[Logs] Unique Visitors vs. Average Bytes","type":"area","params":{"type":"area","grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Avg. Bytes"}},{"id":"ValueAxis-2","name":"RightAxis-1","type":"value","position":"right","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Unique Visitors"}}],"seriesParams":[{"show":"true","type":"histogram","mode":"stacked","data":{"label":"Avg. Bytes","id":"1"},"drawLinesBetweenPoints":true,"showCircles":true,"interpolate":"linear","valueAxis":"ValueAxis-1"},{"show":true,"mode":"stacked","type":"line","drawLinesBetweenPoints":false,"showCircles":true,"interpolate":"linear","data":{"id":"2","label":"Unique Visitors"},"valueAxis":"ValueAxis-2"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"radiusRatio":17},"aggs":[{"id":"1","enabled":true,"type":"avg","schema":"metric","params":{"field":"bytes","customLabel":"Avg. Bytes"}},{"id":"2","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"clientip","customLabel":"Unique Visitors"}},{"id":"3","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"timestamp","interval":"auto","time_zone":"America/Los_Angeles","customInterval":"2h","min_doc_count":1,"extended_bounds":{}}},{"id":"4","enabled":true,"type":"count","schema":"radius","params":{}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"90943e30-9a47-11e8-b64d-95841ca0b247","filter":[],"query":{"query":"","language":"kuery"}}',
      },
    },
    references: [],
  },
  {
    id: '06cf9c40-9ee8-11e7-8711-e7a007dcef99',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.visitorsMapTitle', {
        defaultMessage: '[Logs] Visitors Map',
      }),
      visState:
        '{"title":"[Logs] Visitors Map","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega/v5.json\\n  config: {\\n    kibana: {type: \\"map\\", latitude: 30, longitude: -120, zoom: 3}\\n  }\\n  data: [\\n    {\\n      name: table\\n      url: {\\n        index: opensearch_dashboards_sample_data_logs\\n        %context%: true\\n        %timefield%: timestamp\\n        body: {\\n          size: 0\\n          aggs: {\\n            gridSplit: {\\n              geotile_grid: {field: \\"geo.coordinates\\", precision: 5, size: 10000}\\n              aggs: {\\n                gridCentroid: {\\n                  geo_centroid: {\\n                    field: \\"geo.coordinates\\"\\n                  }\\n                }\\n              }\\n            }\\n          }\\n        }\\n      }\\n      format: {property: \\"aggregations.gridSplit.buckets\\"}\\n      transform: [\\n        {\\n          type: geopoint\\n          projection: projection\\n          fields: [\\n            gridCentroid.location.lon\\n            gridCentroid.location.lat\\n          ]\\n        }\\n      ]\\n    }\\n  ]\\n  scales: [\\n    {\\n      name: gridSize\\n      type: linear\\n      domain: {data: \\"table\\", field: \\"doc_count\\"}\\n      range: [\\n        50\\n        1000\\n      ]\\n    }\\n    {\\n      name: bubbleColor\\n      type: linear\\n      domain: {\\n        data: table\\n        field: doc_count\\n      }\\n      range: [\\"rgb(255, 255, 255)\\",\\"rgb(249, 212, 204)\\",\\"rgb(238, 170, 156)\\", \\"rgb(223, 129, 110)\\"]\\n    }\\n  ]\\n  marks: [\\n    {\\n      name: gridMarker\\n      type: symbol\\n      from: {data: \\"table\\"}\\n      encode: {\\n        update: {\\n          fill: {\\n            scale: bubbleColor\\n            field: doc_count\\n          }\\n          size: {scale: \\"gridSize\\", field: \\"doc_count\\"}\\n          xc: {signal: \\"datum.x\\"}\\n          yc: {signal: \\"datum.y\\"}\\n          tooltip: {\\n            signal: \\"{flights: datum.doc_count}\\"\\n          }\\n        }\\n      }\\n    }\\n  ]\\n}"}}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"90943e30-9a47-11e8-b64d-95841ca0b247","filter":[],"query":{"query":"","language":"kuery"}}',
      },
    },
    references: [],
  },
  {
    id: '935afa20-e0cd-11e7-9d07-1398ccfcefa3',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.heatmapTitle', {
        defaultMessage: '[Logs] Heatmap',
      }),
      visState:
        '{"title":"[Logs] Heatmap","type":"heatmap","params":{"type":"heatmap","addTooltip":true,"addLegend":true,"enableHover":true,"legendPosition":"right","times":[],"colorsNumber":10,"colorSchema":"Reds","setColorRange":false,"colorsRange":[],"invertColors":false,"percentageMode":false,"valueAxes":[{"show":false,"id":"ValueAxis-1","type":"value","scale":{"type":"linear","defaultYExtents":false},"labels":{"show":false,"rotate":0,"color":"#555","overwriteColor":false}}]},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"clientip"}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"geo.src","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Country Source"}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"hour_of_day","size":25,"order":"asc","orderBy":"_key","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Hour of Day"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"90943e30-9a47-11e8-b64d-95841ca0b247","filter":[],"query":{"query":"","language":"kuery"}}',
      },
    },
    references: [],
  },
  {
    id: '4eb6e500-e1c7-11e7-b6d5-4dc382ef7f5b',
    type: 'visualization',
    updated_at: '2018-08-29T13:23:20.897Z',
    version: '2',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.hostVisitsBytesTableTitle', {
        defaultMessage: '[Logs] Host, Visits and Bytes Table',
      }),
      visState:
        '{"title":"[Logs] Host, Visits and Bytes Table","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"table","series":[{"id":"bd09d600-e5b1-11e7-bfc2-a1f7e71965a1","color":"#54B399","split_mode":"everything","metrics":[{"id":"bd09d601-e5b1-11e7-bfc2-a1f7e71965a1","type":"sum","field":"bytes"},{"sigma":"","id":"c9514c90-e5b1-11e7-bfc2-a1f7e71965a1","type":"sum_bucket","field":"bd09d601-e5b1-11e7-bfc2-a1f7e71965a1"}],"seperate_axis":0,"axis_position":"right","formatter":"bytes","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","color_rules":[{"id":"c0c668d0-e5b1-11e7-bfc2-a1f7e71965a1"}],"label":"Bytes (Total)"},{"id":"b7672c30-a6df-11e8-8b18-1da1dfc50975","color":"#54B399","split_mode":"everything","metrics":[{"id":"b7672c31-a6df-11e8-8b18-1da1dfc50975","type":"sum","field":"bytes"}],"seperate_axis":0,"axis_position":"right","formatter":"bytes","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","color_rules":[{"id":"c0c668d0-e5b1-11e7-bfc2-a1f7e71965a1"}],"label":"Bytes (Last Hour)"},{"id":"f2c20700-a6df-11e8-8b18-1da1dfc50975","color":"#54B399","split_mode":"everything","metrics":[{"id":"f2c20701-a6df-11e8-8b18-1da1dfc50975","type":"cardinality","field":"ip"},{"sigma":"","id":"f46333e0-a6df-11e8-8b18-1da1dfc50975","type":"sum_bucket","field":"f2c20701-a6df-11e8-8b18-1da1dfc50975"}],"seperate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":"Unique Visits (Total)","color_rules":[{"value":1000,"id":"2e963080-a6e0-11e8-8b18-1da1dfc50975","text":"#E7664C","operator":"lt"},{"value":1000,"id":"3d4fb880-a6e0-11e8-8b18-1da1dfc50975","text":"#D6BF57","operator":"gte"},{"value":1500,"id":"435f8a20-a6e0-11e8-8b18-1da1dfc50975","text":"#54B399","operator":"gte"}],"offset_time":"","value_template":"","trend_arrows":1},{"id":"46fd7fc0-e5b1-11e7-bfc2-a1f7e71965a1","color":"#54B399","split_mode":"everything","metrics":[{"id":"46fd7fc1-e5b1-11e7-bfc2-a1f7e71965a1","type":"cardinality","field":"ip"}],"seperate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":"Unique Visits (Last Hour)","color_rules":[{"value":10,"id":"4e90aeb0-a6e0-11e8-8b18-1da1dfc50975","text":"#E7664C","operator":"lt"},{"value":10,"id":"6d59b1c0-a6e0-11e8-8b18-1da1dfc50975","text":"#D6BF57","operator":"gte"},{"value":25,"id":"77578670-a6e0-11e8-8b18-1da1dfc50975","text":"#54B399","operator":"gte"}],"offset_time":"","value_template":"","trend_arrows":1}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"1h","axis_position":"left","axis_formatter":"number","show_legend":1,"show_grid":1,"bar_color_rules":[{"id":"e9b4e490-e1c6-11e7-b4f6-0f68c45f7387"}],"pivot_id":"extension.keyword","pivot_label":"Type","drilldown_url":"","axis_scale":"normal"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '69a34b00-9ee8-11e7-8711-e7a007dcef99',
    type: 'visualization',
    updated_at: '2018-08-29T13:24:46.136Z',
    version: '2',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.goalsTitle', {
        defaultMessage: '[Logs] Goals',
      }),
      visState:
        '{"title":"[Logs] Goals","type":"gauge","params":{"type":"gauge","addTooltip":true,"addLegend":false,"gauge":{"verticalSplit":false,"extendRange":true,"percentageMode":false,"gaugeType":"Arc","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","colorSchema":"Green to Red","gaugeColorMode":"Labels","colorsRange":[{"from":0,"to":500},{"from":500,"to":1000},{"from":1000,"to":1500}],"invertColors":true,"labels":{"show":false,"color":"black"},"scale":{"show":true,"labels":false,"color":"#333"},"type":"meter","style":{"bgWidth":0.9,"width":0.9,"mask":false,"bgMask":false,"maskBars":50,"bgFill":"#eee","bgColor":false,"subText":"visitors","fontSize":60,"labelColor":true}},"isDisplayWarning":false},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"clientip","customLabel":"Unique Visitors"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"90943e30-9a47-11e8-b64d-95841ca0b247","filter":[],"query":{"query":"","language":"kuery"}}',
      },
    },
    references: [],
  },
  {
    id: '42b997f0-0c26-11e8-b0ec-3bb475f6b6ff',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.fileTypeScatterPlotTitle', {
        defaultMessage: '[Logs] File Type Scatter Plot',
      }),
      visState:
        '{"title":"[Logs] File Type Scatter Plot","type":"vega","params":{"spec":"{\\n  $schema: \\"https://vega.github.io/schema/vega-lite/v4.json\\"\\n  // Use points for drawing to actually create a scatterplot\\n  mark: point\\n  // Specify where to load data from\\n  data: {\\n    // By using an object to the url parameter we will\\n    // construct an OpenSearch query\\n    url: {\\n      // Context == true means filters of the dashboard will be taken into account\\n      %context%: true\\n      // Specify on which field the time picker should operate\\n      %timefield%: timestamp\\n      // Specify the index pattern to load data from\\n      index: opensearch_dashboards_sample_data_logs\\n      // This body will be send to OpenSearch\'s _search endpoint\\n      // You can use everything the OpenSearch Query DSL supports here\\n      body: {\\n        // Set the size to load 10000 documents\\n        size: 10000,\\n        // Just ask for the fields we actually need for visualization\\n        _source: [\\"timestamp\\", \\"bytes\\", \\"extension\\"]\\n      }\\n    }\\n    // Tell Vega, that the array of data will be inside hits.hits of the response\\n    // since the result returned from OpenSearch fill have a format like:\\n    // {\\n    //   hits: {\\n    //     total: 42000,\\n    //     max_score: 2,\\n    //     hits: [\\n    //       < our individual documents >\\n    //     ]\\n    //   }\\n    // }\\n    format: { property: \\"hits.hits\\" }\\n  }\\n  // You can do transformation and calculation of the data before drawing it\\n  transform: [\\n    // Since timestamp is a string value, we need to convert it to a unix timestamp\\n    // so that Vega can work on it properly.\\n    {\\n      // Convert _source.timestamp field to a date\\n      calculate: \\"toDate(datum._source[\'timestamp\'])\\"\\n      // Store the result in a field named \\"time\\" in the object\\n      as: \\"time\\"\\n    }\\n  ]\\n  // Specify what data will be drawn on which axis\\n  encoding: {\\n    x: {\\n      // Draw the time field on the x-axis in temporal mode (i.e. as a time axis)\\n      field: time\\n      type: temporal\\n      // Hide the axis label for the x-axis\\n      axis: { title: false }\\n    }\\n    y: {\\n      // Draw the bytes of each document on the y-axis\\n      field: _source.bytes\\n      // Mark the y-axis as quantitative\\n      type: quantitative\\n      // Specify the label for this axis\\n      axis: { title: \\"Transferred bytes\\" }\\n    }\\n    color: {\\n      // Make the color of each point depend on the _source.extension field\\n      field: _source.extension\\n      // Treat different values as completely unrelated values to each other.\\n      // You could switch this to quantitative if you have a numeric field and\\n      // want to create a color scale from one color to another depending on that\\n      // field\'s value.\\n      type: nominal\\n      // Rename the legend title so it won\'t just state: \\"_source.extension\\"\\n      legend: { title: \'File type\' }\\n    }\\n    shape: {\\n      // Also make the shape of each point dependent on the extension.\\n      field: _source.extension\\n      type: nominal\\n    }\\n  }\\n}"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '7cbd2350-2223-11e8-b802-5bcf64c2cfb4',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.sourceAndDestinationSankeyChartTitle', {
        defaultMessage: '[Logs] Source and Destination Sankey Chart',
      }),
      visState:
        '{"title":"[Logs] Source and Destination Sankey Chart","type":"vega","params":{"spec":"{ \\n $schema: https://vega.github.io/schema/vega/v5.json\\n  data: [\\n\\t{\\n  \\t// query OpenSearch based on the currently selected time range and filter string\\n  \\tname: rawData\\n  \\turl: {\\n    \\t%context%: true\\n    \\t%timefield%: timestamp\\n    \\tindex: opensearch_dashboards_sample_data_logs\\n    \\tbody: {\\n      \\tsize: 0\\n      \\taggs: {\\n        \\ttable: {\\n          \\tcomposite: {\\n            \\tsize: 10000\\n            \\tsources: [\\n              \\t{\\n                \\tstk1: {\\n                  \\tterms: {field: \\"geo.src\\"}\\n                \\t}\\n              \\t}\\n              \\t{\\n                \\tstk2: {\\n                  \\tterms: {field: \\"geo.dest\\"}\\n                \\t}\\n              \\t}\\n            \\t]\\n          \\t}\\n        \\t}\\n      \\t}\\n    \\t}\\n  \\t}\\n  \\t// From the result, take just the data we are interested in\\n  \\tformat: {property: \\"aggregations.table.buckets\\"}\\n  \\t// Convert key.stk1 -> stk1 for simpler access below\\n  \\ttransform: [\\n    \\t{type: \\"formula\\", expr: \\"datum.key.stk1\\", as: \\"stk1\\"}\\n    \\t{type: \\"formula\\", expr: \\"datum.key.stk2\\", as: \\"stk2\\"}\\n    \\t{type: \\"formula\\", expr: \\"datum.doc_count\\", as: \\"size\\"}\\n  \\t]\\n\\t}\\n\\t{\\n  \\tname: nodes\\n  \\tsource: rawData\\n  \\ttransform: [\\n    \\t// when a country is selected, filter out unrelated data\\n    \\t{\\n      \\ttype: filter\\n      \\texpr: !groupSelector || groupSelector.stk1 == datum.stk1 || groupSelector.stk2 == datum.stk2\\n    \\t}\\n    \\t// Set new key for later lookups - identifies each node\\n    \\t{type: \\"formula\\", expr: \\"datum.stk1+datum.stk2\\", as: \\"key\\"}\\n    \\t// instead of each table row, create two new rows,\\n    \\t// one for the source (stack=stk1) and one for destination node (stack=stk2).\\n    \\t// The country code stored in stk1 and stk2 fields is placed into grpId field.\\n    \\t{\\n      \\ttype: fold\\n      \\tfields: [\\"stk1\\", \\"stk2\\"]\\n      \\tas: [\\"stack\\", \\"grpId\\"]\\n    \\t}\\n    \\t// Create a sortkey, different for stk1 and stk2 stacks.\\n    \\t{\\n      \\ttype: formula\\n      \\texpr: datum.stack == \'stk1\' ? datum.stk1+datum.stk2 : datum.stk2+datum.stk1\\n      \\tas: sortField\\n    \\t}\\n    \\t// Calculate y0 and y1 positions for stacking nodes one on top of the other,\\n    \\t// independently for each stack, and ensuring they are in the proper order,\\n    \\t// alphabetical from the top (reversed on the y axis)\\n    \\t{\\n      \\ttype: stack\\n      \\tgroupby: [\\"stack\\"]\\n      \\tsort: {field: \\"sortField\\", order: \\"descending\\"}\\n      \\tfield: size\\n    \\t}\\n    \\t// calculate vertical center point for each node, used to draw edges\\n    \\t{type: \\"formula\\", expr: \\"(datum.y0+datum.y1)/2\\", as: \\"yc\\"}\\n  \\t]\\n\\t}\\n\\t{\\n  \\tname: groups\\n  \\tsource: nodes\\n  \\ttransform: [\\n    \\t// combine all nodes into country groups, summing up the doc counts\\n    \\t{\\n      \\ttype: aggregate\\n      \\tgroupby: [\\"stack\\", \\"grpId\\"]\\n      \\tfields: [\\"size\\"]\\n      \\tops: [\\"sum\\"]\\n      \\tas: [\\"total\\"]\\n    \\t}\\n    \\t// re-calculate the stacking y0,y1 values\\n    \\t{\\n      \\ttype: stack\\n      \\tgroupby: [\\"stack\\"]\\n      \\tsort: {field: \\"grpId\\", order: \\"descending\\"}\\n      \\tfield: total\\n    \\t}\\n    \\t// project y0 and y1 values to screen coordinates\\n    \\t// doing it once here instead of doing it several times in marks\\n    \\t{type: \\"formula\\", expr: \\"scale(\'y\', datum.y0)\\", as: \\"scaledY0\\"}\\n    \\t{type: \\"formula\\", expr: \\"scale(\'y\', datum.y1)\\", as: \\"scaledY1\\"}\\n    \\t// boolean flag if the label should be on the right of the stack\\n    \\t{type: \\"formula\\", expr: \\"datum.stack == \'stk1\'\\", as: \\"rightLabel\\"}\\n    \\t// Calculate traffic percentage for this country using \\"y\\" scale\\n    \\t// domain upper bound, which represents the total traffic\\n    \\t{\\n      \\ttype: formula\\n      \\texpr: datum.total/domain(\'y\')[1]\\n      \\tas: percentage\\n    \\t}\\n  \\t]\\n\\t}\\n\\t{\\n  \\t// This is a temp lookup table with all the \'stk2\' stack nodes\\n  \\tname: destinationNodes\\n  \\tsource: nodes\\n  \\ttransform: [\\n    \\t{type: \\"filter\\", expr: \\"datum.stack == \'stk2\'\\"}\\n  \\t]\\n\\t}\\n\\t{\\n  \\tname: edges\\n  \\tsource: nodes\\n  \\ttransform: [\\n    \\t// we only want nodes from the left stack\\n    \\t{type: \\"filter\\", expr: \\"datum.stack == \'stk1\'\\"}\\n    \\t// find corresponding node from the right stack, keep it as \\"target\\"\\n    \\t{\\n      \\ttype: lookup\\n      \\tfrom: destinationNodes\\n      \\tkey: key\\n      \\tfields: [\\"key\\"]\\n      \\tas: [\\"target\\"]\\n    \\t}\\n    \\t// calculate SVG link path between stk1 and stk2 stacks for the node pair\\n    \\t{\\n      \\ttype: linkpath\\n      \\torient: horizontal\\n      \\tshape: diagonal\\n      \\tsourceY: {expr: \\"scale(\'y\', datum.yc)\\"}\\n      \\tsourceX: {expr: \\"scale(\'x\', \'stk1\') + bandwidth(\'x\')\\"}\\n      \\ttargetY: {expr: \\"scale(\'y\', datum.target.yc)\\"}\\n      \\ttargetX: {expr: \\"scale(\'x\', \'stk2\')\\"}\\n    \\t}\\n    \\t// A little trick to calculate the thickness of the line.\\n    \\t// The value needs to be the same as the hight of the node, but scaling\\n    \\t// size to screen\'s height gives inversed value because screen\'s Y\\n    \\t// coordinate goes from the top to the bottom, whereas the graph\'s Y=0\\n    \\t// is at the bottom. So subtracting scaled doc count from screen height\\n    \\t// (which is the \\"lower\\" bound of the \\"y\\" scale) gives us the right value\\n    \\t{\\n      \\ttype: formula\\n      \\texpr: range(\'y\')[0]-scale(\'y\', datum.size)\\n      \\tas: strokeWidth\\n    \\t}\\n    \\t// Tooltip needs individual link\'s percentage of all traffic\\n    \\t{\\n      \\ttype: formula\\n      \\texpr: datum.size/domain(\'y\')[1]\\n      \\tas: percentage\\n    \\t}\\n  \\t]\\n\\t}\\n  ]\\n  scales: [\\n\\t{\\n  \\t// calculates horizontal stack positioning\\n  \\tname: x\\n  \\ttype: band\\n  \\trange: width\\n  \\tdomain: [\\"stk1\\", \\"stk2\\"]\\n  \\tpaddingOuter: 0.05\\n  \\tpaddingInner: 0.95\\n\\t}\\n\\t{\\n  \\t// this scale goes up as high as the highest y1 value of all nodes\\n  \\tname: y\\n  \\ttype: linear\\n  \\trange: height\\n  \\tdomain: {data: \\"nodes\\", field: \\"y1\\"}\\n\\t}\\n\\t{\\n  \\t// use rawData to ensure the colors stay the same when clicking.\\n  \\tname: color\\n  \\ttype: ordinal\\n  \\trange: category\\n  \\tdomain: {data: \\"rawData\\", field: \\"stk1\\"}\\n\\t}\\n\\t{\\n  \\t// this scale is used to map internal ids (stk1, stk2) to stack names\\n  \\tname: stackNames\\n  \\ttype: ordinal\\n  \\trange: [\\"Source\\", \\"Destination\\"]\\n  \\tdomain: [\\"stk1\\", \\"stk2\\"]\\n\\t}\\n  ]\\n  axes: [\\n\\t{\\n  \\t// x axis should use custom label formatting to print proper stack names\\n  \\torient: bottom\\n  \\tscale: x\\n  \\tencode: {\\n    \\tlabels: {\\n      \\tupdate: {\\n        \\ttext: {scale: \\"stackNames\\", field: \\"value\\"}\\n      \\t}\\n    \\t}\\n  \\t}\\n\\t}\\n\\t{orient: \\"left\\", scale: \\"y\\"}\\n  ]\\n  marks: [\\n\\t{\\n  \\t// draw the connecting line between stacks\\n  \\ttype: path\\n  \\tname: edgeMark\\n  \\tfrom: {data: \\"edges\\"}\\n  \\t// this prevents some autosizing issues with large strokeWidth for paths\\n  \\tclip: true\\n  \\tencode: {\\n    \\tupdate: {\\n      \\t// By default use color of the left node, except when showing traffic\\n      \\t// from just one country, in which case use destination color.\\n      \\tstroke: [\\n        \\t{\\n          \\ttest: groupSelector && groupSelector.stack==\'stk1\'\\n          \\tscale: color\\n          \\tfield: stk2\\n        \\t}\\n        \\t{scale: \\"color\\", field: \\"stk1\\"}\\n      \\t]\\n      \\tstrokeWidth: {field: \\"strokeWidth\\"}\\n      \\tpath: {field: \\"path\\"}\\n      \\t// when showing all traffic, and hovering over a country,\\n      \\t// highlight the traffic from that country.\\n      \\tstrokeOpacity: {\\n        \\tsignal: !groupSelector && (groupHover.stk1 == datum.stk1 || groupHover.stk2 == datum.stk2) ? 0.9 : 0.3\\n      \\t}\\n      \\t// Ensure that the hover-selected edges show on top\\n      \\tzindex: {\\n        \\tsignal: !groupSelector && (groupHover.stk1 == datum.stk1 || groupHover.stk2 == datum.stk2) ? 1 : 0\\n      \\t}\\n      \\t// format tooltip string\\n      \\ttooltip: {\\n        \\tsignal: datum.stk1 + \' → \' + datum.stk2 + \'\\t\' + format(datum.size, \',.0f\') + \'   (\' + format(datum.percentage, \'.1%\') + \')\'\\n      \\t}\\n    \\t}\\n    \\t// Simple mouseover highlighting of a single line\\n    \\thover: {\\n      \\tstrokeOpacity: {value: 1}\\n    \\t}\\n  \\t}\\n\\t}\\n\\t{\\n  \\t// draw stack groups (countries)\\n  \\ttype: rect\\n  \\tname: groupMark\\n  \\tfrom: {data: \\"groups\\"}\\n  \\tencode: {\\n    \\tenter: {\\n      \\tfill: {scale: \\"color\\", field: \\"grpId\\"}\\n      \\twidth: {scale: \\"x\\", band: 1}\\n    \\t}\\n    \\tupdate: {\\n      \\tx: {scale: \\"x\\", field: \\"stack\\"}\\n      \\ty: {field: \\"scaledY0\\"}\\n      \\ty2: {field: \\"scaledY1\\"}\\n      \\tfillOpacity: {value: 0.6}\\n      \\ttooltip: {\\n        \\tsignal: datum.grpId + \'   \' + format(datum.total, \',.0f\') + \'   (\' + format(datum.percentage, \'.1%\') + \')\'\\n      \\t}\\n    \\t}\\n    \\thover: {\\n      \\tfillOpacity: {value: 1}\\n    \\t}\\n  \\t}\\n\\t}\\n\\t{\\n  \\t// draw country code labels on the inner side of the stack\\n  \\ttype: text\\n  \\tfrom: {data: \\"groups\\"}\\n  \\t// don\'t process events for the labels - otherwise line mouseover is unclean\\n  \\tinteractive: false\\n  \\tencode: {\\n    \\tupdate: {\\n      \\t// depending on which stack it is, position x with some padding\\n      \\tx: {\\n        \\tsignal: scale(\'x\', datum.stack) + (datum.rightLabel ? bandwidth(\'x\') + 8 : -8)\\n      \\t}\\n      \\t// middle of the group\\n      \\tyc: {signal: \\"(datum.scaledY0 + datum.scaledY1)/2\\"}\\n      \\talign: {signal: \\"datum.rightLabel ? \'left\' : \'right\'\\"}\\n      \\tbaseline: {value: \\"middle\\"}\\n      \\tfontWeight: {value: \\"bold\\"}\\n      \\t// only show text label if the group\'s height is large enough\\n      \\ttext: {signal: \\"abs(datum.scaledY0-datum.scaledY1) > 13 ? datum.grpId : \'\'\\"}\\n    \\t}\\n  \\t}\\n\\t}\\n\\t{\\n  \\t// Create a \\"show all\\" button. Shown only when a country is selected.\\n  \\ttype: group\\n  \\tdata: [\\n    \\t// We need to make the button show only when groupSelector signal is true.\\n    \\t// Each mark is drawn as many times as there are elements in the backing data.\\n    \\t// Which means that if values list is empty, it will not be drawn.\\n    \\t// Here I create a data source with one empty object, and filter that list\\n    \\t// based on the signal value. This can only be done in a group.\\n    \\t{\\n      \\tname: dataForShowAll\\n      \\tvalues: [{}]\\n      \\ttransform: [{type: \\"filter\\", expr: \\"groupSelector\\"}]\\n    \\t}\\n  \\t]\\n  \\t// Set button size and positioning\\n  \\tencode: {\\n    \\tenter: {\\n      \\txc: {signal: \\"width/2\\"}\\n      \\ty: {value: 30}\\n      \\twidth: {value: 80}\\n      \\theight: {value: 30}\\n    \\t}\\n  \\t}\\n  \\tmarks: [\\n    \\t{\\n      \\t// This group is shown as a button with rounded corners.\\n      \\ttype: group\\n      \\t// mark name allows signal capturing\\n      \\tname: groupReset\\n      \\t// Only shows button if dataForShowAll has values.\\n      \\tfrom: {data: \\"dataForShowAll\\"}\\n      \\tencode: {\\n        \\tenter: {\\n          \\tcornerRadius: {value: 6}\\n          \\tfill: {value: \\"#F5F7FA\\"}\\n          \\tstroke: {value: \\"#c1c1c1\\"}\\n          \\tstrokeWidth: {value: 2}\\n          \\t// use parent group\'s size\\n          \\theight: {\\n            \\tfield: {group: \\"height\\"}\\n          \\t}\\n          \\twidth: {\\n            \\tfield: {group: \\"width\\"}\\n          \\t}\\n        \\t}\\n        \\tupdate: {\\n          \\t// groups are transparent by default\\n          \\topacity: {value: 1}\\n        \\t}\\n        \\thover: {\\n          \\topacity: {value: 0.7}\\n        \\t}\\n      \\t}\\n      \\tmarks: [\\n        \\t{\\n          \\ttype: text\\n          \\t// if true, it will prevent clicking on the button when over text.\\n          \\tinteractive: false\\n          \\tencode: {\\n            \\tenter: {\\n              \\t// center text in the paren group\\n              \\txc: {\\n                \\tfield: {group: \\"width\\"}\\n                \\tmult: 0.5\\n              \\t}\\n              \\tyc: {\\n                \\tfield: {group: \\"height\\"}\\n                \\tmult: 0.5\\n                \\toffset: 2\\n              \\t}\\n              \\talign: {value: \\"center\\"}\\n              \\tbaseline: {value: \\"middle\\"}\\n              \\tfontWeight: {value: \\"bold\\"}\\n              \\ttext: {value: \\"Show All\\"}\\n            \\t}\\n          \\t}\\n        \\t}\\n      \\t]\\n    \\t}\\n  \\t]\\n\\t}\\n  ]\\n  signals: [\\n\\t{\\n  \\t// used to highlight traffic to/from the same country\\n  \\tname: groupHover\\n  \\tvalue: {}\\n  \\ton: [\\n    \\t{\\n      \\tevents: @groupMark:mouseover\\n      \\tupdate: \\"{stk1:datum.stack==\'stk1\' && datum.grpId, stk2:datum.stack==\'stk2\' && datum.grpId}\\"\\n    \\t}\\n    \\t{events: \\"mouseout\\", update: \\"{}\\"}\\n  \\t]\\n\\t}\\n\\t// used to filter only the data related to the selected country\\n\\t{\\n  \\tname: groupSelector\\n  \\tvalue: false\\n  \\ton: [\\n    \\t{\\n      \\t// Clicking groupMark sets this signal to the filter values\\n      \\tevents: @groupMark:click!\\n      \\tupdate: \\"{stack:datum.stack, stk1:datum.stack==\'stk1\' && datum.grpId, stk2:datum.stack==\'stk2\' && datum.grpId}\\"\\n    \\t}\\n    \\t{\\n      \\t// Clicking \\"show all\\" button, or double-clicking anywhere resets it\\n      \\tevents: [\\n        \\t{type: \\"click\\", markname: \\"groupReset\\"}\\n        \\t{type: \\"dblclick\\"}\\n      \\t]\\n      \\tupdate: \\"false\\"\\n    \\t}\\n  \\t]\\n\\t}\\n  ]\\n}\\n"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '314c6f60-2224-11e8-b802-5bcf64c2cfb4',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.responseCodesOverTimeTitle', {
        defaultMessage: '[Logs] Response Codes Over Time + Annotations',
      }),
      visState:
        '{"title":"[Logs] Response Codes Over Time + Annotations","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"cardinality","field":"ip"}],"seperate_axis":0,"axis_position":"right","formatter":"percent","chart_type":"line","line_width":"2","point_size":"0","fill":"0.5","stacked":"percent","terms_field":"response.keyword","terms_order_by":"61ca57f2-469d-11e7-af02-69e470af7417","label":"Response Code Count","split_color_mode":"gradient"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":">=4h","axis_position":"left","axis_formatter":"number","show_legend":1,"show_grid":1,"annotations":[{"fields":"geo.src, host","template":"Security Error from {{geo.src}} on {{host}}","index_pattern":"opensearch_dashboards_sample_data_logs","query_string":"tags:error AND tags:security","id":"bd7548a0-2223-11e8-832f-d5027f3c8a47","color":"#E7664C","time_field":"timestamp","icon":"fa-asterisk","ignore_global_filters":1,"ignore_panel_filters":1}],"legend_position":"bottom","axis_scale":"normal","drop_last_bucket":0},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '24a3e970-4257-11e8-b3aa-73fdaf54bfc9',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.inputControlsTitle', {
        defaultMessage: '[Logs] Input Controls',
      }),
      visState:
        '{"title":"[Logs] Input Controls","type":"input_control_vis","params":{"controls":[{"id":"1523980210832","indexPattern":"90943e30-9a47-11e8-b64d-95841ca0b247","fieldName":"geo.src","label":"Source Country","type":"list","options":{"type":"terms","multiselect":true,"size":100,"order":"desc"},"parent":""},{"id":"1523980191978","indexPattern":"90943e30-9a47-11e8-b64d-95841ca0b247","fieldName":"machine.os.keyword","label":"OS","type":"list","options":{"type":"terms","multiselect":true,"size":100,"order":"desc"},"parent":"1523980210832"},{"id":"1523980232790","indexPattern":"90943e30-9a47-11e8-b64d-95841ca0b247","fieldName":"bytes","label":"Bytes","type":"range","options":{"decimalPlaces":0,"step":1024}}],"updateFiltersOnChange":true,"useTimeFilter":true,"pinFilters":false},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '14e2e710-4258-11e8-b3aa-73fdaf54bfc9',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.visitorOSTitle', {
        defaultMessage: '[Logs] Visitors by OS',
      }),
      visState:
        '{"title":"[Logs] Visitors by OS","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":true,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"machine.os.keyword","otherBucket":true,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","size":10,"order":"desc","orderBy":"1"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"90943e30-9a47-11e8-b64d-95841ca0b247","filter":[],"query":{"query":"","language":"kuery"}}',
      },
    },
    references: [],
  },
  {
    id: '47f2c680-a6e3-11e8-94b4-c30c0228351b',
    type: 'visualization',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.markdownInstructionsTitle', {
        defaultMessage: '[Logs] Markdown Instructions',
      }),
      visState:
        '{"title":"[Logs] Markdown Instructions","type":"markdown","params":{"fontSize":12,"openLinksInNewTab":true,"markdown":"### Sample Logs Data\\nThis dashboard contains sample data for you to play with. You can view it, search it, and interact with the visualizations. For more information about OpenSearch Dashboards, check our [docs](https://opensearch.org/docs/latest/dashboards/index/)."},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '90943e30-9a47-11e8-b64d-95841ca0b247',
    type: 'index-pattern',
    updated_at: '2018-08-29T13:22:17.617Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'opensearch_dashboards_sample_data_logs',
      timeFieldName: 'timestamp',
      fields:
        '[{"name":"@timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","esTypes":["_id"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","esTypes":["_index"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","esTypes":["_source"],"count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","esTypes":["_type"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"agent","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"agent.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "agent"}}},{"name":"bytes","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"clientip","type":"ip","esTypes":["ip"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"event.dataset","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"extension","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"extension.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "extension"}}},{"name":"geo.coordinates","type":"geo_point","esTypes":["geo_point"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.dest","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.src","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.srcdest","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"host.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "host"}}},{"name":"index","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"index.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "index"}}},{"name":"ip","type":"ip","esTypes":["ip"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"machine.os","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"machine.os.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "machine.os"}}},{"name":"machine.ram","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"memory","type":"number","esTypes":["double"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"message","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"message.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "message"}}},{"name":"phpmemory","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"referer","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"request","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "request"}}},{"name":"response","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"response.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "response"}}},{"name":"tags","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"tags.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "tags"}}},{"name":"timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"url","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"url.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent": "url"}}},{"name":"utc_time","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"hour_of_day","type":"number","count":0,"scripted":true,"script":"doc[\'timestamp\'].value.getHour()","lang":"painless","searchable":true,"aggregatable":true,"readFromDocValues":false}]',
      fieldFormatMap: '{"hour_of_day":{}}',
    },
    references: [],
  },
  {
    id: 'edf84fe0-e1a0-11e7-b6d5-4dc382ef7f5b',
    type: 'dashboard',
    updated_at: '2018-08-29T13:26:13.463Z',
    version: '3',
    references: [
      {
        name: 'panel_0',
        type: 'visualization',
        id: 'e1d0f010-9ee7-11e7-8711-e7a007dcef99',
      },
      {
        name: 'panel_1',
        type: 'visualization',
        id: '06cf9c40-9ee8-11e7-8711-e7a007dcef99',
      },
      {
        name: 'panel_2',
        type: 'visualization',
        id: '935afa20-e0cd-11e7-9d07-1398ccfcefa3',
      },
      {
        name: 'panel_3',
        type: 'visualization',
        id: '4eb6e500-e1c7-11e7-b6d5-4dc382ef7f5b',
      },
      {
        name: 'panel_4',
        type: 'visualization',
        id: '69a34b00-9ee8-11e7-8711-e7a007dcef99',
      },
      {
        name: 'panel_5',
        type: 'visualization',
        id: '42b997f0-0c26-11e8-b0ec-3bb475f6b6ff',
      },
      {
        name: 'panel_6',
        type: 'visualization',
        id: '7cbd2350-2223-11e8-b802-5bcf64c2cfb4',
      },
      {
        name: 'panel_7',
        type: 'visualization',
        id: '314c6f60-2224-11e8-b802-5bcf64c2cfb4',
      },
      {
        name: 'panel_8',
        type: 'visualization',
        id: '24a3e970-4257-11e8-b3aa-73fdaf54bfc9',
      },
      {
        name: 'panel_9',
        type: 'visualization',
        id: '14e2e710-4258-11e8-b3aa-73fdaf54bfc9',
      },
      {
        name: 'panel_10',
        type: 'visualization',
        id: '47f2c680-a6e3-11e8-94b4-c30c0228351b',
      },
    ],
    migrationVersion: {
      dashboard: '7.0.0',
    },
    attributes: {
      title: i18n.translate('home.sampleData.logsSpec.webTrafficTitle', {
        defaultMessage: '[Logs] Web Traffic',
      }),
      hits: 0,
      description: i18n.translate('home.sampleData.logsSpec.webTrafficDescription', {
        defaultMessage: "Analyze mock web traffic log data for OpenSearch's website",
      }),
      panelsJSON:
        '[{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":27,"y":11,"w":21,"h":13,"i":"2"},"panelIndex":"2","version":"7.0.0-alpha1","panelRefName":"panel_0"},{"gridData":{"x":0,"y":49,"w":24,"h":18,"i":"4"},"panelIndex":"4","version":"7.0.0-alpha1","panelRefName":"panel_1"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":0,"y":36,"w":24,"h":13,"i":"7"},"panelIndex":"7","version":"6.3.0","panelRefName":"panel_2"},{"embeddableConfig":{"mapCenter":[36.8092847020594,-96.94335937500001],"vis":{"params":{"sort":{"columnIndex":null,"direction":null}}}},"gridData":{"x":27,"y":24,"w":21,"h":12,"i":"9"},"panelIndex":"9","version":"6.3.0","panelRefName":"panel_3"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":10,"y":0,"w":9,"h":11,"i":"11"},"panelIndex":"11","title":"","version":"6.3.0","panelRefName":"panel_4"},{"gridData":{"x":0,"y":24,"w":27,"h":12,"i":"13"},"panelIndex":"13","version":"6.3.0","panelRefName":"panel_5"},{"gridData":{"x":24,"y":36,"w":24,"h":31,"i":"14"},"panelIndex":"14","version":"6.3.0","panelRefName":"panel_6"},{"gridData":{"x":0,"y":11,"w":27,"h":13,"i":"15"},"panelIndex":"15","version":"6.3.0","panelRefName":"panel_7"},{"gridData":{"x":19,"y":0,"w":15,"h":11,"i":"16"},"panelIndex":"16","title":"","version":"6.3.0","panelRefName":"panel_8"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":34,"y":0,"w":14,"h":11,"i":"17"},"panelIndex":"17","version":"6.3.0","panelRefName":"panel_9"},{"embeddableConfig":{},"gridData":{"x":0,"y":0,"w":10,"h":11,"i":"18"},"panelIndex":"18","title":"","version":"7.0.0-alpha1","panelRefName":"panel_10"}]',
      optionsJSON: '{"hidePanelTitles":false,"useMargins":true}',
      version: 1,
      timeRestore: true,
      timeTo: 'now',
      timeFrom: 'now-7d',
      refreshInterval: {
        pause: false,
        value: 900000,
      },
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"language":"kuery","query":""},"filter":[],"highlightAll":true,"version":true}',
      },
    },
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Line Charts Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Line Charts Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Line Charts"}}',
    },
    id: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzE0LDFd',
  },
  {
    attributes: {
      fieldFormatMap: '{"hour_of_day":{}}',
      fields:
        '[{"name":"@timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","esTypes":["_id"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","esTypes":["_index"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","esTypes":["_source"],"count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","esTypes":["_type"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"agent","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"agent.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"agent"}}},{"name":"bytes","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"clientip","type":"ip","esTypes":["ip"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"event.dataset","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"extension","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"extension.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"extension"}}},{"name":"geo.coordinates","type":"geo_point","esTypes":["geo_point"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.dest","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.src","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.srcdest","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"host.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"host"}}},{"name":"index","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"index.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"index"}}},{"name":"ip","type":"ip","esTypes":["ip"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"machine.os","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"machine.os.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"machine.os"}}},{"name":"machine.ram","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"memory","type":"number","esTypes":["double"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"message","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"message.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"message"}}},{"name":"phpmemory","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"referer","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"request","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"request"}}},{"name":"response","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"response.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"response"}}},{"name":"tags","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"tags.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"tags"}}},{"name":"timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"url","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"url.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"url"}}},{"name":"utc_time","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"hour_of_day","type":"number","count":0,"scripted":true,"script":"doc[\'timestamp\'].value.getHour()","lang":"painless","searchable":true,"aggregatable":true,"readFromDocValues":false}]',
      timeFieldName: 'timestamp',
      title: 'opensearch_dashboards_sample_data_logs',
    },
    id: '90943e30-9a47-11e8-b64d-95841ca0b247',
    migrationVersion: { 'index-pattern': '7.6.0' },
    references: [],
    type: 'index-pattern',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzE1LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Line) Avg bytes over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Line) Avg bytes over time","type":"line","aggs":[{"id":"1","enabled":true,"type":"avg","params":{"field":"bytes"},"schema":"metric"},{"id":"2","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"now-7d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"}],"params":{"type":"line","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Average bytes"}}],"seriesParams":[{"show":true,"type":"line","mode":"normal","data":{"label":"Average bytes","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"interpolate":"linear","showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
    },
    id: '39b5bd70-eb7b-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzE2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      styleState: '{"addTooltip":true,"addLegend":true,"legendPosition":"right","type":"line"}',
      title: '(VB) Avg bytes over time',
      uiState: '{}',
      version: 3,
      visualizationState:
        '{"searchField":"","activeVisualization":{"name":"line","aggConfigParams":[{"id":"1","enabled":true,"type":"date_histogram","params":{"field":"@timestamp","useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"},{"id":"2","enabled":true,"type":"avg","params":{"field":"bytes"},"schema":"metric"}]}}',
    },
    id: '64bb61a0-eb7b-11ed-8e00-17d7d50cd7b2',
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization-visbuilder',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzE3LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Avg bytes over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Avg bytes over time","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          1: {\\n            date_histogram: {\\n              field: @timestamp\\n              fixed_interval: 3h\\n              time_zone: America/Los_Angeles\\n              min_doc_count: 1\\n            }\\n            aggs: {\\n              2: {\\n                avg: {\\n                  field: bytes\\n                }\\n              }\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.1.buckets\\n    }\\n  }\\n  transform: [\\n    {\\n      calculate: datum.key\\n      as: timestamp\\n    }\\n    {\\n      calculate: datum[2].value\\n      as: bytes\\n    }\\n  ]\\n  layer: [\\n    {\\n      mark: {\\n        type: line\\n      }\\n    }\\n    {\\n      mark: {\\n        type: circle\\n        tooltip: true\\n      }\\n    }\\n  ]\\n  encoding: {\\n    x: {\\n      field: timestamp\\n      type: temporal\\n      axis: {\\n        title: @timestamp\\n      }\\n    }\\n    y: {\\n      field: bytes\\n      type: quantitative\\n      axis: {\\n        title: Average bytes\\n      }\\n    }\\n    color: {\\n      datum: Average bytes\\n      type: nominal\\n    }\\n  }\\n}"}}',
    },
    id: '0aa75ae0-eb7e-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:34:12.286Z',
    version: 'WzcxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Avg bytes over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Avg bytes over time","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"everything","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"avg","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":"","stacked":"none","label":"","type":"timeseries"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_ecommerce","default_timefield":"order_date","isModelInvalid":false,"drop_last_bucket":0}}',
    },
    id: 'fa54ce40-eb7b-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzE5LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Timeline) Avg bytes over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}',
    },
    id: '2c5a19f0-eb8a-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzIwLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Area Charts Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Area Charts Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Area Charts"}}',
    },
    id: 'ed89dfc0-eb8f-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzIxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Area) Stacked extensions over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Area) Stacked extensions over time","type":"area","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"now-7d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"},{"id":"3","enabled":true,"type":"terms","params":{"field":"extension.keyword","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"group"}],"params":{"type":"area","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"area","mode":"stacked","data":{"label":"Count","id":"1"},"drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true,"interpolate":"linear","valueAxis":"ValueAxis-1"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"},"labels":{}}}',
    },
    id: 'c0ba29f0-eb8f-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzIyLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      styleState: '{"addTooltip":true,"addLegend":true,"legendPosition":"right","type":"area"}',
      title: '(VisBuilder) Extensions over time',
      uiState: '{}',
      version: 3,
      visualizationState:
        '{"searchField":"","activeVisualization":{"name":"area","aggConfigParams":[{"id":"4","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"5","enabled":true,"type":"date_histogram","params":{"field":"timestamp","useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"},{"id":"6","enabled":true,"type":"terms","params":{"field":"extension.keyword","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"group"}]}}',
    },
    id: '68fe55f0-eb90-11ed-8e00-17d7d50cd7b2',
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization-visbuilder',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzIzLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"language":"kuery","query":""},"filter":[]}',
      },
      title: '(Vega) Stacked extensions over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Stacked extensions over time","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          1: {\\n            date_histogram: {\\n              field: @timestamp\\n              fixed_interval: 3h\\n              time_zone: America/Los_Angeles\\n              min_doc_count: 1\\n            }\\n            aggs: {\\n              2: {\\n                terms: {\\n                  field: extension.keyword\\n                  order: {\\n                    _count: desc\\n                  }\\n                  size: 5\\n                }\\n              }\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.1.buckets\\n    }\\n  }\\n  transform: [\\n    {\\n      flatten: [\\n        2.buckets\\n      ]\\n      as: [\\n        extension_buckets\\n      ]\\n    }\\n    {\\n      calculate: datum.key\\n      as: timestamp\\n    }\\n    {\\n      calculate: datum.extension_buckets.doc_count\\n      as: count\\n    }\\n    {\\n      calculate: datum.extension_buckets.key\\n      as: extension\\n    }\\n    {\\n      joinaggregate: [\\n        {\\n          op: sum\\n          field: count\\n          as: total_count\\n        }\\n      ]\\n      groupby: [\\n        extension\\n      ]\\n    }\\n  ]\\n  layer: [\\n    {\\n      mark: {\\n        type: area\\n        tooltip: true\\n      }\\n    }\\n  ]\\n  encoding: {\\n    x: {\\n      field: timestamp\\n      type: temporal\\n      axis: {\\n        title: timestamp\\n      }\\n    }\\n    y: {\\n      field: count\\n      type: quantitative\\n      axis: {\\n        title: Count\\n      }\\n    }\\n    order: {\\n      field: total_count\\n      type: quantitative\\n      sort: descending\\n    }\\n    color: {\\n      field: extension\\n      type: nominal\\n      sort: {\\n        field: total_count\\n        order: descending\\n      }\\n    }\\n  }\\n}"}}',
    },
    id: 'be4dc860-eb90-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:34:37.274Z',
    version: 'Wzc4LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Stacked extensions over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Stacked extensions over time","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"terms","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":"0","fill":"1","stacked":"stacked","label":"","type":"timeseries","terms_field":"extension.keyword"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_ecommerce","default_timefield":"order_date","isModelInvalid":false,"drop_last_bucket":0}}',
    },
    id: '689b7140-eb97-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzI1LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Timeline) Stacked extensions over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Timeline) Stacked extensions over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, split=extension.keyword:10, timefield=@timestamp).lines(show=true,stack=true,fill=10).yaxis(label=\\"Count\\")","interval":"auto"}}',
    },
    id: '34a5bee0-eb97-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzI2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Bar Charts (Vertical) Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Bar Charts (Vertical) Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Bar Charts (Vertical)"}}',
    },
    id: '5e34ac20-eb98-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzI3LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Vertical Bar) Stacked responses over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vertical Bar) Stacked responses over time","type":"histogram","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"now-7d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"},{"id":"3","enabled":true,"type":"terms","params":{"field":"response.keyword","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"group"}],"params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{"show":false},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
    },
    id: '23a5de70-eb99-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzI4LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      styleState:
        '{"addTooltip":true,"addLegend":true,"legendPosition":"right","type":"histogram"}',
      title: '(VisBuilder) Responses over time',
      uiState: '{}',
      version: 3,
      visualizationState:
        '{"searchField":"","activeVisualization":{"name":"histogram","aggConfigParams":[{"id":"4","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"5","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"now-7d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"},{"id":"6","enabled":true,"type":"terms","params":{"field":"response.keyword","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"group"}]}}',
    },
    id: '571745a0-eb99-11ed-8e00-17d7d50cd7b2',
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization-visbuilder',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzI5LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Stacked extensions over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Stacked extensions over time","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          1: {\\n            date_histogram: {\\n              field: @timestamp\\n              fixed_interval: 3h\\n              time_zone: America/Los_Angeles\\n              min_doc_count: 1\\n            }\\n            aggs: {\\n              2: {\\n                terms: {\\n                  field: response.keyword\\n                  order: {\\n                    _count: desc\\n                  }\\n                  size: 5\\n                }\\n              }\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.1.buckets\\n    }\\n  }\\n  transform: [\\n    {\\n      flatten: [\\n        2.buckets\\n      ]\\n      as: [\\n        response_buckets\\n      ]\\n    }\\n    {\\n      calculate: datum.key\\n      as: timestamp\\n    }\\n    {\\n      calculate: datum.response_buckets.doc_count\\n      as: count\\n    }\\n    {\\n      calculate: datum.response_buckets.key\\n      as: extension\\n    }\\n  ]\\n  layer: [\\n    {\\n      mark: {\\n        type: bar\\n        tooltip: true\\n      }\\n    }\\n  ]\\n  encoding: {\\n    x: {\\n      field: timestamp\\n      type: temporal\\n      axis: {\\n        title: timestamp\\n      }\\n      timeUnit: {\\n        unit: yearmonthdatehours\\n        step: 3\\n      }\\n    }\\n    y: {\\n      field: count\\n      type: quantitative\\n      axis: {\\n        title: Count\\n      }\\n    }\\n    order: {\\n      field: extension\\n    }\\n    color: {\\n      field: extension\\n      type: nominal\\n    }\\n  }\\n}"}}',
    },
    id: '8b78d930-eb99-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:03:15.669Z',
    version: 'Wzc2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Stacked responses over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Stacked responses over time","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"terms","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"bar","line_width":1,"point_size":"0","fill":"1","stacked":"stacked","label":"","type":"timeseries","terms_field":"response.keyword"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_ecommerce","default_timefield":"order_date","isModelInvalid":false,"drop_last_bucket":0}}',
    },
    id: '9482ed20-eb9b-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzMxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Timeline) Stacked responses over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Timeline) Stacked responses over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, split=response.keyword:10, timefield=@timestamp).bars(stack=true).yaxis(label=\\"Count\\")","interval":"auto"}}',
    },
    id: '5c276fa0-eb9b-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzMyLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Bar Charts (Horizontal) Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Bar Charts (Horizontal) Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Bar Charts (Horizontal)"}}',
    },
    id: 'fd3b0750-227b-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzMzLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Horizontal Bar) Top destination count',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Horizontal Bar) Top destination count","type":"horizontal_bar","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"geo.dest","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}],"params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"left","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":200},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"bottom","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":75,"filter":true,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
    },
    id: '08741f50-2275-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzM0LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      styleState:
        '{"addTooltip":true,"addLegend":true,"legendPosition":"right","type":"histogram"}',
      title: '(VisBuilder) Top destination count',
      uiState: '{}',
      version: 3,
      visualizationState:
        '{"searchField":"","activeVisualization":{"name":"histogram","aggConfigParams":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"geo.dest","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}]}}',
    },
    id: 'ca3ae740-2275-11ee-b88b-47a93b5c527c',
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization-visbuilder',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzM1LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Top destination count',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Top destination count","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          1: {\\n            terms: {\\n              field: geo.dest\\n              order: {\\n                _count: desc\\n              }\\n              size: 5\\n            }\\n          }\\n        }\\n      }\\n    }\\n    format: {\\n      property: aggregations.1.buckets\\n    }\\n  }\\n  transform: [\\n    {\\n      calculate: datum.key\\n      as: dest\\n    }\\n    {\\n      calculate: datum.doc_count\\n      as: count\\n    }\\n  ]\\n  layer: [\\n    {\\n      mark: {\\n        type: bar\\n        tooltip: true\\n      }\\n    }\\n  ]\\n  encoding: {\\n    x: {\\n      field: count\\n      type: quantitative\\n      axis: {\\n        title: Count\\n      }\\n    }\\n    y: {\\n      field: dest\\n      type: nominal\\n      axis: {\\n        title: Dest\\n      }\\n      sort: -x\\n    }\\n  }\\n}"}}',
    },
    id: 'f0d162c0-227b-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:39:50.773Z',
    version: 'WzgxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Top destinations count',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Top destinations count","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"top_n","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"terms","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","terms_size":"5","terms_field":"geo.dest"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_logs","default_timefield":"timestamp","isModelInvalid":false,"bar_color_rules":[{"id":"51d02a70-227c-11ee-89b9-a9479e055b94"}],"time_range_mode":"entire_time_range"}}',
    },
    id: '80e9a930-227c-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzM3LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Heatmaps Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Heatmaps Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Heatmaps"}}',
    },
    id: '1507e780-227d-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzM4LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Heatmap) Source vs OS',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Heatmap) Source vs OS","type":"heatmap","aggs":[{"id":"1","enabled":true,"type":"sum","params":{"field":"memory"},"schema":"metric"},{"id":"3","enabled":true,"type":"terms","params":{"field":"geo.src","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"group"},{"id":"2","enabled":true,"type":"terms","params":{"field":"machine.os.keyword","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}],"params":{"type":"heatmap","addTooltip":true,"addLegend":true,"enableHover":false,"legendPosition":"right","times":[],"colorsNumber":4,"colorSchema":"Greens","setColorRange":false,"colorsRange":[],"invertColors":false,"percentageMode":false,"valueAxes":[{"show":false,"id":"ValueAxis-1","type":"value","scale":{"type":"linear","defaultYExtents":false},"labels":{"show":false,"rotate":0,"overwriteColor":false,"color":"black"}}]}}',
    },
    id: '3d034700-227f-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzM5LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Source vs OS',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Source vs OS","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          3: {\\n            terms: {\\n              field: geo.src\\n              order: {\\n                1: desc\\n              }\\n              size: 5\\n            }\\n            aggs: {\\n              1: {\\n                sum: {\\n                  field: memory\\n                }\\n              }\\n              2: {\\n                terms: {\\n                  field: machine.os.keyword\\n                  order: {\\n                    1: desc\\n                  }\\n                  size: 5\\n                }\\n                aggs: {\\n                  1: {\\n                    sum: {\\n                      field: memory\\n                    }\\n                  }\\n                }\\n              }\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.3\\n    }\\n  }\\n  transform: [\\n    {\\n      flatten: [\\n        buckets\\n      ]\\n      as: [\\n        source_buckets\\n      ]\\n    }\\n    {\\n      calculate: datum.source_buckets.key\\n      as: source\\n    }\\n    {\\n      flatten: [\\n        source_buckets.2.buckets\\n      ]\\n      as: [\\n        os_buckets\\n      ]\\n    }\\n    {\\n      calculate: datum.os_buckets[1].value\\n      as: metric\\n    }\\n    {\\n      calculate: datum.os_buckets.key\\n      as: os\\n    }\\n  ]\\n  mark: {\\n    type: rect\\n    tooltip: true\\n  }\\n  encoding: {\\n    x: {\\n      field: os\\n      type: nominal\\n      axis: {\\n        title: machine OS\\n      }\\n      sort: -y\\n    }\\n    y: {\\n      field: source\\n      type: nominal\\n      axis: {\\n        title: false\\n      }\\n      sort: -x\\n    }\\n    color: {\\n      field: metric\\n      type: quantitative\\n    }\\n  }\\n}"}}',
    },
    id: '29844a70-2a50-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:43:10.202Z',
    version: 'WzgyLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Tables Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Tables Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Tables"}}',
    },
    id: '6aed7840-22a5-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Table) Bytes by request stats summary',
      uiStateJSON: '{"vis":{"sortColumn":{"colIndex":0,"direction":"asc"}}}',
      version: 1,
      visState:
        '{"title":"(Table) Bytes by request stats summary","type":"table","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"3","enabled":true,"type":"median","params":{"field":"bytes","percents":[50]},"schema":"metric"},{"id":"2","enabled":true,"type":"min","params":{"field":"bytes"},"schema":"metric"},{"id":"4","enabled":true,"type":"max","params":{"field":"bytes"},"schema":"metric"},{"id":"5","enabled":true,"type":"terms","params":{"field":"request.keyword","orderBy":"1","order":"desc","size":20,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"bucket"}],"params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"showTotal":false,"totalFunc":"sum","percentageCol":""}}',
    },
    id: 'f8df8de0-22a6-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQyLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      styleState: '{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false}',
      title: '(VisBuilder) Bytes by request stats summary',
      uiState: '{}',
      version: 3,
      visualizationState:
        '{"searchField":"","activeVisualization":{"name":"table","aggConfigParams":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"median","params":{"field":"bytes","percents":[50]},"schema":"metric"},{"id":"3","enabled":true,"type":"terms","params":{"field":"request.keyword","orderBy":"1","order":"desc","size":20,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"bucket"},{"id":"4","enabled":true,"type":"min","params":{"field":"bytes"},"schema":"metric"},{"id":"5","enabled":true,"type":"max","params":{"field":"bytes"},"schema":"metric"}]}}',
    },
    id: 'a7d21570-22a7-11ee-b88b-47a93b5c527c',
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization-visbuilder',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQzLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Bytes by request stats summary',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Bytes by request stats summary","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          5: {\\n            terms: {\\n              field: request.keyword\\n              order: {\\n                _count: desc\\n              }\\n              size: 20\\n            }\\n            aggs: {\\n              2: {\\n                min: {\\n                  field: bytes\\n                }\\n              }\\n              3: {\\n                percentiles: {\\n                  field: bytes\\n                  percents: [\\n                    50\\n                  ]\\n                }\\n              }\\n              4: {\\n                max: {\\n                  field: bytes\\n                }\\n              }\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.5\\n    }\\n  }\\n  transform: [\\n    {\\n      flatten: [\\n        buckets\\n      ]\\n      as: [\\n        buckets\\n      ]\\n    }\\n    {\\n      calculate: datum.buckets.key\\n      as: request\\n    }\\n    {\\n      calculate: datum.buckets.doc_count\\n      as: count\\n    }\\n    {\\n      calculate: datum.buckets[3].values[\\"50.0\\"]\\n      as: median_bytes\\n    }\\n    {\\n      calculate: datum.buckets[2].value\\n      as: min_bytes\\n    }\\n    {\\n      calculate: datum.buckets[4].value\\n      as: max_bytes\\n    }\\n    {\\n      window: [\\n        {\\n          op: row_number\\n          as: row_num\\n        }\\n      ]\\n    }\\n    {\\n      fold: [\\n        request\\n        count\\n        median_bytes\\n        min_bytes\\n        max_bytes\\n      ]\\n    }\\n  ]\\n  mark: {\\n    type: text\\n    limit: {\\n      expr: width/5\\n    }\\n  }\\n  encoding: {\\n    x: {\\n      field: key\\n      type: nominal\\n      axis: {\\n        orient: top\\n        title: null\\n        labelAngle: 0\\n        domain: false\\n        ticks: false\\n      }\\n      sort: -y\\n    }\\n    y: {\\n      field: row_num\\n      type: ordinal\\n      axis: null\\n      sort: {\\n        field: request\\n      }\\n    }\\n    text: {\\n      field: value\\n      type: nominal\\n    }\\n    tooltip: [\\n      {\\n        field: value\\n        type: nominal\\n      }\\n    ]\\n  }\\n  config: {\\n    view: {\\n      stroke: null\\n    }\\n  }\\n}"}}',
    },
    id: 'afdf7fa0-2a59-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:44:35.186Z',
    version: 'WzgzLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Bytes by request stats summary',
      uiStateJSON: '{"table":{"sort":{"column":"_default_","order":"asc"}}}',
      version: 1,
      visState:
        '{"title":"(TSVB) Bytes by request stats summary","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"table","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"everything","split_color_mode":"opensearchDashboards","metrics":[{"id":"c75df350-22a7-11ee-8c33-437692f62ad1","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","color_rules":[{"id":"dd26dcd0-2a61-11ee-9b78-47d8b94a8b48"}]},{"id":"c9296480-22a7-11ee-8c33-437692f62ad1","color":"#54B399","split_mode":"everything","metrics":[{"id":"c9296481-22a7-11ee-8c33-437692f62ad1","type":"avg","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"bytes","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","color_rules":[{"id":"ed1dcca0-22a7-11ee-8c33-437692f62ad1"}]},{"id":"caa3cf80-22a7-11ee-8c33-437692f62ad1","color":"#54B399","split_mode":"everything","metrics":[{"id":"caa3cf81-22a7-11ee-8c33-437692f62ad1","type":"min","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"bytes","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","color_rules":[{"id":"eab16080-22a7-11ee-8c33-437692f62ad1"}]},{"id":"cc20d290-22a7-11ee-8c33-437692f62ad1","color":"#54B399","split_mode":"everything","metrics":[{"id":"cc20d291-22a7-11ee-8c33-437692f62ad1","type":"max","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"bytes","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","color_rules":[{"id":"e6051680-22a7-11ee-8c33-437692f62ad1"}]}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_logs","default_timefield":"timestamp","isModelInvalid":false,"bar_color_rules":[{"id":"bdf75590-22a7-11ee-8c33-437692f62ad1"}],"pivot_id":"request.keyword","pivot_type":"string","pivot_rows":"20","time_range_mode":"entire_time_range"}}',
    },
    id: '009fd930-22a8-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQ1LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Metrics Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Metrics Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Metrics"}}',
    },
    id: 'b24e65c0-22a3-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQ2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Metric) Unique visitors',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Metric) Unique visitors","type":"metric","aggs":[{"id":"1","enabled":true,"type":"cardinality","params":{"field":"clientip"},"schema":"metric"}],"params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":60}}}}',
    },
    id: '104396f0-22a4-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQ3LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      styleState:
        '{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":60}}}',
      title: '(VisBuilder) Unique visitors',
      uiState: '{}',
      version: 3,
      visualizationState:
        '{"searchField":"","activeVisualization":{"name":"metric","aggConfigParams":[{"id":"1","enabled":true,"type":"cardinality","params":{"field":"clientip"},"schema":"metric"}]}}',
    },
    id: '42ddb0f0-22a4-11ee-b88b-47a93b5c527c',
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization-visbuilder',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzQ4LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Unique visitors',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Unique visitors","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: _all\\n      body: {\\n        aggs: {\\n          1: {\\n            cardinality: {\\n              field: clientip\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.1.value\\n    }\\n  }\\n  params: [\\n    {\\n      name: metricFontSize\\n      value: 80\\n    }\\n  ]\\n  mark: {\\n    type: text\\n    fontSize: {\\n      expr: metricFontSize\\n    }\\n    fontWeight: 700\\n  }\\n  encoding: {\\n    text: {\\n      field: data\\n      type: nominal\\n    }\\n    x: {\\n      field: data\\n      type: nominal\\n      axis: {\\n        title: Unique count of clientip\\n        titleY: {\\n          expr: -height/2 + metricFontSize/2\\n        }\\n        titleFontSize: 16\\n        titleFontWeight: normal\\n        labels: false\\n        domain: false\\n        ticks: false\\n      }\\n    }\\n  }\\n  config: {\\n    view: {\\n      stroke: null\\n    }\\n  }\\n}"}}',
    },
    id: '249bf920-2a61-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:45:39.915Z',
    version: 'Wzg0LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Unique visitors',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Unique visitors","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"metric","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"everything","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"cardinality","field":"clientip"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":""}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_logs","default_timefield":"timestamp","isModelInvalid":false,"background_color_rules":[{"id":"470e09a0-22a3-11ee-9154-c7376b9c3c25"}],"bar_color_rules":[{"id":"4819fb60-22a3-11ee-9154-c7376b9c3c25"}],"time_range_mode":"entire_time_range"}}',
    },
    id: '9a5e50b0-22a3-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzUwLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Pie Charts Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Pie Charts Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Pie Charts"}}',
    },
    id: '8add5d90-2a44-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzUxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Pie) Visitors by OS',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Pie) Visitors by OS","type":"pie","aggs":[{"id":"1","enabled":true,"type":"cardinality","params":{"field":"clientip"},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"machine.os.keyword","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}],"params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}}}',
    },
    id: '7fd12620-2a44-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzUyLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Visitors by OS',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Visitors by OS","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          2: {\\n            terms: {\\n              field: machine.os.keyword\\n              order: {\\n                1: desc\\n              }\\n              size: 5\\n            }\\n            aggs: {\\n              1: {\\n                cardinality: {\\n                  field: clientip\\n                }\\n              }\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.2\\n    }\\n  }\\n  transform: [\\n    {\\n      flatten: [\\n        buckets\\n      ]\\n      as: [\\n        os_buckets\\n      ]\\n    }\\n    {\\n      calculate: datum.os_buckets.key\\n      as: os\\n    }\\n    {\\n      calculate: datum.os_buckets[1].value\\n      as: visitors\\n    }\\n    {\\n      joinaggregate: [\\n        {\\n          op: sum\\n          field: visitors\\n          as: total_visitors\\n        }\\n      ]\\n    }\\n    {\\n      calculate: datum.visitors / datum.total_visitors\\n      as: perc_visitors\\n    }\\n  ]\\n  mark: {\\n    type: arc\\n    tooltip: true\\n    innerRadius: {\\n      expr: min(height, width) * .375\\n    }\\n  }\\n  encoding: {\\n    theta: {\\n      field: visitors\\n      type: quantitative\\n      scale: {\\n        reverse: true\\n      }\\n    }\\n    order: {\\n      field: visitors\\n      type: quantitative\\n    }\\n    color: {\\n      field: os\\n      type: nominal\\n      sort: -theta\\n    }\\n    tooltip: [\\n      {\\n        field: os\\n      }\\n      {\\n        field: visitors\\n      }\\n      {\\n        field: perc_visitors\\n        title: % visitors\\n        format: .2%\\n      }\\n    ]\\n  }\\n}"}}',
    },
    id: '3e2d7da0-2a6b-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:53:03.733Z',
    version: 'Wzg3LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Radial Charts Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Radial Charts Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Radial Charts"}}',
    },
    id: '6154a6c0-2280-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzU0LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Gauge) Average bytes by extension',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Gauge) Average bytes by extension","type":"gauge","aggs":[{"id":"1","enabled":true,"type":"avg","params":{"field":"bytes"},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"extension.keyword","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"group"}],"params":{"type":"gauge","addTooltip":true,"addLegend":true,"isDisplayWarning":false,"gauge":{"alignment":"automatic","extendRange":true,"percentageMode":false,"gaugeType":"Arc","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","colorSchema":"Green to Red","gaugeColorMode":"Labels","colorsRange":[{"from":0,"to":6000},{"from":6000,"to":6500},{"from":6500,"to":7000}],"invertColors":false,"labels":{"show":true,"color":"black"},"scale":{"show":true,"labels":false,"color":"rgba(105,112,125,0.2)"},"type":"meter","style":{"bgWidth":0.9,"width":0.9,"mask":false,"bgMask":false,"maskBars":50,"bgFill":"rgba(105,112,125,0.2)","bgColor":true,"subText":"","fontSize":60}}}}',
    },
    id: 'f772de50-2281-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzU1LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Average bytes by extension',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Average bytes by extension","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"gauge","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"terms","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"avg","field":"bytes"}],"separate_axis":0,"axis_position":"right","formatter":"bytes","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":"","var_name":"","terms_order_by":"61ca57f2-469d-11e7-af02-69e470af7417","terms_field":"extension.keyword","terms_size":"5"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_logs","default_timefield":"timestamp","isModelInvalid":false,"markdown":"# Average bytes by extension\\n\\n{{#each _all}}\\n- {{ label }}\\n{{/each}}\\n\\nText that is not a quote\\n\\n> Text that is a quote\\n\\n## A second-level heading\\n\\nUse `git status` to list all new or modified files that haven\'t yet been committed.\\n\\nSome basic Git commands are:\\n```\\ngit status\\ngit add\\ngit commit\\n```\\n\\n### A third-level heading\\n\\nTest out the [OpenSearch Dashboards Playground](https://playground.opensearch.org).\\n\\nNavigate to [home](/).\\n\\n![Screenshot of sample data UI in OpenSearch Dashboards](https://opensearch.org/docs/latest/images/dashboards/add-sample-data.png)\\n\\n- list item\\n- list item\\n- list item\\n\\n1. list item\\n2. list item\\n3. list item{{# count.data.formatted }}{{/ count.data.formatted }}{{ count.label }}","time_range_mode":"entire_time_range","bar_color_rules":[{"id":"459b7790-2287-11ee-9154-c7376b9c3c25"}],"gauge_color_rules":[{"value":0,"id":"489a1190-2287-11ee-9154-c7376b9c3c25","gauge":"rgba(1,125,115,1)","operator":"gt"},{"value":6000,"id":"adbd7cb0-2287-11ee-9154-c7376b9c3c25","gauge":"rgba(245,167,0,1)","operator":"gt"},{"value":6500,"id":"b1022060-2287-11ee-9154-c7376b9c3c25","gauge":"rgba(189,39,30,1)","operator":"gt"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half","gauge_max":"7000","filter":{"query":"","language":"kuery"},"gauge_inner_color":null}}',
    },
    id: '4ec31b10-2288-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzU2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Vega) Average machine RAM',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Vega) Average machine RAM","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega-lite/v5.json\\n  data: {\\n    url: {\\n      %context%: true\\n      %timefield%: @timestamp\\n      index: opensearch_dashboards_sample_data_logs\\n      body: {\\n        aggs: {\\n          1: {\\n            avg: {\\n              field: machine.ram\\n            }\\n          }\\n        }\\n        size: 0\\n      }\\n    }\\n    format: {\\n      property: aggregations.1.value\\n    }\\n  }\\n  params: [\\n    {\\n      name: goal\\n      value: 20000000000\\n    }\\n    {\\n      name: offset\\n      value: 10\\n    }\\n    {\\n      name: metricFontSize\\n      value: 60\\n    }\\n    {\\n      name: range\\n      expr: PI*5/8\\n    }\\n    {\\n      name: innerRadius\\n      expr: min(height, width) * .375\\n    }\\n  ]\\n  transform: [\\n    {\\n      calculate: datum.data\\n      as: avg_machine_ram\\n    }\\n    {\\n      calculate: datum.avg_machine_ram / goal\\n      as: perc_goal\\n    }\\n  ]\\n  layer: [\\n    {\\n      mark: {\\n        type: arc\\n        innerRadius: {\\n          expr: innerRadius + offset\\n        }\\n        outerRadius: {\\n          expr: (min(height, width) * .5) - offset\\n        }\\n      }\\n      encoding: {\\n        theta: {\\n          datum: {\\n            expr: goal\\n          }\\n          type: quantitative\\n          scale: {\\n            range: [\\n              {\\n                expr: -range\\n              }\\n              {\\n                expr: range\\n              }\\n            ]\\n          }\\n        }\\n        color: {\\n          value: rgba(105, 112, 125, 0.2)\\n        }\\n      }\\n    }\\n    {\\n      mark: {\\n        type: arc\\n        tooltip: true\\n        innerRadius: {\\n          expr: innerRadius\\n        }\\n      }\\n      encoding: {\\n        theta: {\\n          field: avg_machine_ram\\n          type: quantitative\\n          scale: {\\n            domain: [\\n              0\\n              {\\n                expr: goal\\n              }\\n            ]\\n            range: [\\n              {\\n                expr: -range\\n              }\\n              {\\n                expr: range\\n              }\\n            ]\\n          }\\n          axis: {\\n            ticks: true\\n          }\\n        }\\n        tooltip: [\\n          {\\n            field: avg_machine_ram\\n            title: Average RAM\\n          }\\n          {\\n            field: perc_goal\\n            title: % of goal\\n            format: .3%\\n          }\\n        ]\\n      }\\n    }\\n    {\\n      mark: {\\n        type: text\\n        fontSize: {\\n          expr: metricFontSize\\n        }\\n      }\\n      encoding: {\\n        text: {\\n          field: perc_goal\\n          type: nominal\\n          format: .3%\\n        }\\n        x: {\\n          field: perc_goal\\n          type: nominal\\n          axis: {\\n            title: Average RAM\\n            titleY: {\\n              expr: -height/2 - metricFontSize\\n            }\\n            titleFontSize: 16\\n            titleFontWeight: normal\\n            labels: false\\n            domain: false\\n            ticks: false\\n          }\\n        }\\n      }\\n    }\\n  ]\\n  config: {\\n    view: {\\n      stroke: null\\n    }\\n  }\\n}"}}',
    },
    id: 'd5bad060-2a7e-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T19:52:57.873Z',
    version: 'Wzg2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Goal) Average machine RAM',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Goal) Average machine RAM","type":"goal","aggs":[{"id":"1","enabled":true,"type":"avg","params":{"field":"machine.ram"},"schema":"metric"}],"params":{"addTooltip":true,"addLegend":false,"isDisplayWarning":false,"type":"gauge","gauge":{"verticalSplit":false,"autoExtend":false,"percentageMode":true,"gaugeType":"Arc","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","useRanges":false,"colorSchema":"Green to Red","gaugeColorMode":"None","colorsRange":[{"from":0,"to":10000000000},{"from":10000000000,"to":20000000000}],"invertColors":false,"labels":{"show":true,"color":"black"},"scale":{"show":false,"labels":false,"color":"rgba(105,112,125,0.2)","width":2},"type":"meter","style":{"bgFill":"rgba(105,112,125,0.2)","bgColor":false,"labelColor":false,"subText":"","fontSize":60}}}}',
    },
    id: '9b0ae760-2282-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzU4LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Average machine RAM',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Average machine RAM","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"gauge","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"everything","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"avg","field":"machine.ram"},{"id":"333bb4d0-2290-11ee-9154-c7376b9c3c25","type":"math","variables":[{"id":"3643ebc0-2290-11ee-9154-c7376b9c3c25","name":"ram","field":"61ca57f2-469d-11e7-af02-69e470af7417"}],"script":"params.ram/20000000000"}],"separate_axis":0,"axis_position":"right","formatter":"percent","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":"Average RAM","value_template":"","filter":{"query":"","language":"kuery"}}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_logs","default_timefield":"timestamp","isModelInvalid":false,"gauge_color_rules":[{"value":0,"id":"e17166f0-228e-11ee-9154-c7376b9c3c25","gauge":"rgba(189,39,30,1)","operator":"gt"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half","time_range_mode":"entire_time_range","gauge_max":"1","filter":{"query":"","language":"kuery"}}}',
    },
    id: '19717e00-228f-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzU5LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Maps Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Maps Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Maps"}}',
    },
    id: '93cc8830-227f-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzYwLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Coordinate Map) Geohash coordinates',
      uiStateJSON: '{"mapZoom":3,"mapCenter":[35.0659731379842,-107.80640422373408]}',
      version: 1,
      visState:
        '{"title":"(Coordinate Map) Geohash coordinates","type":"tile_map","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"geohash_grid","params":{"field":"geo.coordinates","autoPrecision":true,"precision":2,"useGeocentroid":true,"isFilteredByCollar":true},"schema":"segment"}],"params":{"colorSchema":"Yellow to Red","mapType":"Scaled Circle Markers","isDesaturated":true,"addTooltip":true,"heatClusterSize":1.5,"legendPosition":"bottomright","mapZoom":2,"mapCenter":[0,0],"wms":{"enabled":false,"url":"","options":{"version":"","layers":"","format":"image/png","transparent":true,"attribution":"","styles":""},"selectedTmsLayer":{"origin":"elastic_maps_service","id":"road_map","minZoom":0,"maxZoom":14,"attribution":"<a rel=\\"noreferrer noopener\\" href=\\"https://www.openstreetmap.org/copyright\\">Map data © OpenStreetMap contributors</a>"}}}}',
    },
    id: 'fe07f770-227f-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzYxLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Region Map) Destination count',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Region Map) Destination count","type":"region_map","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"geo.dest","orderBy":"1","order":"desc","size":50,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}],"params":{"addTooltip":true,"colorSchema":"Yellow to Red","emsHotLink":"?locale=en#file/world_countries","isDisplayWarning":true,"layerChosenByUser":"default","legendPosition":"bottomright","mapCenter":[0,0],"mapZoom":2,"outlineWeight":1,"selectedCustomJoinField":null,"selectedJoinField":{"description":"ISO 3166-1 alpha-2 Code","name":"iso2","type":"id"},"selectedLayer":{"attribution":"<a rel=\\"noreferrer noopener\\" href=\\"http://www.naturalearthdata.com/about/terms-of-use\\">Made with NaturalEarth</a>","created_at":"2017-04-26T17:12:15.978370","fields":[{"description":"ISO 3166-1 alpha-2 Code","name":"iso2","type":"id"},{"description":"ISO 3166-1 alpha-3 Code","name":"iso3","type":"id"},{"description":"Name","name":"name","type":"name"}],"format":{"type":"geojson"},"id":"world_countries","isEMS":true,"layerId":"elastic_maps_service.World Countries","name":"World Countries","origin":"elastic_maps_service"},"showAllShapes":true,"wms":{"enabled":false,"options":{"attribution":"","format":"image/png","layers":"","styles":"","transparent":true,"version":""},"selectedTmsLayer":{"attribution":"<a rel=\\"noreferrer noopener\\" href=\\"https://www.openstreetmap.org/copyright\\">Map data © OpenStreetMap contributors</a>","id":"road_map","maxZoom":14,"minZoom":0,"origin":"elastic_maps_service"},"url":""}}}',
    },
    id: 'eb268650-2a43-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzYyLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Text Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Text Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Text"}}',
    },
    id: '45146a10-2283-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzYzLDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(Markdown) Sample static markdown',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Markdown) Sample static markdown","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# A first-level heading\\n\\n- **This is bold text**\\n- _This text is italicized_\\n- ~~This was mistaken text~~\\n- **This text is _extremely_ important**\\n- ***All this text is important***\\n\\nText that is not a quote\\n\\n> Text that is a quote\\n\\n## A second-level heading\\n\\nUse `git status` to list all new or modified files that haven\'t yet been committed.\\n\\nSome basic Git commands are:\\n```\\ngit status\\ngit add\\ngit commit\\n```\\n\\n### A third-level heading\\n\\nTest out the [OpenSearch Dashboards Playground](https://playground.opensearch.org).\\n\\nNavigate to [home](/).\\n\\n![Screenshot of sample data UI in OpenSearch Dashboards](https://opensearch.org/docs/latest/images/dashboards/add-sample-data.png)\\n\\n- list item\\n- list item\\n- list item\\n\\n1. list item\\n2. list item\\n3. list item"}}',
    },
    id: '23250ed0-2285-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzY0LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: '(TSVB) Sample static markdown',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(TSVB) Sample static markdown","type":"metrics","aggs":[],"params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"markdown","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"everything","split_color_mode":"opensearchDashboards","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none"}],"time_field":"timestamp","index_pattern":"opensearch_dashboards_sample_data_logs","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"tooltip_mode":"show_all","default_index_pattern":"opensearch_dashboards_sample_data_logs","default_timefield":"timestamp","isModelInvalid":false,"markdown":"# A first-level heading\\n\\n- **This is bold text**\\n- _This text is italicized_\\n- ~~This was mistaken text~~\\n- **This text is _extremely_ important**\\n- ***All this text is important***\\n\\nText that is not a quote\\n\\n> Text that is a quote\\n\\n## A second-level heading\\n\\nUse `git status` to list all new or modified files that haven\'t yet been committed.\\n\\nSome basic Git commands are:\\n```\\ngit status\\ngit add\\ngit commit\\n```\\n\\n### A third-level heading\\n\\nTest out the [OpenSearch Dashboards Playground](https://playground.opensearch.org).\\n\\nNavigate to [home](/).\\n\\n![Screenshot of sample data UI in OpenSearch Dashboards](https://opensearch.org/docs/latest/images/dashboards/add-sample-data.png)\\n\\n- list item\\n- list item\\n- list item\\n\\n1. list item\\n2. list item\\n3. list item"}}',
    },
    id: '4c6a47e0-2291-11ee-b88b-47a93b5c527c',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzY1LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
      title: 'Tag Cloud Header',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"Tag Cloud Header","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"# Tag Cloud"}}',
    },
    id: 'a58f3540-2a45-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzY2LDFd',
  },
  {
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '(Tag Cloud) Requests',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"(Tag Cloud) Requests","type":"tagcloud","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"request.keyword","orderBy":"1","order":"desc","size":15,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}],"params":{"scale":"linear","orientation":"single","minFontSize":18,"maxFontSize":72,"showLabel":true}}',
    },
    id: '81017350-2a45-11ee-92de-ad1b6a4928e5',
    migrationVersion: { visualization: '7.10.0' },
    references: [
      {
        id: '90943e30-9a47-11e8-b64d-95841ca0b247',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    type: 'visualization',
    updated_at: '2023-07-25T17:00:34.843Z',
    version: 'WzY3LDFd',
  },
  {
    attributes: {
      description: '',
      hits: 0,
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"language":"kuery","query":""},"filter":[]}',
      },
      optionsJSON: '{"hidePanelTitles":false,"useMargins":true}',
      panelsJSON:
        '[{"version":"3.0.0","gridData":{"x":0,"y":0,"w":48,"h":5,"i":"debc95ec-7d43-49ee-84c8-95ad7b0b03ea"},"panelIndex":"debc95ec-7d43-49ee-84c8-95ad7b0b03ea","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_0"},{"version":"3.0.0","gridData":{"x":0,"y":5,"w":16,"h":16,"i":"0c23bab6-f9a2-4bb6-b9d7-918b0879f18f"},"panelIndex":"0c23bab6-f9a2-4bb6-b9d7-918b0879f18f","embeddableConfig":{},"panelRefName":"panel_1"},{"version":"3.0.0","gridData":{"x":16,"y":5,"w":16,"h":16,"i":"5eb89f9b-4086-4508-b469-dc8a85aa9a1f"},"panelIndex":"5eb89f9b-4086-4508-b469-dc8a85aa9a1f","embeddableConfig":{"uiState":{}},"panelRefName":"panel_2"},{"version":"3.0.0","gridData":{"x":32,"y":5,"w":16,"h":16,"i":"8402a6cc-8219-412e-9232-50d0e5a91735"},"panelIndex":"8402a6cc-8219-412e-9232-50d0e5a91735","embeddableConfig":{},"panelRefName":"panel_3"},{"version":"3.0.0","gridData":{"x":0,"y":21,"w":16,"h":16,"i":"1fb33b9c-7ea3-4113-84cc-4799d4398798"},"panelIndex":"1fb33b9c-7ea3-4113-84cc-4799d4398798","embeddableConfig":{},"panelRefName":"panel_4"},{"version":"3.0.0","gridData":{"x":16,"y":21,"w":16,"h":16,"i":"ea9035e7-1163-4662-a645-5aee8a3201ed"},"panelIndex":"ea9035e7-1163-4662-a645-5aee8a3201ed","embeddableConfig":{},"panelRefName":"panel_5"},{"version":"3.0.0","gridData":{"x":0,"y":37,"w":48,"h":5,"i":"eba90567-b720-43dc-9065-9097282c668e"},"panelIndex":"eba90567-b720-43dc-9065-9097282c668e","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_6"},{"version":"3.0.0","gridData":{"x":0,"y":42,"w":16,"h":16,"i":"f816a6c6-8fdd-405c-826e-58d0958d5f33"},"panelIndex":"f816a6c6-8fdd-405c-826e-58d0958d5f33","embeddableConfig":{"table":null,"vis":{"legendOpen":true}},"panelRefName":"panel_7"},{"version":"3.0.0","gridData":{"x":16,"y":42,"w":16,"h":16,"i":"f49be7f3-7913-4c24-b98a-cdd7e8e3f893"},"panelIndex":"f49be7f3-7913-4c24-b98a-cdd7e8e3f893","embeddableConfig":{"uiState":{}},"panelRefName":"panel_8"},{"version":"3.0.0","gridData":{"x":32,"y":42,"w":16,"h":16,"i":"cc261ebe-d39a-46d0-8de4-d3602889f8f6"},"panelIndex":"cc261ebe-d39a-46d0-8de4-d3602889f8f6","embeddableConfig":{},"panelRefName":"panel_9"},{"version":"3.0.0","gridData":{"x":0,"y":58,"w":16,"h":16,"i":"9b57f39e-7fe2-47d1-ae25-afbbe1179525"},"panelIndex":"9b57f39e-7fe2-47d1-ae25-afbbe1179525","embeddableConfig":{},"panelRefName":"panel_10"},{"version":"3.0.0","gridData":{"x":16,"y":58,"w":16,"h":16,"i":"f1e579ac-2aff-4449-87db-21f1643e379d"},"panelIndex":"f1e579ac-2aff-4449-87db-21f1643e379d","embeddableConfig":{},"panelRefName":"panel_11"},{"version":"3.0.0","gridData":{"x":0,"y":74,"w":48,"h":5,"i":"06c8b217-3d11-431f-8591-b811046a6a16"},"panelIndex":"06c8b217-3d11-431f-8591-b811046a6a16","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_12"},{"version":"3.0.0","gridData":{"x":0,"y":79,"w":16,"h":16,"i":"ab20d005-854e-4bf6-91ff-aedf5fc2712a"},"panelIndex":"ab20d005-854e-4bf6-91ff-aedf5fc2712a","embeddableConfig":{},"panelRefName":"panel_13"},{"version":"3.0.0","gridData":{"x":16,"y":79,"w":16,"h":16,"i":"0ab357d5-9918-442e-8a27-a6e3d61abb98"},"panelIndex":"0ab357d5-9918-442e-8a27-a6e3d61abb98","embeddableConfig":{"uiState":{}},"panelRefName":"panel_14"},{"version":"3.0.0","gridData":{"x":32,"y":79,"w":16,"h":16,"i":"b60e8845-daf9-488a-9d7c-2e6c41d46ab4"},"panelIndex":"b60e8845-daf9-488a-9d7c-2e6c41d46ab4","embeddableConfig":{},"panelRefName":"panel_15"},{"version":"3.0.0","gridData":{"x":0,"y":95,"w":16,"h":16,"i":"6617b4f6-3227-4264-b87d-53f70fba6d79"},"panelIndex":"6617b4f6-3227-4264-b87d-53f70fba6d79","embeddableConfig":{},"panelRefName":"panel_16"},{"version":"3.0.0","gridData":{"x":16,"y":95,"w":16,"h":16,"i":"ea71d48b-a9b1-4822-b997-b5da294c7012"},"panelIndex":"ea71d48b-a9b1-4822-b997-b5da294c7012","embeddableConfig":{},"panelRefName":"panel_17"},{"version":"3.0.0","gridData":{"x":0,"y":111,"w":48,"h":5,"i":"6594da6a-87bd-4242-94db-9f04f8d961bb"},"panelIndex":"6594da6a-87bd-4242-94db-9f04f8d961bb","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_18"},{"version":"3.0.0","gridData":{"x":0,"y":116,"w":16,"h":16,"i":"dca1fdd1-66ba-4dbb-94a9-033345da105d"},"panelIndex":"dca1fdd1-66ba-4dbb-94a9-033345da105d","embeddableConfig":{},"panelRefName":"panel_19"},{"version":"3.0.0","gridData":{"x":16,"y":116,"w":16,"h":16,"i":"98b7b7d9-0441-4f2a-a15b-d94f4eb3d61b"},"panelIndex":"98b7b7d9-0441-4f2a-a15b-d94f4eb3d61b","embeddableConfig":{"uiState":{}},"panelRefName":"panel_20"},{"version":"3.0.0","gridData":{"x":32,"y":116,"w":16,"h":16,"i":"9a4bd010-0c94-415d-9f21-3aabe24cb625"},"panelIndex":"9a4bd010-0c94-415d-9f21-3aabe24cb625","embeddableConfig":{},"panelRefName":"panel_21"},{"version":"3.0.0","gridData":{"x":0,"y":132,"w":16,"h":16,"i":"77b17b31-4a7c-4d79-8f02-3d5199fe3e15"},"panelIndex":"77b17b31-4a7c-4d79-8f02-3d5199fe3e15","embeddableConfig":{},"panelRefName":"panel_22"},{"version":"3.0.0","gridData":{"x":0,"y":148,"w":48,"h":5,"i":"6011b779-dc42-4e4c-b539-2c834057fb47"},"panelIndex":"6011b779-dc42-4e4c-b539-2c834057fb47","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_23"},{"version":"3.0.0","gridData":{"x":0,"y":153,"w":16,"h":16,"i":"d278b903-0f8e-4531-ba70-793f690d0b86"},"panelIndex":"d278b903-0f8e-4531-ba70-793f690d0b86","embeddableConfig":{"vis":null},"panelRefName":"panel_24"},{"version":"3.0.0","gridData":{"x":16,"y":153,"w":16,"h":16,"i":"b6d5a860-b78a-4ca4-b283-bb7223861ee8"},"panelIndex":"b6d5a860-b78a-4ca4-b283-bb7223861ee8","embeddableConfig":{},"panelRefName":"panel_25"},{"version":"3.0.0","gridData":{"x":0,"y":169,"w":48,"h":5,"i":"f76c7138-975d-46d0-841d-b5adaa12db4b"},"panelIndex":"f76c7138-975d-46d0-841d-b5adaa12db4b","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_26"},{"version":"3.0.0","gridData":{"x":0,"y":174,"w":16,"h":16,"i":"3bab6531-5d55-45c6-ad95-8de643fd8726"},"panelIndex":"3bab6531-5d55-45c6-ad95-8de643fd8726","embeddableConfig":{"table":null,"vis":{"columnsWidth":[{"colIndex":0,"width":102.4}],"sortColumn":{"colIndex":0,"direction":"asc"}}},"panelRefName":"panel_27"},{"version":"3.0.0","gridData":{"x":16,"y":174,"w":16,"h":16,"i":"8d91d7c6-af0c-4dee-a5cc-657bdf5b1ad8"},"panelIndex":"8d91d7c6-af0c-4dee-a5cc-657bdf5b1ad8","embeddableConfig":{"uiState":{"vis":{"sortColumn":{"colIndex":0,"direction":"asc"}}}},"panelRefName":"panel_28"},{"version":"3.0.0","gridData":{"x":32,"y":174,"w":16,"h":16,"i":"6c9ac433-1c03-4eee-8e4f-a2fb94669e4a"},"panelIndex":"6c9ac433-1c03-4eee-8e4f-a2fb94669e4a","embeddableConfig":{},"panelRefName":"panel_29"},{"version":"3.0.0","gridData":{"x":0,"y":190,"w":16,"h":16,"i":"bf054c81-0e97-4ce3-94d2-cfc617286465"},"panelIndex":"bf054c81-0e97-4ce3-94d2-cfc617286465","embeddableConfig":{"table":{"sort":{"column":"61ca57f1-469d-11e7-af02-69e470af7417","order":"desc"}}},"panelRefName":"panel_30"},{"version":"3.0.0","gridData":{"x":0,"y":206,"w":48,"h":5,"i":"fdfaa786-d74a-454e-b9f5-8031dc103055"},"panelIndex":"fdfaa786-d74a-454e-b9f5-8031dc103055","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_31"},{"version":"3.0.0","gridData":{"x":0,"y":211,"w":16,"h":16,"i":"9f0ef347-bcb1-4fd2-ab7e-7a1b2df9a8e4"},"panelIndex":"9f0ef347-bcb1-4fd2-ab7e-7a1b2df9a8e4","embeddableConfig":{},"panelRefName":"panel_32"},{"version":"3.0.0","gridData":{"x":16,"y":211,"w":16,"h":16,"i":"3a684545-ffdd-4f74-8f61-de8e09715f20"},"panelIndex":"3a684545-ffdd-4f74-8f61-de8e09715f20","embeddableConfig":{"uiState":{}},"panelRefName":"panel_33"},{"version":"3.0.0","gridData":{"x":32,"y":211,"w":16,"h":16,"i":"a31d3e61-7252-4649-8fc7-7b7f619901a6"},"panelIndex":"a31d3e61-7252-4649-8fc7-7b7f619901a6","embeddableConfig":{},"panelRefName":"panel_34"},{"version":"3.0.0","gridData":{"x":0,"y":227,"w":16,"h":16,"i":"2bffb85a-d5bf-4e64-a414-9f3d8dca3662"},"panelIndex":"2bffb85a-d5bf-4e64-a414-9f3d8dca3662","embeddableConfig":{},"panelRefName":"panel_35"},{"version":"3.0.0","gridData":{"x":0,"y":243,"w":48,"h":5,"i":"50fe3711-41a9-4b8b-8a5d-f2a450f7d0d3"},"panelIndex":"50fe3711-41a9-4b8b-8a5d-f2a450f7d0d3","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_36"},{"version":"3.0.0","gridData":{"x":0,"y":248,"w":16,"h":16,"i":"0273a589-6799-4144-9449-fdf186c13a9e"},"panelIndex":"0273a589-6799-4144-9449-fdf186c13a9e","embeddableConfig":{},"panelRefName":"panel_37"},{"version":"3.0.0","gridData":{"x":16,"y":248,"w":16,"h":16,"i":"a431a1d3-a2f8-4d73-b50b-bc9824e68202"},"panelIndex":"a431a1d3-a2f8-4d73-b50b-bc9824e68202","embeddableConfig":{},"panelRefName":"panel_38"},{"version":"3.0.0","gridData":{"x":0,"y":264,"w":48,"h":5,"i":"2af2604a-f9d9-4070-b171-25a8f9544da7"},"panelIndex":"2af2604a-f9d9-4070-b171-25a8f9544da7","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_39"},{"version":"3.0.0","gridData":{"x":0,"y":269,"w":16,"h":16,"i":"b72c4b77-abbb-4ad2-a117-c71f6e6ae100"},"panelIndex":"b72c4b77-abbb-4ad2-a117-c71f6e6ae100","embeddableConfig":{"vis":null},"panelRefName":"panel_40"},{"version":"3.0.0","gridData":{"x":16,"y":269,"w":16,"h":16,"i":"9f0a614d-59b8-4918-8b9e-cd6151268c82"},"panelIndex":"9f0a614d-59b8-4918-8b9e-cd6151268c82","embeddableConfig":{},"panelRefName":"panel_41"},{"version":"3.0.0","gridData":{"x":32,"y":269,"w":16,"h":16,"i":"b5d7b01d-5b74-4fbf-b7e6-df8d80c03fb9"},"panelIndex":"b5d7b01d-5b74-4fbf-b7e6-df8d80c03fb9","embeddableConfig":{},"panelRefName":"panel_42"},{"version":"3.0.0","gridData":{"x":0,"y":285,"w":16,"h":16,"i":"95e6cb30-3829-44eb-a40d-4fc81378d079"},"panelIndex":"95e6cb30-3829-44eb-a40d-4fc81378d079","embeddableConfig":{"vis":null},"panelRefName":"panel_43"},{"version":"3.0.0","gridData":{"x":16,"y":285,"w":16,"h":16,"i":"df8c7a54-7312-4a5f-ad6d-9293b43624f9"},"panelIndex":"df8c7a54-7312-4a5f-ad6d-9293b43624f9","embeddableConfig":{},"panelRefName":"panel_44"},{"version":"3.0.0","gridData":{"x":0,"y":301,"w":48,"h":5,"i":"789c9ec0-cf5e-4abf-9927-d93f138fc6c5"},"panelIndex":"789c9ec0-cf5e-4abf-9927-d93f138fc6c5","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_45"},{"version":"3.0.0","gridData":{"x":0,"y":306,"w":16,"h":16,"i":"9b6398c7-b998-4e7a-8f8b-1ecbf3a6b374"},"panelIndex":"9b6398c7-b998-4e7a-8f8b-1ecbf3a6b374","embeddableConfig":{"mapZoom":null,"mapCenter":null},"panelRefName":"panel_46"},{"version":"3.0.0","gridData":{"x":16,"y":306,"w":16,"h":16,"i":"e66cfa84-e9b8-410a-9841-42d889b67e68"},"panelIndex":"e66cfa84-e9b8-410a-9841-42d889b67e68","embeddableConfig":{"mapCenter":null,"mapZoom":null},"panelRefName":"panel_47"},{"version":"3.0.0","gridData":{"x":0,"y":322,"w":48,"h":5,"i":"fbd20e4e-6f57-4d0a-a39b-eec00ba78dc8"},"panelIndex":"fbd20e4e-6f57-4d0a-a39b-eec00ba78dc8","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_48"},{"version":"3.0.0","gridData":{"x":0,"y":327,"w":16,"h":16,"i":"61fd2efa-3e87-458e-8a68-e64efadfb1e2"},"panelIndex":"61fd2efa-3e87-458e-8a68-e64efadfb1e2","embeddableConfig":{},"panelRefName":"panel_49"},{"version":"3.0.0","gridData":{"x":16,"y":327,"w":16,"h":16,"i":"1cb164b7-16eb-467b-bcad-7a59adcc5f38"},"panelIndex":"1cb164b7-16eb-467b-bcad-7a59adcc5f38","embeddableConfig":{},"panelRefName":"panel_50"},{"version":"3.0.0","gridData":{"x":0,"y":343,"w":48,"h":5,"i":"353acf6d-bef6-408f-8703-bfe46444117a"},"panelIndex":"353acf6d-bef6-408f-8703-bfe46444117a","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_51"},{"version":"3.0.0","gridData":{"x":0,"y":348,"w":16,"h":16,"i":"0a64ca2e-c83f-4402-b639-10e86695f535"},"panelIndex":"0a64ca2e-c83f-4402-b639-10e86695f535","embeddableConfig":{},"panelRefName":"panel_52"}]',
      refreshInterval: { pause: true, value: 0 },
      timeFrom: 'now-7d',
      timeRestore: true,
      timeTo: 'now',
      title: 'Visual Consistency Dashboard',
      version: 1,
    },
    id: 'c39012d0-eb7a-11ed-8e00-17d7d50cd7b2',
    migrationVersion: { dashboard: '7.9.3' },
    references: [
      { id: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2', name: 'panel_0', type: 'visualization' },
      { id: '39b5bd70-eb7b-11ed-8e00-17d7d50cd7b2', name: 'panel_1', type: 'visualization' },
      {
        id: '64bb61a0-eb7b-11ed-8e00-17d7d50cd7b2',
        name: 'panel_2',
        type: 'visualization-visbuilder',
      },
      { id: '0aa75ae0-eb7e-11ed-8e00-17d7d50cd7b2', name: 'panel_3', type: 'visualization' },
      { id: 'fa54ce40-eb7b-11ed-8e00-17d7d50cd7b2', name: 'panel_4', type: 'visualization' },
      { id: '2c5a19f0-eb8a-11ed-8e00-17d7d50cd7b2', name: 'panel_5', type: 'visualization' },
      { id: 'ed89dfc0-eb8f-11ed-8e00-17d7d50cd7b2', name: 'panel_6', type: 'visualization' },
      { id: 'c0ba29f0-eb8f-11ed-8e00-17d7d50cd7b2', name: 'panel_7', type: 'visualization' },
      {
        id: '68fe55f0-eb90-11ed-8e00-17d7d50cd7b2',
        name: 'panel_8',
        type: 'visualization-visbuilder',
      },
      { id: 'be4dc860-eb90-11ed-8e00-17d7d50cd7b2', name: 'panel_9', type: 'visualization' },
      { id: '689b7140-eb97-11ed-8e00-17d7d50cd7b2', name: 'panel_10', type: 'visualization' },
      { id: '34a5bee0-eb97-11ed-8e00-17d7d50cd7b2', name: 'panel_11', type: 'visualization' },
      { id: '5e34ac20-eb98-11ed-8e00-17d7d50cd7b2', name: 'panel_12', type: 'visualization' },
      { id: '23a5de70-eb99-11ed-8e00-17d7d50cd7b2', name: 'panel_13', type: 'visualization' },
      {
        id: '571745a0-eb99-11ed-8e00-17d7d50cd7b2',
        name: 'panel_14',
        type: 'visualization-visbuilder',
      },
      { id: '8b78d930-eb99-11ed-8e00-17d7d50cd7b2', name: 'panel_15', type: 'visualization' },
      { id: '9482ed20-eb9b-11ed-8e00-17d7d50cd7b2', name: 'panel_16', type: 'visualization' },
      { id: '5c276fa0-eb9b-11ed-8e00-17d7d50cd7b2', name: 'panel_17', type: 'visualization' },
      { id: 'fd3b0750-227b-11ee-b88b-47a93b5c527c', name: 'panel_18', type: 'visualization' },
      { id: '08741f50-2275-11ee-b88b-47a93b5c527c', name: 'panel_19', type: 'visualization' },
      {
        id: 'ca3ae740-2275-11ee-b88b-47a93b5c527c',
        name: 'panel_20',
        type: 'visualization-visbuilder',
      },
      { id: 'f0d162c0-227b-11ee-b88b-47a93b5c527c', name: 'panel_21', type: 'visualization' },
      { id: '80e9a930-227c-11ee-b88b-47a93b5c527c', name: 'panel_22', type: 'visualization' },
      { id: '1507e780-227d-11ee-b88b-47a93b5c527c', name: 'panel_23', type: 'visualization' },
      { id: '3d034700-227f-11ee-b88b-47a93b5c527c', name: 'panel_24', type: 'visualization' },
      { id: '29844a70-2a50-11ee-92de-ad1b6a4928e5', name: 'panel_25', type: 'visualization' },
      { id: '6aed7840-22a5-11ee-b88b-47a93b5c527c', name: 'panel_26', type: 'visualization' },
      { id: 'f8df8de0-22a6-11ee-b88b-47a93b5c527c', name: 'panel_27', type: 'visualization' },
      {
        id: 'a7d21570-22a7-11ee-b88b-47a93b5c527c',
        name: 'panel_28',
        type: 'visualization-visbuilder',
      },
      { id: 'afdf7fa0-2a59-11ee-92de-ad1b6a4928e5', name: 'panel_29', type: 'visualization' },
      { id: '009fd930-22a8-11ee-b88b-47a93b5c527c', name: 'panel_30', type: 'visualization' },
      { id: 'b24e65c0-22a3-11ee-b88b-47a93b5c527c', name: 'panel_31', type: 'visualization' },
      { id: '104396f0-22a4-11ee-b88b-47a93b5c527c', name: 'panel_32', type: 'visualization' },
      {
        id: '42ddb0f0-22a4-11ee-b88b-47a93b5c527c',
        name: 'panel_33',
        type: 'visualization-visbuilder',
      },
      { id: '249bf920-2a61-11ee-92de-ad1b6a4928e5', name: 'panel_34', type: 'visualization' },
      { id: '9a5e50b0-22a3-11ee-b88b-47a93b5c527c', name: 'panel_35', type: 'visualization' },
      { id: '8add5d90-2a44-11ee-92de-ad1b6a4928e5', name: 'panel_36', type: 'visualization' },
      { id: '7fd12620-2a44-11ee-92de-ad1b6a4928e5', name: 'panel_37', type: 'visualization' },
      { id: '3e2d7da0-2a6b-11ee-92de-ad1b6a4928e5', name: 'panel_38', type: 'visualization' },
      { id: '6154a6c0-2280-11ee-b88b-47a93b5c527c', name: 'panel_39', type: 'visualization' },
      { id: 'f772de50-2281-11ee-b88b-47a93b5c527c', name: 'panel_40', type: 'visualization' },
      { id: '4ec31b10-2288-11ee-b88b-47a93b5c527c', name: 'panel_41', type: 'visualization' },
      { id: 'd5bad060-2a7e-11ee-92de-ad1b6a4928e5', name: 'panel_42', type: 'visualization' },
      { id: '9b0ae760-2282-11ee-b88b-47a93b5c527c', name: 'panel_43', type: 'visualization' },
      { id: '19717e00-228f-11ee-b88b-47a93b5c527c', name: 'panel_44', type: 'visualization' },
      { id: '93cc8830-227f-11ee-b88b-47a93b5c527c', name: 'panel_45', type: 'visualization' },
      { id: 'fe07f770-227f-11ee-b88b-47a93b5c527c', name: 'panel_46', type: 'visualization' },
      { id: 'eb268650-2a43-11ee-92de-ad1b6a4928e5', name: 'panel_47', type: 'visualization' },
      { id: '45146a10-2283-11ee-b88b-47a93b5c527c', name: 'panel_48', type: 'visualization' },
      { id: '23250ed0-2285-11ee-b88b-47a93b5c527c', name: 'panel_49', type: 'visualization' },
      { id: '4c6a47e0-2291-11ee-b88b-47a93b5c527c', name: 'panel_50', type: 'visualization' },
      { id: 'a58f3540-2a45-11ee-92de-ad1b6a4928e5', name: 'panel_51', type: 'visualization' },
      { id: '81017350-2a45-11ee-92de-ad1b6a4928e5', name: 'panel_52', type: 'visualization' },
    ],
    type: 'dashboard',
    updated_at: '2023-07-25T19:39:07.219Z',
    version: 'WzgwLDFd',
  },
];
