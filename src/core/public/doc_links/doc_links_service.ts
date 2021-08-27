/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
    const OPENSEARCH_WEBSITE_URL = 'https://www.opensearch.org/';
    const OPENSEARCH_DOCS = `https://opensearch.org/docs/opensearch/`;
    const OPENSEARCH_DASHBOARDS_DOCS = `https://opensearch.org/docs/dashboards/`;

    return deepFreeze({
      DOC_LINK_VERSION,
      OPENSEARCH_WEBSITE_URL,
      links: {
        dashboard: {
          drilldowns: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/drilldowns.html`,
          drilldownsTriggerPicker: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/drilldowns.html#url-drilldowns`,
          urlDrilldownTemplateSyntax: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/url_templating-language.html`,
          urlDrilldownVariables: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/url_templating-language.html#url-template-variables`,
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
          date_histogram: `${OPENSEARCH_DOCS}bucket-agg/#histogram-date_histogram`,
          date_range: `${OPENSEARCH_DOCS}bucket-agg/#range-date_range-ip_range`,
          filter: `${OPENSEARCH_DOCS}bucket-agg/#filter-filters`,
          filters: `${OPENSEARCH_DOCS}bucket-agg/#filter-filters`,
          geohash_grid: `${OPENSEARCH_DOCS}bucket-agg/#geo_distance-geohash_grid`,
          histogram: `${OPENSEARCH_DOCS}bucket-agg/#histogram-date_histogram`,
          ip_range: `${OPENSEARCH_DOCS}bucket-agg/#range-date_range-ip_range`,
          range: `${OPENSEARCH_DOCS}bucket-agg/#range-date_range-ip_range`,
          significant_terms: `${OPENSEARCH_DOCS}bucket-agg/#significant_terms-significant_text`,
          terms: `${OPENSEARCH_DOCS}bucket-agg/#terms`,
          avg: `${OPENSEARCH_DOCS}metric-agg/#sum-min-max-avg`,
          avg_bucket: `${OPENSEARCH_DOCS}pipeline-agg/#avg_bucket-sum_bucket-min_bucket-max_bucket`,
          max_bucket: `${OPENSEARCH_DOCS}pipeline-agg/#avg_bucket-sum_bucket-min_bucket-max_bucket`,
          min_bucket: `${OPENSEARCH_DOCS}pipeline-agg/#avg_bucket-sum_bucket-min_bucket-max_bucket`,
          sum_bucket: `${OPENSEARCH_DOCS}pipeline-agg/#avg_bucket-sum_bucket-min_bucket-max_bucket`,
          cardinality: `${OPENSEARCH_DOCS}metric-agg/#cardinality`,
          count: `${OPENSEARCH_DOCS}metric-agg/#value_count`,
          cumulative_sum: `${OPENSEARCH_DOCS}pipeline-agg/#cumulative_sum`,
          derivative: `${OPENSEARCH_DOCS}pipeline-agg/#derivative`,
          geo_bounds: `${OPENSEARCH_DOCS}metric-agg/#geo_bound`,
          geo_centroid: `${OPENSEARCH_DOCS}metric-agg/#geo_bound`,
          max: `${OPENSEARCH_DOCS}metric-agg/#sum-min-max-avg`,
          median: `${OPENSEARCH_DOCS}metric-agg/#sum-min-max-avg`,
          min: `${OPENSEARCH_DOCS}metric-agg/#sum-min-max-avg`,
          moving_avg: `${OPENSEARCH_DOCS}pipeline-agg/#moving_avg`,
          percentile_ranks: `${OPENSEARCH_DOCS}metric-agg/#percentile-percentile_ranks`,
          serial_diff: `${OPENSEARCH_DOCS}pipeline-agg/#serial_diff`,
          std_dev: `${OPENSEARCH_DOCS}metric-agg/#stats-extended_stats-matrix_stats`,
          sum: `${OPENSEARCH_DOCS}metric-agg/#sum-min-max-avg`,
          top_hits: `${OPENSEARCH_DOCS}metric-agg/#top_hits`,
        },
        scriptedFields: {
          scriptFields: `${OPENSEARCH_DOCS}search-request-script-fields.html`,
          scriptAggs: `${OPENSEARCH_DOCS}metric-agg/#scripted_metric`,
          painless: `${OPENSEARCH_DOCS}modules-scripting-painless.html`,
          painlessApi: `${OPENSEARCH_WEBSITE_URL}guide/en/elasticsearch/painless/${DOC_LINK_VERSION}/painless-api-reference.html`,
          painlessSyntax: `${OPENSEARCH_DOCS}modules-scripting-painless-syntax.html`,
          luceneExpressions: `${OPENSEARCH_DOCS}modules-scripting-expression.html`,
        },
        indexPatterns: {
          loadingData: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/tutorial-load-dataset.html`,
          // TODO: [RENAMEME] Need prod urls.
          // issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/335#issuecomment-868294864
          introduction: `${OPENSEARCH_DASHBOARDS_DOCS}`,
        },
        // TODO: [RENAMEME] Need prod urls.
        // issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/335#issuecomment-868294864
        addData: `${OPENSEARCH_DASHBOARDS_DOCS}`,
        opensearchDashboards: `${OPENSEARCH_DASHBOARDS_DOCS}`,
        siem: {
          guide: `${OPENSEARCH_WEBSITE_URL}guide/en/security/${DOC_LINK_VERSION}/index.html`,
          gettingStarted: `${OPENSEARCH_WEBSITE_URL}guide/en/security/${DOC_LINK_VERSION}/index.html`,
        },
        query: {
          eql: `${OPENSEARCH_DOCS}eql.html`,
          luceneQuerySyntax: `${OPENSEARCH_DOCS}query-dsl-query-string-query.html#query-string-syntax`,
          queryDsl: `${OPENSEARCH_DOCS}query-dsl`,
          kueryQuerySyntax: `${OPENSEARCH_DOCS}query-dsl`,
        },
        date: {
          dateMath: `${OPENSEARCH_DOCS}common-options.html#date-math`,
        },
        management: {
          opensearchDashboardsGeneralSettings: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/advanced-options.html#opensearch-general-settings`,
          opensearchDashboardsSearchSettings: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/advanced-options.html#opensearch-search-settings`,
          dashboardSettings: `${OPENSEARCH_WEBSITE_URL}guide/en/opensearch/${DOC_LINK_VERSION}/advanced-options.html#opensearch-dashboard-settings`,
        },
        visualize: {
          guide: `${OPENSEARCH_DASHBOARDS_DOCS}`,
          timelineDeprecation: `${OPENSEARCH_DASHBOARDS_DOCS}`,
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
