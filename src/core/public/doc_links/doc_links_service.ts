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

import { deepFreeze } from '@osd/std';
import { InjectedMetadataSetup } from '../injected_metadata';

interface StartDeps {
  injectedMetadata: InjectedMetadataSetup;
}

/** @internal */
export class DocLinksService {
  public setup() {}
  public start({ injectedMetadata }: StartDeps): DocLinksStart {
    const DOC_LINK_VERSION = injectedMetadata.getOpenSearchDashboardsBranch();
    const OPENSEARCH_WEBSITE_URL = 'https://www.elastic.co/';
    const OPENSEARCH_DOCS = `${OPENSEARCH_WEBSITE_URL}guide/en/elasticsearch/reference/${DOC_LINK_VERSION}/`;

    return deepFreeze({
      DOC_LINK_VERSION,
      OPENSEARCH_WEBSITE_URL,
      links: {
        dashboard: {
          drilldowns: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/drilldowns.html`,
          drilldownsTriggerPicker: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/drilldowns.html#url-drilldowns`,
          urlDrilldownTemplateSyntax: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/url_templating-language.html`,
          urlDrilldownVariables: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/url_templating-language.html#url-template-variables`,
        },
        filebeat: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/filebeat/${DOC_LINK_VERSION}`,
          installation: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/filebeat/${DOC_LINK_VERSION}/filebeat-installation-configuration.html`,
          configuration: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/filebeat/${DOC_LINK_VERSION}/configuring-howto-filebeat.html`,
          elasticsearchOutput: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/filebeat/${DOC_LINK_VERSION}/elasticsearch-output.html`,
          startup: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/filebeat/${DOC_LINK_VERSION}/filebeat-starting.html`,
          exportedFields: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/filebeat/${DOC_LINK_VERSION}/exported-fields.html`,
        },
        auditbeat: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/auditbeat/${DOC_LINK_VERSION}`,
        },
        metricbeat: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/metricbeat/${DOC_LINK_VERSION}`,
        },
        heartbeat: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/heartbeat/${DOC_LINK_VERSION}`,
        },
        logstash: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/logstash/${DOC_LINK_VERSION}`,
        },
        functionbeat: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/functionbeat/${DOC_LINK_VERSION}`,
        },
        winlogbeat: {
          base: `${OPENSEARCH_WEBSITE_URL}guide/en/beats/winlogbeat/${DOC_LINK_VERSION}`,
        },
        aggs: {
          date_histogram: `${OPENSEARCH_DOCS}search-aggregations-bucket-datehistogram-aggregation.html`,
          date_range: `${OPENSEARCH_DOCS}search-aggregations-bucket-daterange-aggregation.html`,
          filter: `${OPENSEARCH_DOCS}search-aggregations-bucket-filter-aggregation.html`,
          filters: `${OPENSEARCH_DOCS}search-aggregations-bucket-filters-aggregation.html`,
          geohash_grid: `${OPENSEARCH_DOCS}search-aggregations-bucket-geohashgrid-aggregation.html`,
          histogram: `${OPENSEARCH_DOCS}search-aggregations-bucket-histogram-aggregation.html`,
          ip_range: `${OPENSEARCH_DOCS}search-aggregations-bucket-iprange-aggregation.html`,
          range: `${OPENSEARCH_DOCS}search-aggregations-bucket-range-aggregation.html`,
          significant_terms: `${OPENSEARCH_DOCS}search-aggregations-bucket-significantterms-aggregation.html`,
          terms: `${OPENSEARCH_DOCS}search-aggregations-bucket-terms-aggregation.html`,
          avg: `${OPENSEARCH_DOCS}search-aggregations-metrics-avg-aggregation.html`,
          avg_bucket: `${OPENSEARCH_DOCS}search-aggregations-pipeline-avg-bucket-aggregation.html`,
          max_bucket: `${OPENSEARCH_DOCS}search-aggregations-pipeline-max-bucket-aggregation.html`,
          min_bucket: `${OPENSEARCH_DOCS}search-aggregations-pipeline-min-bucket-aggregation.html`,
          sum_bucket: `${OPENSEARCH_DOCS}search-aggregations-pipeline-sum-bucket-aggregation.html`,
          cardinality: `${OPENSEARCH_DOCS}search-aggregations-metrics-cardinality-aggregation.html`,
          count: `${OPENSEARCH_DOCS}search-aggregations-metrics-valuecount-aggregation.html`,
          cumulative_sum: `${OPENSEARCH_DOCS}search-aggregations-metrics-sum-aggregation.html`,
          derivative: `${OPENSEARCH_DOCS}search-aggregations-pipeline-derivative-aggregation.html`,
          geo_bounds: `${OPENSEARCH_DOCS}search-aggregations-metrics-geobounds-aggregation.html`,
          geo_centroid: `${OPENSEARCH_DOCS}search-aggregations-metrics-geocentroid-aggregation.html`,
          max: `${OPENSEARCH_DOCS}search-aggregations-metrics-max-aggregation.html`,
          median: `${OPENSEARCH_DOCS}search-aggregations-metrics-percentile-aggregation.html`,
          min: `${OPENSEARCH_DOCS}search-aggregations-metrics-min-aggregation.html`,
          moving_avg: `${OPENSEARCH_DOCS}search-aggregations-pipeline-movavg-aggregation.html`,
          percentile_ranks: `${OPENSEARCH_DOCS}search-aggregations-metrics-percentile-rank-aggregation.html`,
          serial_diff: `${OPENSEARCH_DOCS}search-aggregations-pipeline-serialdiff-aggregation.html`,
          std_dev: `${OPENSEARCH_DOCS}search-aggregations-metrics-extendedstats-aggregation.html`,
          sum: `${OPENSEARCH_DOCS}search-aggregations-metrics-sum-aggregation.html`,
          top_hits: `${OPENSEARCH_DOCS}search-aggregations-metrics-top-hits-aggregation.html`,
        },
        scriptedFields: {
          scriptFields: `${OPENSEARCH_DOCS}search-request-script-fields.html`,
          scriptAggs: `${OPENSEARCH_DOCS}search-aggregations.html#_values_source`,
          painless: `${OPENSEARCH_DOCS}modules-scripting-painless.html`,
          painlessApi: `${OPENSEARCH_WEBSITE_URL}guide/en/elasticsearch/painless/${DOC_LINK_VERSION}/painless-api-reference.html`,
          painlessSyntax: `${OPENSEARCH_DOCS}modules-scripting-painless-syntax.html`,
          luceneExpressions: `${OPENSEARCH_DOCS}modules-scripting-expression.html`,
        },
        indexPatterns: {
          loadingData: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/tutorial-load-dataset.html`,
          introduction: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/index-patterns.html`,
        },
        addData: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/connect-to-elasticsearch.html`,
        opensearchDashboards: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/index.html`,
        siem: {
          guide: `${OPENSEARCH_WEBSITE_URL}guide/en/security/${DOC_LINK_VERSION}/index.html`,
          gettingStarted: `${OPENSEARCH_WEBSITE_URL}guide/en/security/${DOC_LINK_VERSION}/index.html`,
        },
        query: {
          eql: `${OPENSEARCH_DOCS}eql.html`,
          luceneQuerySyntax: `${OPENSEARCH_DOCS}query-dsl-query-string-query.html#query-string-syntax`,
          queryDsl: `${OPENSEARCH_DOCS}query-dsl.html`,
          kueryQuerySyntax: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/kuery-query.html`,
        },
        date: {
          dateMath: `${OPENSEARCH_DOCS}common-options.html#date-math`,
        },
        management: {
          opensearchDashboardsGeneralSettings: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/advanced-options.html#kibana-general-settings`,
          opensearchDashboardsSearchSettings: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/advanced-options.html#kibana-search-settings`,
          dashboardSettings: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/advanced-options.html#kibana-dashboard-settings`,
        },
        visualize: {
          guide: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/dashboard.html`,
          timelineDeprecation: `${OPENSEARCH_WEBSITE_URL}guide/en/kibana/${DOC_LINK_VERSION}/dashboard.html#timeline-deprecation`,
        },
      },
    });
  }
}

