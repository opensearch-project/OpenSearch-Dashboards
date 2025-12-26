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
    id: '37cc8650-b882-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.salesByCategoryTitle', {
        defaultMessage: '[eCommerce] Sales by Category',
      }),
      visState:
        '{"title":"[eCommerce] Sales by Category","type":"area","params":{"type":"area","grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Sum of total_quantity"}}],"seriesParams":[{"show":"true","type":"area","mode":"stacked","data":{"label":"Sum of total_quantity","id":"1"},"drawLinesBetweenPoints":true,"showCircles":true,"interpolate":"linear","valueAxis":"ValueAxis-1"}],"addTooltip":true,"addLegend":true,"legendPosition":"top","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"sum","schema":"metric","params":{"field":"total_quantity"}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"order_date","interval":"auto","time_zone":"America/New_York","drop_partials":false,"customInterval":"2h","min_doc_count":1,"extended_bounds":{}}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"category.keyword","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: 'ed8436b0-b88b-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.salesByGenderTitle', {
        defaultMessage: '[eCommerce] Sales by Gender',
      }),
      visState:
        '{"title":"[eCommerce] Sales by Gender","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":true,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"customer_gender","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '09ffee60-b88c-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.markdownTitle', {
        defaultMessage: '[eCommerce] Markdown',
      }),
      visState:
        '{"title":"[eCommerce] Markdown","type":"markdown","params":{"fontSize":12,"openLinksInNewTab":false,"markdown":"### Sample eCommerce Data\\nThis dashboard contains sample data for you to play with. You can view it, search it, and interact with the visualizations. For more information about OpenSearch Dashboards, check our [docs](https://opensearch.org/docs/latest/dashboards/index/)."},"aggs":[]}',
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
    id: '1c389590-b88d-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.controlsTitle', {
        defaultMessage: '[eCommerce] Controls',
      }),
      visState:
        '{"title":"[eCommerce] Controls","type":"input_control_vis","params":{"controls":[{"id":"1536977437774","indexPattern":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","fieldName":"manufacturer.keyword","parent":"","label":"Manufacturer","type":"list","options":{"type":"terms","multiselect":true,"dynamicOptions":true,"size":5,"order":"desc"}},{"id":"1536977465554","indexPattern":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","fieldName":"category.keyword","parent":"","label":"Category","type":"list","options":{"type":"terms","multiselect":true,"dynamicOptions":true,"size":5,"order":"desc"}},{"id":"1536977596163","indexPattern":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","fieldName":"total_quantity","parent":"","label":"Quantity","type":"range","options":{"decimalPlaces":0,"step":1}}],"updateFiltersOnChange":false,"useTimeFilter":true,"pinFilters":false},"aggs":[]}',
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
    id: '45e07720-b890-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:17:30.755Z',
    version: '2',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.promotionTrackingTitle', {
        defaultMessage: '[eCommerce] Promotion Tracking',
      }),
      visState:
        '{"title":"[eCommerce] Promotion Tracking","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"ea20ae70-b88d-11e8-a451-f37365e9f268","color":"#54B399","split_mode":"everything","metrics":[{"id":"ea20ae71-b88d-11e8-a451-f37365e9f268","type":"sum","field":"taxful_total_price"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":"0.7","stacked":"none","filter":"products.product_name:*trouser*","label":"Revenue Trousers","value_template":"${{value}}"},{"id":"062d77b0-b88e-11e8-a451-f37365e9f268","color":"#6092C0","split_mode":"everything","metrics":[{"id":"062d77b1-b88e-11e8-a451-f37365e9f268","type":"sum","field":"taxful_total_price"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":"0.7","stacked":"none","filter":"products.product_name:*watch*","label":"Revenue Watches","value_template":"${{value}}"},{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#D36086","split_mode":"everything","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"sum","field":"taxful_total_price"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":"0.7","stacked":"none","filter":"products.product_name:*bag*","label":"Revenue Bags","value_template":"${{value}}"},{"id":"faa2c170-b88d-11e8-a451-f37365e9f268","color":"#9170B8","split_mode":"everything","metrics":[{"id":"faa2c171-b88d-11e8-a451-f37365e9f268","type":"sum","field":"taxful_total_price"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":"0.7","stacked":"none","filter":"products.product_name:*cocktail dress*","label":"Revenue Cocktail Dresses","value_template":"${{value}}"}],"time_field":"order_date","index_pattern":"opensearch_dashboards_sample_data_ecommerce","interval":">=12h","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"legend_position":"bottom","annotations":[{"fields":"taxful_total_price","template":"Ring the bell! ${{taxful_total_price}}","index_pattern":"opensearch_dashboards_sample_data_ecommerce","query_string":"taxful_total_price:>250","id":"c8c30be0-b88f-11e8-a451-f37365e9f268","color":"#E7664C","time_field":"order_date","icon":"fa-bell","ignore_global_filters":1,"ignore_panel_filters":1}]},"aggs":[]}',
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
    id: '10f1a240-b891-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.totalRevenueTitle', {
        defaultMessage: '[eCommerce] Total Revenue',
      }),
      visState:
        '{"title":"[eCommerce] Total Revenue","type":"metric","params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":false},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":36}}},"aggs":[{"id":"1","enabled":true,"type":"sum","schema":"metric","params":{"field":"taxful_total_price","customLabel":"Total Revenue"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: 'b80e6540-b891-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.soldProductsPerDayTitle', {
        defaultMessage: '[eCommerce] Sold Products per Day',
      }),
      visState:
        '{"title":"[eCommerce] Sold Products per Day","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"gauge","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#54B399","split_mode":"everything","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":"Trxns / day"}],"time_field":"order_date","index_pattern":"opensearch_dashboards_sample_data_ecommerce","interval":"1d","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"gauge_color_rules":[{"value":150,"id":"6da070c0-b891-11e8-b645-195edeb9de84","gauge":"#54B399","operator":"gte"},{"value":150,"id":"9b0cdbc0-b891-11e8-b645-195edeb9de84","gauge":"#E7664C","operator":"lt"}],"gauge_width":"15","gauge_inner_width":10,"gauge_style":"half","filter":"","gauge_max":"300"},"aggs":[]}',
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
    id: '4b3ec120-b892-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.averageSalesPriceTitle', {
        defaultMessage: '[eCommerce] Average Sales Price',
      }),
      visState:
        '{"title":"[eCommerce] Average Sales Price","type":"gauge","params":{"type":"gauge","addTooltip":true,"addLegend":true,"isDisplayWarning":false,"gauge":{"verticalSplit":false,"extendRange":true,"percentageMode":false,"gaugeType":"Circle","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","colorSchema":"Green to Red","gaugeColorMode":"Labels","colorsRange":[{"from":0,"to":50},{"from":50,"to":75},{"from":75,"to":100}],"invertColors":true,"labels":{"show":true,"color":"black"},"scale":{"show":false,"labels":false,"color":"#333"},"type":"meter","style":{"bgWidth":0.9,"width":0.9,"mask":false,"bgMask":false,"maskBars":50,"bgFill":"#eee","bgColor":false,"subText":"per order","fontSize":60,"labelColor":true},"minAngle":0,"maxAngle":6.283185307179586}},"aggs":[{"id":"1","enabled":true,"type":"avg","schema":"metric","params":{"field":"taxful_total_price","customLabel":"average spend"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '9ca7aa90-b892-11e8-a6d9-e546fe2bba5f',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.averageSoldQuantityTitle', {
        defaultMessage: '[eCommerce] Average Sold Quantity',
      }),
      visState:
        '{"title":"[eCommerce] Average Sold Quantity","type":"gauge","params":{"type":"gauge","addTooltip":true,"addLegend":true,"isDisplayWarning":false,"gauge":{"verticalSplit":false,"extendRange":true,"percentageMode":false,"gaugeType":"Circle","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","colorSchema":"Green to Red","gaugeColorMode":"Labels","colorsRange":[{"from":0,"to":2},{"from":2,"to":3},{"from":3,"to":4}],"invertColors":true,"labels":{"show":true,"color":"black"},"scale":{"show":false,"labels":false,"color":"#333"},"type":"meter","style":{"bgWidth":0.9,"width":0.9,"mask":false,"bgMask":false,"maskBars":50,"bgFill":"#eee","bgColor":false,"subText":"per order","fontSize":60,"labelColor":true},"minAngle":0,"maxAngle":6.283185307179586}},"aggs":[{"id":"1","enabled":true,"type":"avg","schema":"metric","params":{"field":"total_quantity","customLabel":"average items"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '3ba638e0-b894-11e8-a6d9-e546fe2bba5f',
    type: 'search',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.ordersTitle', {
        defaultMessage: '[eCommerce] Orders',
      }),
      description: '',
      hits: 0,
      columns: ['category', 'sku', 'taxful_total_price', 'total_quantity'],
      sort: [['order_date', 'desc']],
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","highlightAll":true,"version":true,"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: '9c6f83f0-bb4d-11e8-9c84-77068524bcab',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.salesCountMapTitle', {
        defaultMessage: '[eCommerce] Sales Count Map',
      }),
      visState:
        '{"title":"[eCommerce] Sales Count Map","type":"vega","aggs":[],"params":{"spec":"{\\n  $schema: https://vega.github.io/schema/vega/v5.json\\n  config: {\\n    kibana: {type: \\"map\\", latitude: 25, longitude: -40, zoom: 3}\\n  }\\n  data: [\\n    {\\n      name: table\\n      url: {\\n        index: opensearch_dashboards_sample_data_ecommerce\\n        %context%: true\\n        %timefield%: order_date\\n        body: {\\n          size: 0\\n          aggs: {\\n            gridSplit: {\\n              geotile_grid: {field: \\"geoip.location\\", precision: 4, size: 10000}\\n              aggs: {\\n                gridCentroid: {\\n                  geo_centroid: {\\n                    field: \\"geoip.location\\"\\n                  }\\n                }\\n              }\\n            }\\n          }\\n        }\\n      }\\n      format: {property: \\"aggregations.gridSplit.buckets\\"}\\n      transform: [\\n        {\\n          type: geopoint\\n          projection: projection\\n          fields: [\\n            gridCentroid.location.lon\\n            gridCentroid.location.lat\\n          ]\\n        }\\n      ]\\n    }\\n  ]\\n  scales: [\\n    {\\n      name: gridSize\\n      type: linear\\n      domain: {data: \\"table\\", field: \\"doc_count\\"}\\n      range: [\\n        50\\n        1000\\n      ]\\n    }\\n  ]\\n  marks: [\\n    {\\n      name: gridMarker\\n      type: symbol\\n      from: {data: \\"table\\"}\\n      encode: {\\n        update: {\\n          size: {scale: \\"gridSize\\", field: \\"doc_count\\"}\\n          xc: {signal: \\"datum.x\\"}\\n          yc: {signal: \\"datum.y\\"}\\n        }\\n      }\\n    },\\n    {\\n      name: gridLabel\\n      type: text\\n      from: {data: \\"table\\"}\\n      encode: {\\n        enter: {\\n          fill: {value: \\"#E7664C\\"}\\n          text: {signal: \\"datum.doc_count\\"}\\n        }\\n        update: {\\n          x: {signal: \\"datum.x\\"}\\n          y: {signal: \\"datum.y\\"}\\n          dx: {value: -6}\\n          dy: {value: 6}\\n          fontSize: {value: 18}\\n          fontWeight: {value: \\"bold\\"}\\n        }\\n      }\\n    }\\n  ]\\n}"}}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: 'b72dd430-bb4d-11e8-9c84-77068524bcab',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.topSellingProductsTitle', {
        defaultMessage: '[eCommerce] Top Selling Products',
      }),
      visState:
        '{"title":"[eCommerce] Top Selling Products","type":"tagcloud","params":{"scale":"linear","orientation":"single","minFontSize":18,"maxFontSize":72,"showLabel":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"products.product_name.keyword","size":7,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"ff959d40-b880-11e8-a6d9-e546fe2bba5f","query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: 'ff959d40-b880-11e8-a6d9-e546fe2bba5f',
    type: 'index-pattern',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'opensearch_dashboards_sample_data_ecommerce',
      timeFieldName: 'order_date',
      fields:
        '[{"name":"_id","type":"string","esTypes":["_id"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","esTypes":["_index"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","esTypes":["_source"],"count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","esTypes":["_type"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"category","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"category.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"category"}}},{"name":"currency","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"customer_birth_date","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"customer_first_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"customer_first_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"customer_first_name"}}},{"name":"customer_full_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"customer_full_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"customer_full_name"}}},{"name":"customer_gender","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"customer_id","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"customer_last_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"customer_last_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"customer_last_name"}}},{"name":"customer_phone","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"day_of_week","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"day_of_week_i","type":"number","esTypes":["integer"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"email","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"event.dataset","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.city_name","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.continent_name","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.country_iso_code","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.location","type":"geo_point","esTypes":["geo_point"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.region_name","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"manufacturer","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"manufacturer.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"manufacturer"}}},{"name":"order_date","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"order_id","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products._id","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"products._id.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"products._id"}}},{"name":"products.base_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.base_unit_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.category","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"products.category.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"products.category"}}},{"name":"products.created_on","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.discount_amount","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.discount_percentage","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.manufacturer","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"products.manufacturer.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"products.manufacturer"}}},{"name":"products.min_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.product_id","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.product_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"products.product_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"products.product_name"}}},{"name":"products.quantity","type":"number","esTypes":["integer"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.sku","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.tax_amount","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.taxful_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.taxless_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"products.unit_discount_amount","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"sku","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"taxful_total_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"taxless_total_price","type":"number","esTypes":["half_float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"total_quantity","type":"number","esTypes":["integer"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"total_unique_products","type":"number","esTypes":["integer"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"type","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"user","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
      fieldFormatMap: '{"taxful_total_price":{"id":"number","params":{"pattern":"$0,0.[00]"}}}',
    },
    references: [],
  },
  {
    id: '722b74f0-b882-11e8-a6d9-e546fe2bba5f',
    type: 'dashboard',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    references: [
      {
        name: 'panel_0',
        type: 'visualization',
        id: '37cc8650-b882-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_1',
        type: 'visualization',
        id: 'ed8436b0-b88b-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_2',
        type: 'visualization',
        id: '09ffee60-b88c-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_3',
        type: 'visualization',
        id: '1c389590-b88d-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_4',
        type: 'visualization',
        id: '45e07720-b890-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_5',
        type: 'visualization',
        id: '10f1a240-b891-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_6',
        type: 'visualization',
        id: 'b80e6540-b891-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_7',
        type: 'visualization',
        id: '4b3ec120-b892-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_8',
        type: 'visualization',
        id: '9ca7aa90-b892-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_9',
        type: 'search',
        id: '3ba638e0-b894-11e8-a6d9-e546fe2bba5f',
      },
      {
        name: 'panel_10',
        type: 'visualization',
        id: '9c6f83f0-bb4d-11e8-9c84-77068524bcab',
      },
      {
        name: 'panel_11',
        type: 'visualization',
        id: 'b72dd430-bb4d-11e8-9c84-77068524bcab',
      },
    ],
    migrationVersion: {
      dashboard: '7.0.0',
    },
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.revenueDashboardTitle', {
        defaultMessage: '[eCommerce] Revenue Dashboard',
      }),
      hits: 0,
      description: i18n.translate('home.sampleData.ecommerceSpec.revenueDashboardDescription', {
        defaultMessage: 'Analyze mock eCommerce orders and revenue',
      }),
      panelsJSON:
        '[{"embeddableConfig":{},"gridData":{"x":12,"y":18,"w":36,"h":10,"i":"1"},"panelIndex":"1","version":"7.0.0-alpha1","panelRefName":"panel_0"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":12,"y":7,"w":12,"h":11,"i":"2"},"panelIndex":"2","version":"7.0.0-alpha1","panelRefName":"panel_1"},{"embeddableConfig":{},"gridData":{"x":0,"y":0,"w":18,"h":7,"i":"3"},"panelIndex":"3","version":"7.0.0-alpha1","panelRefName":"panel_2"},{"embeddableConfig":{},"gridData":{"x":18,"y":0,"w":30,"h":7,"i":"4"},"panelIndex":"4","version":"7.0.0-alpha1","panelRefName":"panel_3"},{"embeddableConfig":{},"gridData":{"x":0,"y":28,"w":48,"h":11,"i":"5"},"panelIndex":"5","version":"7.0.0-alpha1","panelRefName":"panel_4"},{"embeddableConfig":{},"gridData":{"x":0,"y":18,"w":12,"h":10,"i":"6"},"panelIndex":"6","version":"7.0.0-alpha1","panelRefName":"panel_5"},{"embeddableConfig":{},"gridData":{"x":0,"y":7,"w":12,"h":11,"i":"7"},"panelIndex":"7","version":"7.0.0-alpha1","panelRefName":"panel_6"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":24,"y":7,"w":12,"h":11,"i":"8"},"panelIndex":"8","version":"7.0.0-alpha1","panelRefName":"panel_7"},{"embeddableConfig":{"vis":{"legendOpen":false}},"gridData":{"x":36,"y":7,"w":12,"h":11,"i":"9"},"panelIndex":"9","version":"7.0.0-alpha1","panelRefName":"panel_8"},{"embeddableConfig":{},"gridData":{"x":0,"y":54,"w":48,"h":18,"i":"10"},"panelIndex":"10","version":"7.0.0-alpha1","panelRefName":"panel_9"},{"embeddableConfig":{"mapZoom":2,"mapCenter":[28.304380682962783,-22.148437500000004]},"gridData":{"x":0,"y":39,"w":24,"h":15,"i":"11"},"panelIndex":"11","version":"7.0.0-alpha1","panelRefName":"panel_10"},{"embeddableConfig":{},"gridData":{"x":24,"y":39,"w":24,"h":15,"i":"12"},"panelIndex":"12","version":"7.0.0-alpha1","panelRefName":"panel_11"}]',
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
        searchSourceJSON: '{"query":{"language":"kuery","query":""},"filter":[]}',
      },
    },
  },
  // UBI Index Patterns
  {
    id: 'ubi-queries-index-pattern',
    type: 'index-pattern',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'opensearch_dashboards_sample_ubi_queries*',
      timeFieldName: 'timestamp',
      fieldFormatMap:
        '{"day_of_week":{"id":"string","params":{"parsedUrl":{"origin":"http://localhost:5601","pathname":"/app/home","basePath":""}}},"hour":{"id":"number","params":{"parsedUrl":{"origin":"http://localhost:5601","pathname":"/app/home","basePath":""}}}}',
      fields:
        '[{"count":0,"name":"_id","type":"string","esTypes":["_id"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"name":"_index","type":"string","esTypes":["_index"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"name":"_score","type":"number","scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"_source","type":"_source","esTypes":["_source"],"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"_type","type":"string","scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"application","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"application.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"application"}}},{"count":0,"name":"client_id","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"client_id.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"client_id"}}},{"count":0,"name":"query","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"query.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"query"}}},{"count":0,"name":"query_id","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"query_id.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"query_id"}}},{"count":0,"name":"query_response_id","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"query_response_id.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"query_response_id"}}},{"count":0,"name":"query_response_object_ids","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"query_response_hit_ids","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"query_response_object_ids"}}},{"count":0,"name":"timestamp","type":"date","esTypes":["date"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"user_query","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"user_query","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"user_query"}}},{"count":0,"script":"doc[\'query_response_hit_ids\'].length","lang":"painless","name":"number_of_results","type":"number","scripted":true,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"script":"doc[\'timestamp\'].value.getDayOfWeekEnum().getDisplayName(TextStyle.FULL, Locale.ROOT)","lang":"painless","name":"day_of_week","type":"string","scripted":true,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"script":"doc[\'timestamp\'].value.getHour()","lang":"painless","name":"hour","type":"number","scripted":true,"searchable":true,"aggregatable":true,"readFromDocValues":false}]',
    },
    references: [],
  },
  {
    id: 'ubi-events-index-pattern',
    type: 'index-pattern',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'opensearch_dashboards_sample_ubi_events*',
      timeFieldName: 'timestamp',
      fields:
        '[{"count":0,"name":"_id","type":"string","esTypes":["_id"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"name":"_index","type":"string","esTypes":["_index"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"count":0,"name":"_score","type":"number","scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"_source","type":"_source","esTypes":["_source"],"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"_type","type":"string","scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"action_name","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"application","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"client_id","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.object.description","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"event_attributes.object.description.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"event_attributes.object.description"}}},{"count":0,"name":"event_attributes.object.internal_id","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.object.name","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.object.object_id","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.object.object_id_field","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.position.ordinal","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.position.page_depth","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.position.scroll_depth","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.position.trail","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"event_attributes.position.trail.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"event_attributes.position.trail"}}},{"count":0,"name":"event_attributes.position.x","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"event_attributes.position.y","type":"number","esTypes":["integer"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"message","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"message_type","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"query_id","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"session_id","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"session_id.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"session_id"}}},{"count":0,"name":"timestamp","type":"date","esTypes":["date"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"count":0,"name":"user_id","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"user_id.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"user_id"}}},{"count":0,"name":"user_query","type":"string","esTypes":["text"],"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"count":0,"name":"user_query.keyword","type":"string","esTypes":["keyword"],"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"user_query"}}}]',
    },
    references: [],
  },
  // UBI Visualizations
  {
    id: 'ubi-queries-by-client-orig',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Queries by Client',
      visState:
        '{"title":"Queries by Client","type":"pie","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"client_id.keyword","size":5,"order":"desc","orderBy":"1"},"schema":"group"}],"params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":false,"labels":{"show":true,"truncate":100}}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-queries-over-time-orig',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Queries over Time',
      visState:
        '{"title":"Queries over Time","type":"histogram","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"date_histogram","params":{"field":"timestamp","timeRange":{"from":"now-30d","to":"now"},"useNormalizedOpenSearchInterval":true,"scaleMetricValues":false,"interval":"d","drop_partials":false,"min_doc_count":1,"extended_bounds":{},"customLabel":"queries per day"},"schema":"segment"}],"params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{"show":false},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"index":"ubi-queries-index-pattern"}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-queries-by-hour-orig',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Queries by Time of Day',
      visState:
        '{"title":"Queries by Time of Day","type":"histogram","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"filters","params":{"filters":[{"input":{"query":"hour:0","language":"kuery"},"label":"0"},{"input":{"query":"hour:1","language":"kuery"},"label":"1"},{"input":{"query":"hour:2","language":"kuery"},"label":"2"},{"input":{"query":"hour:3","language":"kuery"},"label":"3"},{"input":{"query":"hour:4","language":"kuery"},"label":"4"},{"input":{"query":"hour:5","language":"kuery"},"label":"5"},{"input":{"query":"hour:6","language":"kuery"},"label":"6"},{"input":{"query":"hour:7","language":"kuery"},"label":"7"},{"input":{"query":"hour:8","language":"kuery"},"label":"8"},{"input":{"query":"hour:9","language":"kuery"},"label":"9"},{"input":{"query":"hour:10","language":"kuery"},"label":"10"},{"input":{"query":"hour:11","language":"kuery"},"label":"11"},{"input":{"query":"hour:12","language":"kuery"},"label":"12"},{"input":{"query":"hour:13","language":"kuery"},"label":"13"},{"input":{"query":"hour:14","language":"kuery"},"label":"14"},{"input":{"query":"hour:15","language":"kuery"},"label":"15"},{"input":{"query":"hour:16","language":"kuery"},"label":"16"},{"input":{"query":"hour:17","language":"kuery"},"label":"17"},{"input":{"query":"hour:18","language":"kuery"},"label":"18"},{"input":{"query":"hour:19","language":"kuery"},"label":"19"},{"input":{"query":"hour:20","language":"kuery"},"label":"20"},{"input":{"query":"hour:21","language":"kuery"},"label":"21"},{"input":{"query":"hour:22","language":"kuery"},"label":"22"},{"input":{"query":"hour:23","language":"kuery"},"label":"23"}]},"schema":"segment"}],"params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{"show":false},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"index":"ubi-queries-index-pattern"}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-day-of-week',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Searches by Day of Week',
      visState:
        '{"title":"Searches by Day of Week","type":"pie","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"day_of_week","orderBy":"_key","order":"asc","size":7,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Day of Week"},"schema":"segment"}],"params":{"addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false},"colors":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2"]}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"index":"ubi-queries-index-pattern"}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-most-common-queries',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Most common queries',
      visState:
        '{"title":"Most common queries","type":"tagcloud","params":{"scale":"linear","orientation":"single","minFontSize":18,"maxFontSize":72,"showLabel":false},"aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"user_query","orderBy":"1","order":"desc","size":15,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Query"},"schema":"segment"}]}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"index":"ubi-queries-index-pattern"}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-no-results-queries',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Top Searches Without Results',
      visState:
        '{"title":"Top Searches Without Results","type":"table","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"user_query","orderBy":"1","order":"desc","size":100,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Query"},"schema":"bucket"}],"params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"showTotal":false,"totalFunc":"sum","percentageCol":""}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[{"$state":{"store":"appState"},"meta":{"alias":null,"disabled":false,"field":"number_of_results","key":"script","negate":false,"type":"custom","value":"{\\"script\\":{\\"source\\":\\"boolean compare(Supplier s, def v) {return s.get() == v;}compare(() -> { doc[\'query_response_hit_ids\'].length }, params.value);\\",\\"lang\\":\\"painless\\",\\"params\\":{\\"value\\":0}}}","index":"ubi-queries-index-pattern"},"script":{"script":{"lang":"painless","params":{"value":0},"source":"boolean compare(Supplier s, def v) {return s.get() == v;}compare(() -> { doc[\'query_response_hit_ids\'].length }, params.value);"}}}],"index":"ubi-queries-index-pattern"}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-common-results',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Most Common Search Result',
      visState:
        '{"title":"Most Common Search Result","type":"table","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"query_response_hit_ids","orderBy":"1","order":"desc","size":100,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Object Id"},"schema":"bucket"}],"params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"showTotal":false,"totalFunc":"sum","percentageCol":""}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[],"index":"ubi-queries-index-pattern"}',
      },
    },
    references: [],
  },
  {
    id: 'ubi-click-positions',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Click Position Histogram',
      visState:
        '{"title":"Click Position Histogram","type":"histogram","aggs":[{"id":"1","enabled":true,"type":"count","params":{"customLabel":""},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"event_attributes.position.ordinal","orderBy":"_key","order":"asc","size":25,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"click positions"},"schema":"segment"}],"params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{"show":false},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"}}}',
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[{"$state":{"store":"appState"},"meta":{"alias":null,"disabled":false,"key":"action_name","negate":false,"params":{"query":"click"},"type":"phrase","index":"ubi-events-index-pattern"},"query":{"match_phrase":{"action_name":"click"}}}],"index":"ubi-events-index-pattern"}',
      },
    },
    references: [],
  },
  // TSVB Average Click Position (original)
  {
    id: 'ubi-avg-click-position',
    type: 'visualization',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    migrationVersion: {},
    attributes: {
      title: 'Average Click Position',
      visState:
        '{"title":"Average Click Position","type":"line","params":{"grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Average Position"}}],"seriesParams":[{"show":"true","type":"line","mode":"normal","data":{"label":"Average Position","id":"1"},"drawLinesBetweenPoints":true,"showCircles":true,"interpolate":"linear","valueAxis":"ValueAxis-1"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"avg","schema":"metric","params":{"field":"event_attributes.position.ordinal"}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"timestamp","interval":"auto","drop_partials":false,"min_doc_count":1,"extended_bounds":{}}}]}',
      uiStateJSON: '{}',
      description: 'Average click position over time',
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"action_name:click","language":"kuery"},"filter":[],"index":"ubi-events-index-pattern"}',
      },
    },
    references: [],
  },
  // UBI Dashboard
  {
    id: 'ubi-dashboard-ecommerce',
    type: 'dashboard',
    updated_at: '2018-10-01T15:13:03.270Z',
    version: '1',
    references: [
      {
        name: 'panel_0',
        type: 'visualization',
        id: 'ubi-queries-over-time-orig',
      },
      {
        name: 'panel_1',
        type: 'visualization',
        id: 'ubi-queries-by-hour-orig',
      },
      {
        name: 'panel_2',
        type: 'visualization',
        id: 'ubi-day-of-week',
      },
      {
        name: 'panel_3',
        type: 'visualization',
        id: 'ubi-most-common-queries',
      },
      {
        name: 'panel_4',
        type: 'visualization',
        id: 'ubi-no-results-queries',
      },
      {
        name: 'panel_5',
        type: 'visualization',
        id: 'ubi-common-results',
      },
      {
        name: 'panel_6',
        type: 'visualization',
        id: 'ubi-click-positions',
      },
      {
        name: 'panel_7',
        type: 'visualization',
        id: 'ubi-avg-click-position',
      },
    ],
    migrationVersion: {
      dashboard: '7.0.0',
    },
    attributes: {
      title: i18n.translate('home.sampleData.ecommerceSpec.ubiDashboardTitle', {
        defaultMessage: '[eCommerce] UBI Search Overview',
      }),
      hits: 0,
      description: i18n.translate('home.sampleData.ecommerceSpec.ubiDashboardDescription', {
        defaultMessage: 'Analyze user search behavior and query patterns',
      }),
      panelsJSON:
        '[{"version":"2.18.0","gridData":{"x":0,"y":0,"w":43,"h":15,"i":"9522cd9b-25e7-4d55-980e-55d25cf3f608"},"panelIndex":"9522cd9b-25e7-4d55-980e-55d25cf3f608","embeddableConfig":{},"panelRefName":"panel_0"},{"version":"2.18.0","gridData":{"x":0,"y":15,"w":24,"h":15,"i":"658767e1-472c-4a96-86a2-096498f41160"},"panelIndex":"658767e1-472c-4a96-86a2-096498f41160","embeddableConfig":{},"panelRefName":"panel_1"},{"version":"2.18.0","gridData":{"x":24,"y":15,"w":19,"h":15,"i":"2630a3ec-b86a-4707-b7bb-8e129414f836"},"panelIndex":"2630a3ec-b86a-4707-b7bb-8e129414f836","embeddableConfig":{"hidePanelTitles":false},"title":"Searches by Day of Week","panelRefName":"panel_2"},{"version":"2.18.0","gridData":{"x":0,"y":30,"w":15,"h":18,"i":"a1c5393a-9f5a-496e-97e3-60683f965459"},"panelIndex":"a1c5393a-9f5a-496e-97e3-60683f965459","embeddableConfig":{"table":null,"vis":{"columnsWidth":[{"colIndex":0,"width":265.5}]}},"panelRefName":"panel_3"},{"version":"2.18.0","gridData":{"x":15,"y":30,"w":11,"h":18,"i":"de136524-60d1-482f-8678-1b53d1d03998"},"panelIndex":"de136524-60d1-482f-8678-1b53d1d03998","embeddableConfig":{"table":null,"vis":{"columnsWidth":[{"colIndex":0,"width":300.5}]}},"panelRefName":"panel_4"},{"version":"2.18.0","gridData":{"x":26,"y":30,"w":17,"h":18,"i":"a79219b4-638b-4a1e-8394-25a9433fe4ad"},"panelIndex":"a79219b4-638b-4a1e-8394-25a9433fe4ad","embeddableConfig":{"table":null,"vis":{"columnsWidth":[{"colIndex":0,"width":413.5}]}},"panelRefName":"panel_5"},{"version":"2.18.0","gridData":{"x":0,"y":48,"w":24,"h":18,"i":"95448e1f-1f7e-479f-888b-db105bd2ee86"},"panelIndex":"95448e1f-1f7e-479f-888b-db105bd2ee86","embeddableConfig":{},"panelRefName":"panel_6"},{"version":"2.18.0","gridData":{"x":24,"y":48,"w":19,"h":18,"i":"2e1f1bac-f59d-416d-8a21-46d8e1c47de8"},"panelIndex":"2e1f1bac-f59d-416d-8a21-46d8e1c47de8","embeddableConfig":{},"panelRefName":"panel_7"}]',
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
        searchSourceJSON: '{"query":{"language":"kuery","query":""},"filter":[]}',
      },
    },
  },
];
