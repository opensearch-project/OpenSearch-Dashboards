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
    const DOC_LINK_VERSION =
      injectedMetadata.getOpenSearchDashboardsBranch() === 'main'
        ? 'latest'
        : injectedMetadata.getOpenSearchDashboardsBranch();
    const OPENSEARCH_WEBSITE_URL = 'https://www.opensearch.org/';
    const OPENSEARCH_WEBSITE_DOCS = `${OPENSEARCH_WEBSITE_URL}docs/${DOC_LINK_VERSION}`;
    const OPENSEARCH_VERSIONED_DOCS = `${OPENSEARCH_WEBSITE_DOCS}/opensearch/`;
    const OPENSEARCH_DASHBOARDS_VERSIONED_DOCS = `${OPENSEARCH_WEBSITE_DOCS}/dashboards/`;

    return deepFreeze({
      DOC_LINK_VERSION,
      OPENSEARCH_WEBSITE_URL,
      links: {
        opensearch: {
          // https://opensearch.org/docs/latest/opensearch/index/
          introduction: `${OPENSEARCH_VERSIONED_DOCS}index/`,
          installation: {
            // https://opensearch.org/docs/latest/opensearch/install/index/
            base: `${OPENSEARCH_VERSIONED_DOCS}install/index/`,
            // https://opensearch.org/docs/latest/opensearch/install/compatibility/
            compatibility: `${OPENSEARCH_VERSIONED_DOCS}install/compatibility/`,
            // https://opensearch.org/docs/latest/opensearch/install/docker/
            docker: `${OPENSEARCH_VERSIONED_DOCS}install/docker`,
            // https://opensearch.org/docs/latest/opensearch/install/docker-security/
            dockerSecurity: `${OPENSEARCH_VERSIONED_DOCS}install/docker-security`,
            // https://opensearch.org/docs/latest/opensearch/install/helm/
            helm: `${OPENSEARCH_VERSIONED_DOCS}install/helm/`,
            // https://opensearch.org/docs/latest/opensearch/install/tar/
            tar: `${OPENSEARCH_VERSIONED_DOCS}install/tar/`,
            // https://opensearch.org/docs/latest/opensearch/install/ansible/
            ansible: `${OPENSEARCH_VERSIONED_DOCS}install/ansible/`,
            // https://opensearch.org/docs/latest/opensearch/install/important-settings/
            settings: `${OPENSEARCH_VERSIONED_DOCS}install/important-settings/`,
            // https://opensearch.org/docs/latest/opensearch/install/plugins/
            plugins: `${OPENSEARCH_VERSIONED_DOCS}install/plugins/`,
          },
          // https://opensearch.org/docs/latest/opensearch/configuration/
          configuration: `${OPENSEARCH_VERSIONED_DOCS}configuration/`,
          cluster: {
            // https://opensearch.org/docs/latest/opensearch/cluster/
            base: `${OPENSEARCH_VERSIONED_DOCS}cluster/`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#step-1-name-a-cluster
            naming: `${OPENSEARCH_VERSIONED_DOCS}cluster/#step-1-name-a-cluster`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#step-2-set-node-attributes-for-each-node-in-a-cluster
            set_attribute: `${OPENSEARCH_VERSIONED_DOCS}cluster/#step-2-set-node-attributes-for-each-node-in-a-cluster`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#step-3-bind-a-cluster-to-specific-ip-addresses
            build_cluster: `${OPENSEARCH_VERSIONED_DOCS}cluster/#step-3-bind-a-cluster-to-specific-ip-addresses`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#step-4-configure-discovery-hosts-for-a-cluster
            config_host: `${OPENSEARCH_VERSIONED_DOCS}cluster/cluster/#step-4-configure-discovery-hosts-for-a-cluster`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#step-5-start-the-cluster
            start: `${OPENSEARCH_VERSIONED_DOCS}cluster/#step-5-start-the-cluster`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#advanced-step-6-configure-shard-allocation-awareness-or-forced-awareness
            config_shard: `${OPENSEARCH_VERSIONED_DOCS}cluster/#advanced-step-6-configure-shard-allocation-awareness-or-forced-awareness`,
            // https://opensearch.org/docs/latest/opensearch/cluster/#advanced-step-7-set-up-a-hot-warm-architecture
            setup_hot_arch: `${OPENSEARCH_VERSIONED_DOCS}cluster/#advanced-step-7-set-up-a-hot-warm-architecture`,
          },
          indexData: {
            // https://opensearch.org/docs/latest/opensearch/index-data/
            base: `${OPENSEARCH_VERSIONED_DOCS}index-data/`,
            // https://opensearch.org/docs/latest/opensearch/index-data/#naming-restrictions-for-indices
            naming: `${OPENSEARCH_VERSIONED_DOCS}index-data/#naming-restrictions-for-indices`,
            // https://opensearch.org/docs/latest/opensearch/index-data/#read-data
            read_data: `${OPENSEARCH_VERSIONED_DOCS}index-data/#read-data`,
            // https://opensearch.org/docs/latest/opensearch/index-data/#update-data
            update_data: `${OPENSEARCH_VERSIONED_DOCS}index-data/#update-data`,
            // https://opensearch.org/docs/latest/opensearch/index-data/#delete-data
            delete_data: `${OPENSEARCH_VERSIONED_DOCS}index-data/#delete-data`,
          },
          indexAlias: {
            // https://opensearch.org/docs/latest/opensearch/index-alias/
            base: `${OPENSEARCH_VERSIONED_DOCS}index-alias/`,
            // https://opensearch.org/docs/latest/opensearch/index-alias/#create-aliases
            create_alias: `${OPENSEARCH_VERSIONED_DOCS}index-alias/#create-aliases`,
            // https://opensearch.org/docs/latest/opensearch/index-alias/#add-or-remove-indices
            add_remove_index: `${OPENSEARCH_VERSIONED_DOCS}index-alias/#add-or-remove-indices`,
            // https://opensearch.org/docs/latest/opensearch/index-alias/#manage-aliases
            manage_alias: `${OPENSEARCH_VERSIONED_DOCS}index-alias/#manage-aliases`,
            // https://opensearch.org/docs/latest/opensearch/index-alias/#create-filtered-aliases
            filtered_alias: `${OPENSEARCH_VERSIONED_DOCS}index-alias/#create-filtered-aliases`,
            // https://opensearch.org/docs/latest/opensearch/index-alias/#index-alias-options
            alias_option: `${OPENSEARCH_VERSIONED_DOCS}index-alias/#index-alias-options`,
          },
          // https://opensearch.org/docs/latest/opensearch/data-streams/
          dataStreams: `${OPENSEARCH_VERSIONED_DOCS}data-streams/`,
          // https://opensearch.org/docs/latest/opensearch/aggregations/
          aggregations: {
            // https://opensearch.org/docs/latest/opensearch/aggregations/
            base: `${OPENSEARCH_VERSIONED_DOCS}aggregations/`,
            metric: {
              // https://opensearch.org/docs/latest/opensearch/metric-agg/
              base: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#types-of-metric-aggregations
              types: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#types-of-metric-aggregations`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#sum-min-max-avg
              sum: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#sum-min-max-avg`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#cardinality
              cardinality: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#cardinality`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#value_count
              value_count: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#value_count`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#stats-extended_stats-matrix_stats
              stats: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#stats-extended_stats-matrix_stats`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#percentile-percentile_ranks
              percentile: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#percentile-percentile_ranks`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#geo_bound
              geo_bound: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#geo_bound`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#top_hits
              top_hits: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#top_hits`,
              // https://opensearch.org/docs/latest/opensearch/metric-agg/#scripted_metric
              scripted_metric: `${OPENSEARCH_VERSIONED_DOCS}metric-agg/#scripted_metric`,
            },
            bucket: {
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/
              base: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#terms
              terms: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#terms`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#sampler-diversified_sampler
              smapler: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#sampler-diversified_sampler`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#significant_terms-significant_text
              significant_terms: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#significant_terms-significant_text`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#missing
              missing: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#missing`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#histogram-date_histogram
              histogram: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#histogram-date_histogram`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#range-date_range-ip_range
              range: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#range-date_range-ip_range`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#filter-filters
              filter: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#filter-filters`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#global
              global: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#global`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#geo_distance-geohash_grid
              geo: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#geo_distance-geohash_grid`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#adjacency_matrix
              adjacency_matrix: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#adjacency_matrix`,
              // https://opensearch.org/docs/latest/opensearch/bucket-agg/#nested-reverse_nested
              nested: `${OPENSEARCH_VERSIONED_DOCS}bucket-agg/#nested-reverse_nested`,
            },
            pipeline: {
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/
              base: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#pipeline-aggregation-syntax
              syntax: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#pipeline-aggregation-syntax`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#types-of-pipeline-aggregations
              types: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#types-of-pipeline-aggregations`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#avg_bucket-sum_bucket-min_bucket-max_bucket
              avg_bucket: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#avg_bucket-sum_bucket-min_bucket-max_bucket`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#stats_bucket-extended_stats_bucket
              stats_bucket: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#stats_bucket-extended_stats_bucket`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#bucket_script-bucket_selector
              bucket_script: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#bucket_script-bucket_selector`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#bucket_sort
              bucket_sort: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#bucket_sort`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#cumulative_sum
              cumulative_sum: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#cumulative_sum`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#derivative
              derivative: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#derivative`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#moving_avg
              moving_avg: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#moving_avg`,
              // https://opensearch.org/docs/latest/opensearch/pipeline-agg/#serial_diff
              serial_diff: `${OPENSEARCH_VERSIONED_DOCS}pipeline-agg/#serial_diff`,
            },
          },
          indexTemplates: {
            // https://opensearch.org/docs/latest/opensearch/index-templates/
            base: `${OPENSEARCH_VERSIONED_DOCS}index-templates`,
            // https://opensearch.org/docs/latest/opensearch/index-templates/#composable-index-templates
            composable: `${OPENSEARCH_VERSIONED_DOCS}index-templates/#composable-index-templates`,
            // https://opensearch.org/docs/latest/opensearch/index-templates/#index-template-options
            options: `${OPENSEARCH_VERSIONED_DOCS}index-templates/#index-template-options`,
          },
          reindexData: {
            // https://opensearch.org/docs/latest/opensearch/reindex-data/
            base: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#reindex-all-documents
            all: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#reindex-all-documents`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#reindex-from-a-remote-cluster
            remote: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#reindex-from-a-remote-cluster`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#reindex-a-subset-of-documents
            subset: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#reindex-a-subset-of-documents`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#combine-one-or-more-indices
            combine: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#combine-one-or-more-indices`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#reindex-only-unique-documents
            unique: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#reindex-only-unique-documents`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#transform-documents-during-reindexing
            transform: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#transform-documents-during-reindexing`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#update-documents-in-the-current-index
            update: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#update-documents-in-the-current-index`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#source-index-options
            source: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#source-index-options`,
            // https://opensearch.org/docs/latest/opensearch/reindex-data/#destination-index-options
            destination: `${OPENSEARCH_VERSIONED_DOCS}reindex-data/#destination-index-options`,
          },
          queryDSL: {
            // https://opensearch.org/docs/latest/opensearch/query-dsl/index/
            base: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/index/`,
            term: {
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/
              base: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#terms
              terms: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#terms`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#ids
              ids: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#ids`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#range
              range: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#range`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#prefix
              prefix: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#prefix`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#exists
              exists: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#exists`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#wildcards
              wildcards: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#wildcards`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/term/#regex
              regex: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/term/#regex`,
            },
            fullText: {
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/
              base: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#match
              match: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/#match`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#multi-match
              multi_match: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/#multi-match`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#match-phrase
              match_phrase: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/#match-phrase`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#common-terms
              common_terms: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/#common-terms`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#query-string
              query_string: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/#query-string`,
              // https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#options
              options: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/full-text/#options`,
            },
            // https://opensearch.org/docs/latest/opensearch/query-dsl/bool/
            boolQuery: `${OPENSEARCH_VERSIONED_DOCS}query-dsl/bool/`,
          },
          searchTemplate: {
            // https://opensearch.org/docs/latest/opensearch/search-template/
            base: `${OPENSEARCH_VERSIONED_DOCS}search-template`,
            // https://opensearch.org/docs/latest/opensearch/search-template/#create-search-templates
            create: `${OPENSEARCH_VERSIONED_DOCS}search-template/#create-search-templates`,
            // https://opensearch.org/docs/latest/opensearch/search-template/#save-and-execute-search-templates
            execute: `${OPENSEARCH_VERSIONED_DOCS}search-template/#save-and-execute-search-templates`,
            // https://opensearch.org/docs/latest/opensearch/search-template/#advanced-parameter-conversion-with-search-templates
            advanced_operation: `${OPENSEARCH_VERSIONED_DOCS}search-template/#advanced-parameter-conversion-with-search-templates`,
            // https://opensearch.org/docs/latest/opensearch/search-template/#multiple-search-templates
            multiple_search: `${OPENSEARCH_VERSIONED_DOCS}search-template/#multiple-search-templates`,
            // https://opensearch.org/docs/latest/opensearch/search-template/#manage-search-templates
            manage: `${OPENSEARCH_VERSIONED_DOCS}search-template/#manage-search-templates`,
          },
          searchExperience: {
            // https://opensearch.org/docs/latest/opensearch/ux/
            base: `${OPENSEARCH_VERSIONED_DOCS}ux`,
            // https://opensearch.org/docs/latest/opensearch/ux/#autocomplete-queries
            autocomplete: `${OPENSEARCH_VERSIONED_DOCS}ux/#autocomplete-queries`,
            // https://opensearch.org/docs/latest/opensearch/ux/#paginate-results
            paginate: `${OPENSEARCH_VERSIONED_DOCS}ux/#paginate-results`,
            // https://opensearch.org/docs/latest/opensearch/ux/#scroll-search
            scroll: `${OPENSEARCH_VERSIONED_DOCS}ux/#scroll-search`,
            // https://opensearch.org/docs/latest/opensearch/ux/#sort-results
            sort: `${OPENSEARCH_VERSIONED_DOCS}ux/#sort-results`,
            // https://opensearch.org/docs/latest/opensearch/ux/#highlight-query-matches
            highlight_match: `${OPENSEARCH_VERSIONED_DOCS}ux/#highlight-query-matches`,
          },
          logs: {
            // https://opensearch.org/docs/latest/opensearch/logs/
            base: `${OPENSEARCH_VERSIONED_DOCS}logs`,
            // https://opensearch.org/docs/latest/opensearch/logs/#application-logs
            application_log: `${OPENSEARCH_VERSIONED_DOCS}logs/#application-logs`,
            // https://opensearch.org/docs/latest/opensearch/logs/#slow-logs
            slow_log: `${OPENSEARCH_VERSIONED_DOCS}logs/#slow-logs`,
            // https://opensearch.org/docs/latest/opensearch/logs/#deprecation-logs
            deprecation_log: `${OPENSEARCH_VERSIONED_DOCS}logs/#deprecation-logs`,
          },
          snapshotRestore: {
            // https://opensearch.org/docs/latest/opensearch/snapshot-restore/
            base: `${OPENSEARCH_VERSIONED_DOCS}snapshot-restore`,
            // https://opensearch.org/docs/latest/opensearch/snapshot-restore/#register-repository
            register: `${OPENSEARCH_VERSIONED_DOCS}snapshot-restore/#register-repository`,
            // https://opensearch.org/docs/latest/opensearch/snapshot-restore/#take-snapshots
            take_snapshot: `${OPENSEARCH_VERSIONED_DOCS}snapshot-restore/#take-snapshots`,
            // https://opensearch.org/docs/latest/opensearch/snapshot-restore/#restore-snapshots
            restore_snapshot: `${OPENSEARCH_VERSIONED_DOCS}snapshot-restore/#restore-snapshots`,
            // https://opensearch.org/docs/latest/opensearch/snapshot-restore/#security-plugin-considerations
            security_plugin: `${OPENSEARCH_VERSIONED_DOCS}snapshot-restore/#security-plugin-considerations`,
          },
          // https://opensearch.org/docs/latest/opensearch/units/
          supportedUnits: `${OPENSEARCH_VERSIONED_DOCS}units`,
          // https://opensearch.org/docs/latest/opensearch/common-parameters/
          commonParameters: `${OPENSEARCH_VERSIONED_DOCS}common-parameters`,
          // https://opensearch.org/docs/latest/opensearch/popular-api/
          popularAPI: `${OPENSEARCH_VERSIONED_DOCS}popular-api`,
          // https://opensearch.org/docs/latest/opensearch/rest-api/index/
          restAPI: `${OPENSEARCH_VERSIONED_DOCS}rest-api/index/`,
        },
        opensearchDashboards: {
          // https://opensearch.org/docs/latest/dashboards/index/
          introduction: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}index/`,
          installation: {
            // https://opensearch.org/docs/latest/dashboards/install/index/
            base: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}install/index/`,
            // https://opensearch.org/docs/latest/dashboards/install/docker/
            docker: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}install/docker/`,
            // https://opensearch.org/docs/latest/dashboards/install/tar/
            tar: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}install/tar/`,
            // https://opensearch.org/docs/latest/dashboards/install/helm/
            helm: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}install/helm/`,
            // https://opensearch.org/docs/latest/dashboards/install/tls/
            tls: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}install/tls/`,
            // https://opensearch.org/docs/latest/dashboards/install/plugins/
            plugins: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}install/plugins/`,
          },
          // https://opensearch.org/docs/latest/dashboards/maptiles/
          mapTiles: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}maptiles`,
          // https://opensearch.org/docs/latest/dashboards/gantt/
          ganttCharts: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}gantt`,
          // https://opensearch.org/docs/latest/dashboards/reporting/
          reporting: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}reporting`,
          notebooks: {
            // https://opensearch.org/docs/latest/dashboards/notebooks/
            base: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}notebooks`,
            // https://opensearch.org/docs/latest/dashboards/notebooks/#get-started-with-notebooks
            notebook_tutorial: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}notebooks/#get-started-with-notebooks`,
            // https://opensearch.org/docs/latest/dashboards/notebooks/#paragraph-actions
            paragraph_tutorial: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}notebooks/#paragraph-actions`,
            // https://opensearch.org/docs/latest/dashboards/notebooks/#sample-notebooks
            sample_notebook: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}notebooks/#sample-notebooks`,
            // https://opensearch.org/docs/latest/dashboards/notebooks/#create-a-report
            create_report: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}notebooks/#create-a-report`,
          },
          dql: {
            // https://opensearch.org/docs/latest/dashboards/dql/
            base: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dql`,
            // https://opensearch.org/docs/latest/dashboards/dql/#terms-query
            terms_query: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dql/#terms-query`,
            // https://opensearch.org/docs/latest/dashboards/dql/#boolean-query
            boolean_query: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dql/#boolean-query`,
            // https://opensearch.org/docs/latest/dashboards/dql/#date-and-range-queries
            date_query: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dql/#date-and-range-queries`,
            // https://opensearch.org/docs/latest/dashboards/dql/#nested-field-query
            nested_query: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dql/#nested-field-query`,
          },
        },
        noDocumentation: {
          auditbeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          filebeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          metricbeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          heartbeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          logstash: `${OPENSEARCH_WEBSITE_DOCS}`,
          functionbeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          winlogbeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          siem: `${OPENSEARCH_WEBSITE_DOCS}`,
          indexPatterns: {
            loadingData: `${OPENSEARCH_WEBSITE_DOCS}`,
            introduction: `${OPENSEARCH_WEBSITE_DOCS}`,
          },
          management: {
            opensearchDashboardsGeneralSettings: `${OPENSEARCH_WEBSITE_DOCS}`,
            opensearchDashboardsSearchSettings: `${OPENSEARCH_WEBSITE_DOCS}`,
            dashboardSettings: `${OPENSEARCH_WEBSITE_DOCS}`,
          },
          scriptedFields: {
            scriptFields: `${OPENSEARCH_WEBSITE_DOCS}`,
            scriptAggs: `${OPENSEARCH_WEBSITE_DOCS}`,
            painless: `${OPENSEARCH_WEBSITE_DOCS}`,
            painlessApi: `${OPENSEARCH_WEBSITE_DOCS}`,
            painlessSyntax: `${OPENSEARCH_WEBSITE_DOCS}`,
            luceneExpressions: `${OPENSEARCH_WEBSITE_DOCS}`,
          },
          visualize: {
            guide: `${OPENSEARCH_WEBSITE_DOCS}`,
            timelineDeprecation: `${OPENSEARCH_WEBSITE_DOCS}`,
          },
          addData: `${OPENSEARCH_WEBSITE_DOCS}`,
          vega: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}`,
          dateMath: `${OPENSEARCH_WEBSITE_DOCS}`,
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
    readonly opensearch: {
      readonly introduction: string;
      readonly installation: {
        readonly base: string;
        readonly compatibility: string;
        readonly docker: string;
        readonly dockerSecurity: string;
        readonly helm: string;
        readonly tar: string;
        readonly ansible: string;
        readonly settings: string;
        readonly plugins: string;
      };
      readonly configuration: string;
      readonly cluster: {
        readonly base: string;
        readonly naming: string;
        readonly set_attribute: string;
        readonly build_cluster: string;
        readonly config_host: string;
        readonly start: string;
        readonly config_shard: string;
        readonly setup_hot_arch: string;
      };
      readonly indexData: {
        readonly base: string;
        readonly naming: string;
        readonly read_data: string;
        readonly update_data: string;
        readonly delete_data: string;
      };
      readonly indexAlias: {
        readonly base: string;
        readonly create_alias: string;
        readonly add_remove_index: string;
        readonly manage_alias: string;
        readonly filtered_alias: string;
        readonly alias_option: string;
      };
      readonly dataStreams: string;
      readonly aggregations: {
        readonly base: string;
        readonly metric: {
          readonly base: string;
          readonly types: string;
          readonly sum: string;
          readonly cardinality: string;
          readonly value_count: string;
          readonly stats: string;
          readonly percentile: string;
          readonly geo_bound: string;
          readonly top_hits: string;
          readonly scripted_metric: string;
        };
        readonly bucket: {
          readonly base: string;
          readonly terms: string;
          readonly smapler: string;
          readonly significant_terms: string;
          readonly missing: string;
          readonly histogram: string;
          readonly range: string;
          readonly filter: string;
          readonly global: string;
          readonly geo: string;
          readonly adjacency_matrix: string;
          readonly nested: string;
        };
        readonly pipeline: {
          readonly base: string;
          readonly syntax: string;
          readonly types: string;
          readonly avg_bucket: string;
          readonly stats_bucket: string;
          readonly bucket_script: string;
          readonly bucket_sort: string;
          readonly cumulative_sum: string;
          readonly derivative: string;
          readonly moving_avg: string;
          readonly serial_diff: string;
        };
      };
      readonly indexTemplates: {
        readonly base: string;
        readonly composable: string;
        readonly options: string;
      };
      readonly reindexData: {
        readonly base: string;
        readonly all: string;
        readonly remote: string;
        readonly subset: string;
        readonly combine: string;
        readonly unique: string;
        readonly transform: string;
        readonly update: string;
        readonly source: string;
        readonly destination: string;
      };
      readonly queryDSL: {
        readonly base: string;
        readonly term: {
          readonly base: string;
          readonly terms: string;
          readonly ids: string;
          readonly range: string;
          readonly prefix: string;
          readonly exists: string;
          readonly wildcards: string;
          readonly regex: string;
        };
        readonly fullText: {
          readonly base: string;
          readonly match: string;
          readonly multi_match: string;
          readonly match_phrase: string;
          readonly common_terms: string;
          readonly query_string: string;
          readonly options: string;
        };
        readonly boolQuery: string;
      };
      readonly searchTemplate: {
        readonly base: string;
        readonly create: string;
        readonly execute: string;
        readonly advanced_operation: string;
        readonly multiple_search: string;
        readonly manage: string;
      };
      readonly searchExperience: {
        readonly base: string;
        readonly autocomplete: string;
        readonly paginate: string;
        readonly scroll: string;
        readonly sort: string;
        readonly highlight_match: string;
      };
      readonly logs: {
        readonly base: string;
        readonly application_log: string;
        readonly slow_log: string;
        readonly deprecation_log: string;
      };
      readonly snapshotRestore: {
        readonly base: string;
        readonly register: string;
        readonly take_snapshot: string;
        readonly restore_snapshot: string;
        readonly security_plugin: string;
      };
      readonly supportedUnits: string;
      readonly commonParameters: string;
      readonly popularAPI: string;
      readonly restAPI: string;
    };
    readonly opensearchDashboards: {
      readonly introduction: string;
      readonly installation: {
        readonly base: string;
        readonly docker: string;
        readonly tar: string;
        readonly helm: string;
        readonly tls: string;
        readonly plugins: string;
      };
      readonly mapTiles: string;
      readonly ganttCharts: string;
      readonly reporting: string;
      readonly notebooks: {
        readonly base: string;
        readonly notebook_tutorial: string;
        readonly paragraph_tutorial: string;
        readonly sample_notebook: string;
        readonly create_report: string;
      };
      readonly dql: {
        readonly base: string;
        readonly terms_query: string;
        readonly boolean_query: string;
        readonly date_query: string;
        readonly nested_query: string;
      };
    };
    readonly noDocumentation: {
      readonly auditbeat: string;
      readonly filebeat: string;
      readonly metricbeat: string;
      readonly heartbeat: string;
      readonly logstash: string;
      readonly functionbeat: string;
      readonly winlogbeat: string;
      readonly siem: string;
      readonly indexPatterns: {
        readonly loadingData: string;
        readonly introduction: string;
      };
      readonly scriptedFields: {
        readonly scriptFields: string;
        readonly scriptAggs: string;
        readonly painless: string;
        readonly painlessApi: string;
        readonly painlessSyntax: string;
        readonly luceneExpressions: string;
      };
      readonly management: Record<string, string>;
      readonly visualize: Record<string, string>;
      readonly addData: string;
      readonly vega: string;
      readonly dateMath: string;
    };
  };
}
