/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint max-len: 0 */
import { SavedObject } from 'opensearch-dashboards/server';

export const getSavedObjects = (): SavedObject[] => [
  {
    id: 'opensearch_dashboards_sample_data_ppl',
    type: 'index-pattern',

    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY1NSwxXQ==',
    attributes: {
      fieldFormatMap: '{"hour_of_day":{}}',
      fields:
        '[{"name":"@timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","esTypes":["_id"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","esTypes":["_index"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","esTypes":["_source"],"count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","esTypes":["_type"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"agent","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"agent.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"agent"}}},{"name":"bytes","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"clientip","type":"ip","esTypes":["ip"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"event.dataset","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"extension","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"extension.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"extension"}}},{"name":"geo.coordinates","type":"geo_point","esTypes":["geo_point"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.dest","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.src","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geo.srcdest","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"host.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"host"}}},{"name":"index","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"index.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"index"}}},{"name":"ip","type":"ip","esTypes":["ip"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"machine.os","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"machine.os.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"machine.os"}}},{"name":"machine.ram","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"memory","type":"number","esTypes":["double"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"message","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"message.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"message"}}},{"name":"phpmemory","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"referer","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"request","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"request"}}},{"name":"response","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"response.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"response"}}},{"name":"tags","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"tags.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"tags"}}},{"name":"timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"url","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"url.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"url"}}},{"name":"utc_time","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"hour_of_day","type":"number","count":0,"scripted":true,"script":"doc[\'timestamp\'].value.getHour()","lang":"painless","searchable":true,"aggregatable":true,"readFromDocValues":false}]',
      timeFieldName: 'timestamp',
      title: 'opensearch_dashboards_sample_data_ppl',
    },
    references: [],
    migrationVersion: { 'index-pattern': '7.6.0' },
  },
  {
    id: '9011e5eb-7018-463f-8541-14f98a938f16',
    type: 'dashboard',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY2MiwxXQ==',
    attributes: {
      description: "Analyze mock web traffic log data for OpenSearch's website",
      hits: 0,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl | fields agent, timestamp","language":"PPL"},"highlightAll":true,"version":true,"filter":[]}',
      },
      optionsJSON: '{"hidePanelTitles":false,"useMargins":true}',
      panelsJSON:
        '[{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"h":12,"i":"11","w":9,"x":30,"y":15},"panelIndex":"11","title":"","version":"3.0.0","panelRefName":"panel_0"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"h":12,"i":"17","w":11,"x":19,"y":15},"panelIndex":"17","version":"3.0.0","panelRefName":"panel_1"},{"embeddableConfig":{},"gridData":{"h":15,"i":"18","w":10,"x":0,"y":0},"panelIndex":"18","title":"","version":"3.0.0","panelRefName":"panel_2"},{"embeddableConfig":{},"gridData":{"h":15,"i":"61eb9da0-d482-434b-8be8-aef9ee62b1e3","w":38,"x":10,"y":0},"panelIndex":"61eb9da0-d482-434b-8be8-aef9ee62b1e3","version":"3.0.0","panelRefName":"panel_3"},{"embeddableConfig":{},"gridData":{"h":12,"i":"91225403-98a6-4780-baf7-99364291eba9","w":19,"x":0,"y":15},"panelIndex":"91225403-98a6-4780-baf7-99364291eba9","version":"3.0.0","panelRefName":"panel_4"},{"embeddableConfig":{"vis":null},"gridData":{"h":12,"i":"83075370-4d2c-4739-aaec-2f2b8cbf7809","w":9,"x":39,"y":15},"panelIndex":"83075370-4d2c-4739-aaec-2f2b8cbf7809","version":"3.0.0","panelRefName":"panel_5"}]',
      refreshInterval: { pause: false, value: 900000 },
      timeFrom: '2024-04-01T15:55:56.275Z',
      timeRestore: true,
      timeTo: '2024-05-30T15:55:59.862Z',
      title: '[PPL][Logs] Web Traffic',
      version: 1,
    },
    references: [
      { id: '02dba266-f5f3-4156-9bf7-70f105e93766', name: 'panel_0', type: 'visualization' },
      { id: '71053772-a267-4b13-be3b-38af62f2d4e1', name: 'panel_1', type: 'visualization' },
      { id: 'ec45f83a-6f93-4ad4-b73a-ffe495840966', name: 'panel_2', type: 'visualization' },
      { id: '21cfa169-0160-4da5-aec5-6d1fce61b1b9', name: 'panel_3', type: 'search' },
      { id: 'df3154e9-e31b-41a3-8b1e-90bf96aeace0', name: 'panel_4', type: 'visualization' },
      { id: 'b9a3e2b1-6a0d-490a-9d56-367aff04cef1', name: 'panel_5', type: 'visualization' },
    ],
    migrationVersion: { dashboard: '7.9.3' },
  },
  {
    id: 'c2684930-0641-11ef-bc97-5b4786ce056b',
    type: 'visualization',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:10:43.869Z',
    version: 'WzIwNCwxXQ==',
    attributes: {
      title: '[PPL](Line) Traffic over time',
      visState:
        '{"title":"[PPL](Line) Traffic over time","type":"line","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"2024-04-01T15:55:56.275Z","to":"2024-05-30T15:55:59.862Z"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"}],"params":{"type":"line","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"line","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"interpolate":"linear","showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
    },
    references: [
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
        id: 'opensearch_dashboards_sample_data_ppl',
      },
    ],
    migrationVersion: { visualization: '7.10.0' },
  },
  {
    id: '02dba266-f5f3-4156-9bf7-70f105e93766',
    type: 'visualization',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY1NiwxXQ==',
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '[PPL][Logs] Goals',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"[PPL][Logs] Goals","type":"gauge","params":{"type":"gauge","addTooltip":true,"addLegend":false,"gauge":{"extendRange":true,"percentageMode":false,"gaugeType":"Arc","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","colorSchema":"Green to Red","gaugeColorMode":"Labels","colorsRange":[{"from":0,"to":500},{"from":500,"to":1000},{"from":1000,"to":1500}],"invertColors":true,"labels":{"show":false,"color":"black"},"scale":{"show":true,"labels":false,"color":"#333"},"type":"meter","style":{"bgWidth":0.9,"width":0.9,"mask":false,"bgMask":false,"maskBars":50,"bgFill":"#eee","bgColor":false,"subText":"visitors","fontSize":60,"labelColor":true},"alignment":"horizontal"},"isDisplayWarning":false},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"clientip","customLabel":"Unique Visitors"}}]}',
    },
    references: [
      {
        id: 'opensearch_dashboards_sample_data_ppl',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    migrationVersion: { visualization: '7.10.0' },
  },
  {
    id: '71053772-a267-4b13-be3b-38af62f2d4e1',
    type: 'visualization',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY1NywxXQ==',
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '[PPL][Logs] Visitors by OS',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"[PPL][Logs] Visitors by OS","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":true,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"machine.os.keyword","otherBucket":true,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","size":10,"order":"desc","orderBy":"1"}}]}',
    },
    references: [
      {
        id: 'opensearch_dashboards_sample_data_ppl',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    migrationVersion: { visualization: '7.10.0' },
  },
  {
    id: 'ec45f83a-6f93-4ad4-b73a-ffe495840966',
    type: 'visualization',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY1OCwxXQ==',
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"filter":[]}',
      },
      title: '[PPL][Logs] Markdown Instructions',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"[PPL][Logs] Markdown Instructions","type":"markdown","aggs":[],"params":{"fontSize":12,"openLinksInNewTab":true,"markdown":"### Sample Logs Data (PPL)\\nThis dashboard contains sample data for you to play with. You can view it, search it, and interact with the visualizations. For more information about OpenSearch Dashboards, check our [docs](https://opensearch.org/docs/latest/dashboards/index/).\\n\\nQueries were saved using the language PPL. \\n\\n#### Note\\nComposite aggregations currently do not work. "}}',
    },
    references: [],
    migrationVersion: { visualization: '7.10.0' },
  },
  {
    id: 'df3154e9-e31b-41a3-8b1e-90bf96aeace0',
    type: 'visualization',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY2MCwxXQ==',
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '[PPL](Line) Traffic over time',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"[PPL](Line) Traffic over time","type":"line","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"2024-04-01T15:55:56.275Z","to":"2024-05-30T15:55:59.862Z"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}},"schema":"segment"}],"params":{"type":"line","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"line","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"interpolate":"linear","showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
    },
    references: [
      {
        id: 'opensearch_dashboards_sample_data_ppl',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    migrationVersion: { visualization: '7.10.0' },
  },
  {
    id: 'b9a3e2b1-6a0d-490a-9d56-367aff04cef1',
    type: 'visualization',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY2MSwxXQ==',
    attributes: {
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      title: '[PPL](Goal) Average machine RAM',
      uiStateJSON: '{}',
      version: 1,
      visState:
        '{"title":"[PPL](Goal) Average machine RAM","type":"goal","aggs":[{"id":"1","enabled":true,"type":"avg","params":{"field":"machine.ram"},"schema":"metric"}],"params":{"addTooltip":true,"addLegend":false,"isDisplayWarning":false,"type":"gauge","gauge":{"verticalSplit":false,"autoExtend":false,"percentageMode":true,"gaugeType":"Arc","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","useRanges":false,"colorSchema":"Green to Red","gaugeColorMode":"None","colorsRange":[{"from":0,"to":10000000000},{"from":10000000000,"to":20000000000}],"invertColors":false,"labels":{"show":true,"color":"black"},"scale":{"show":false,"labels":false,"color":"rgba(105,112,125,0.2)","width":2},"type":"meter","style":{"bgFill":"rgba(105,112,125,0.2)","bgColor":false,"labelColor":false,"subText":"","fontSize":60}}}}',
    },
    references: [
      {
        id: 'opensearch_dashboards_sample_data_ppl',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    migrationVersion: { visualization: '7.10.0' },
  },
  {
    id: '21cfa169-0160-4da5-aec5-6d1fce61b1b9',
    type: 'search',
    namespaces: ['default'],
    updated_at: '2024-04-29T16:31:23.855Z',
    version: 'WzY1OSwxXQ==',
    attributes: {
      columns: ['_source'],
      description: '',
      hits: 0,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"source=opensearch_dashboards_sample_data_ppl","language":"PPL"},"highlightAll":true,"version":true,"aggs":{"2":{"date_histogram":{"field":"timestamp","calendar_interval":"1d","time_zone":"America/Los_Angeles","min_doc_count":1}}},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
      },
      sort: [],
      title: '[PPL] Saved Search',
      version: 1,
    },
    references: [
      {
        id: 'opensearch_dashboards_sample_data_ppl',
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
      },
    ],
    migrationVersion: { search: '7.9.3' },
  },
];