/** @public */
export interface DocLinksStart {
  readonly DOC_LINK_VERSION: string;
  readonly OPENSEARCH_WEBSITE_URL: string;
  readonly links: {
    readonly dashboard: {
      readonly drilldowns: string;
      readonly drilldownsTriggerPicker: string;
      readonly urlDrilldownTemplateSyntax: string;
      readonly urlDrilldownVariables: string;
    };
    readonly filebeat: {
      readonly base: string;
      readonly installation: string;
      readonly configuration: string;
      readonly elasticsearchOutput: string;
      readonly startup: string;
      readonly exportedFields: string;
    };
    readonly auditbeat: {
      readonly base: string;
    };
    readonly metricbeat: {
      readonly base: string;
    };
    readonly heartbeat: {
      readonly base: string;
    };
    readonly logstash: {
      readonly base: string;
    };
    readonly functionbeat: {
      readonly base: string;
    };
    readonly winlogbeat: {
      readonly base: string;
    };
    readonly aggs: {
      readonly date_histogram: string;
      readonly date_range: string;
      readonly filter: string;
      readonly filters: string;
      readonly geohash_grid: string;
      readonly histogram: string;
      readonly ip_range: string;
      readonly range: string;
      readonly significant_terms: string;
      readonly terms: string;
      readonly avg: string;
      readonly avg_bucket: string;
      readonly max_bucket: string;
      readonly min_bucket: string;
      readonly sum_bucket: string;
      readonly cardinality: string;
      readonly count: string;
      readonly cumulative_sum: string;
      readonly derivative: string;
      readonly geo_bounds: string;
      readonly geo_centroid: string;
      readonly max: string;
      readonly median: string;
      readonly min: string;
      readonly moving_avg: string;
      readonly percentile_ranks: string;
      readonly serial_diff: string;
      readonly std_dev: string;
      readonly sum: string;
      readonly top_hits: string;
    };
    readonly scriptedFields: {
      readonly scriptFields: string;
      readonly scriptAggs: string;
      readonly painless: string;
      readonly painlessApi: string;
      readonly painlessSyntax: string;
      readonly luceneExpressions: string;
    };
    readonly indexPatterns: {
      readonly loadingData: string;
      readonly introduction: string;
    };
    readonly addData: string;
    readonly opensearchDashboards: string;
    readonly siem: {
      readonly guide: string;
      readonly gettingStarted: string;
    };
    readonly query: {
      readonly eql: string;
      readonly luceneQuerySyntax: string;
      readonly queryDsl: string;
      readonly kueryQuerySyntax: string;
    };
    readonly date: {
      readonly dateMath: string;
    };
    readonly management: Record<string, string>;
    readonly visualize: Record<string, string>;
  };
}
