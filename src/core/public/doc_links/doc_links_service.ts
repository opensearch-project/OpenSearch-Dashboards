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

import { deepFreeze } from '@osd/std';
import { parse } from 'semver';
import { InjectedMetadataSetup } from '../injected_metadata';

export interface StartDeps {
  injectedMetadata: InjectedMetadataSetup;
}

/** @internal */
export class DocLinksService {
  public setup() {}
  public start({ injectedMetadata }: StartDeps): DocLinksStart {
    const buildVersion = injectedMetadata.getOpenSearchDashboardsVersion();
    const pkgBranch = injectedMetadata.getOpenSearchDashboardsBranch();
    /**
     * OpenSearch server uses the `branch` property from `package.json` to
     * build links to the documentation. If set to `main`, it would use `/latest`
     * and if not, it would use the `version` to construct URLs.
     */
    let branch = pkgBranch;
    if (pkgBranch === 'main') {
      branch = 'latest';
    } else {
      const validDocPathsPattern = /^\d+\.\d+$/;
      const parsedBuildVersion = parse(buildVersion);
      if (!validDocPathsPattern.test(pkgBranch) && parsedBuildVersion) {
        branch = `${parsedBuildVersion.major}.${parsedBuildVersion.minor}`;
      }
    }
    const DOC_LINK_VERSION = branch;
    const OPENSEARCH_WEBSITE_URL = 'https://opensearch.org/';
    const OPENSEARCH_WEBSITE_DOCS = `${OPENSEARCH_WEBSITE_URL}docs/${DOC_LINK_VERSION}`;
    const OPENSEARCH_DASHBOARDS_VERSIONED_DOCS = `${OPENSEARCH_WEBSITE_DOCS}/dashboards/`;

    return deepFreeze({
      DOC_LINK_VERSION,
      OPENSEARCH_WEBSITE_URL,
      links: {
        opensearch: {
          // https://opensearch.org/docs/latest/about/
          introduction: `${OPENSEARCH_WEBSITE_DOCS}/about/`,
          installation: {
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/index/
            base: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/index/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/index/
            compatibility: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/index/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/docker/
            docker: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/docker/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/docker/
            dockerSecurity: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/docker/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/helm/
            helm: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/helm/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/tar/
            tar: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/tar/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/ansible/
            ansible: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/ansible/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-opensearch/index/
            settings: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-opensearch/index/`,
            // https://opensearch.org/docs/latest/install-and-configure/plugins/
            plugins: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/plugins/`,
          },
          // https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/index/
          configuration: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/configuring-opensearch/index/`,
          cluster: {
            // https://opensearch.org/docs/latest/tuning-your-cluster/
            base: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#step-1-name-a-cluster
            naming: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#step-1-name-a-cluster`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#step-2-set-node-attributes-for-each-node-in-a-cluster
            set_attribute: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#step-2-set-node-attributes-for-each-node-in-a-cluster`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#step-3-bind-a-cluster-to-specific-ip-addresses
            build_cluster: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#step-3-bind-a-cluster-to-specific-ip-addresses`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#step-4-configure-discovery-hosts-and-initial-cluster-manager-nodes-for-a-cluster
            config_host: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#step-4-configure-discovery-hosts-and-initial-cluster-manager-nodes-for-a-cluster`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#step-5-start-the-cluster
            start: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#step-5-start-the-cluster`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#advanced-step-6-configure-shard-allocation-awareness-or-forced-awareness
            config_shard: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#advanced-step-6-configure-shard-allocation-awareness-or-forced-awareness`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/#advanced-step-7-set-up-a-hot-warm-architecture
            setup_hot_arch: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/#advanced-step-7-set-up-a-hot-warm-architecture`,
          },
          indexData: {
            // https://opensearch.org/docs/latest/im-plugin/
            base: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/create-index/#index-naming-restrictions
            naming: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/create-index/#index-naming-restrictions`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/get-documents/
            read_data: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/get-documents/`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/update-document/
            update_data: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/update-document/`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/delete-document/
            delete_data: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/delete-document/`,
          },
          indexAlias: {
            // https://opensearch.org/docs/latest/im-plugin/index-alias/
            base: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-alias/`,
            // https://opensearch.org/docs/latest/im-plugin/index-alias/#creating-an-alias
            create_alias: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-alias/#creating-an-alias`,
            // https://opensearch.org/docs/latest/im-plugin/index-alias/#switching-an-alias-to-a-different-index
            add_remove_index: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-alias/#switching-an-alias-to-a-different-index`,
            // https://opensearch.org/docs/latest/im-plugin/index-alias/#inspecting-and-querying-aliases
            manage_alias: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-alias/#inspecting-and-querying-aliases`,
            // https://opensearch.org/docs/latest/im-plugin/index-alias/#filtering-an-alias
            filtered_alias: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-alias/#filtering-an-alias`,
            // https://opensearch.org/docs/latest/api-reference/alias/aliases-api/#request-body-fields
            alias_option: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/alias/aliases-api/#request-body-fields`,
          },
          // https://opensearch.org/docs/latest/im-plugin/data-streams/
          dataStreams: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/data-streams/`,
          // https://opensearch.org/docs/latest/opensearch/aggregations/
          aggregations: {
            // https://opensearch.org/docs/latest/aggregations/
            base: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/`,
            metric: {
              // https://opensearch.org/docs/latest/aggregations/metric/index/
              base: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/index/`,
              // https://opensearch.org/docs/latest/aggregations/metric/index/#types-of-metric-aggregations
              types: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/index/#types-of-metric-aggregations`,
              // https://opensearch.org/docs/latest/aggregations/metric/sum/
              sum: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/sum/`,
              // https://opensearch.org/docs/latest/aggregations/metric/cardinality/
              cardinality: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/cardinality/`,
              // https://opensearch.org/docs/latest/aggregations/metric/value-count/
              value_count: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/value-count/`,
              // https://opensearch.org/docs/latest/aggregations/metric/stats/
              stats: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/stats/`,
              // https://opensearch.org/docs/latest/aggregations/metric/percentile/
              percentile: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/percentile/`,
              // https://opensearch.org/docs/latest/aggregations/metric/geobounds/
              geo_bound: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/geobounds/`,
              // https://opensearch.org/docs/latest/aggregations/metric/top-hits/
              top_hits: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/top-hits/`,
              // https://opensearch.org/docs/latest/aggregations/metric/scripted-metric/
              scripted_metric: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/metric/scripted-metric/`,
            },
            bucket: {
              // https://opensearch.org/docs/latest/aggregations/bucket/index/
              base: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/index/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/terms/
              terms: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/terms/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/sampler/
              smapler: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/sampler/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/significant-terms/
              significant_terms: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/significant-terms/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/missing/
              missing: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/missing/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/histogram/
              histogram: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/histogram/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/range/
              range: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/range/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/filter/
              filter: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/filter/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/global/
              global: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/global/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/geo-distance/
              geo: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/geo-distance/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/adjacency-matrix/
              adjacency_matrix: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/adjacency-matrix/`,
              // https://opensearch.org/docs/latest/aggregations/bucket/nested/
              nested: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/bucket/nested/`,
            },
            pipeline: {
              // https://opensearch.org/docs/latest/aggregations/pipeline/index/
              base: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/index/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/index/#buckets-path
              syntax: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/index/#buckets-path`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/index/#pipeline-aggregation-types
              types: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/index/#pipeline-aggregation-types`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/avg-bucket/
              avg_bucket: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/avg-bucket/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/stats-bucket/
              stats_bucket: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/stats-bucket/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/bucket-script/
              bucket_script: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/bucket-script/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/bucket-sort/
              bucket_sort: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/bucket-sort/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/cumulative-sum/
              cumulative_sum: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/cumulative-sum/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/derivative/
              derivative: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/derivative/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/moving-avg/
              moving_avg: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/moving-avg/`,
              // https://opensearch.org/docs/latest/aggregations/pipeline/serial-diff/
              serial_diff: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/pipeline/serial-diff/`,
            },
          },
          indexTemplates: {
            // https://opensearch.org/docs/latest/im-plugin/index-templates/
            base: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-templates/`,
            // https://opensearch.org/docs/latest/im-plugin/index-templates/#creating-an-index-template
            composable: `${OPENSEARCH_WEBSITE_DOCS}/im-plugin/index-templates/#creating-an-index-template`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/create-index-template/#request-body-fields
            options: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/create-index-template/#request-body-fields`,
          },
          reindexData: {
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/
            base: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#example-request
            all: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#example-request`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#cross-cluster-reindexing
            remote: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#cross-cluster-reindexing`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#filtering-documents-by-query
            subset: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#filtering-documents-by-query`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#consolidating-time-based-indexes
            combine: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#consolidating-time-based-indexes`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#the-dest-object
            unique: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#the-dest-object`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#transforming-documents-using-ingest-pipelines
            transform: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#transforming-documents-using-ingest-pipelines`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/update-by-query/
            update: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/update-by-query/`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#the-source-object
            source: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#the-source-object`,
            // https://opensearch.org/docs/latest/api-reference/document-apis/reindex/#the-dest-object
            destination: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/reindex/#the-dest-object`,
          },
          queryDSL: {
            // https://opensearch.org/docs/latest/query-dsl/
            base: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/`,
            term: {
              // https://opensearch.org/docs/latest/query-dsl/term/index/
              base: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/index/`,
              // https://opensearch.org/docs/latest/query-dsl/term/terms/
              terms: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/terms/`,
              // https://opensearch.org/docs/latest/query-dsl/term/ids/
              ids: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/ids/`,
              // https://opensearch.org/docs/latest/query-dsl/term/range/
              range: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/range/`,
              // https://opensearch.org/docs/latest/query-dsl/term/prefix/
              prefix: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/prefix/`,
              // https://opensearch.org/docs/latest/query-dsl/term/exists/
              exists: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/exists/`,
              // https://opensearch.org/docs/latest/query-dsl/term/wildcard/
              wildcards: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/wildcard/`,
              // https://opensearch.org/docs/latest/query-dsl/term/regexp/
              regex: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/term/regexp/`,
            },
            fullText: {
              // https://opensearch.org/docs/latest/query-dsl/full-text/index/
              base: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/index/`,
              // https://opensearch.org/docs/latest/query-dsl/full-text/match/
              match: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/match/`,
              // https://opensearch.org/docs/latest/query-dsl/full-text/multi-match/
              multi_match: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/multi-match/`,
              // https://opensearch.org/docs/latest/query-dsl/full-text/match-phrase/
              match_phrase: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/match-phrase/`,
              // https://opensearch.org/docs/latest/query-dsl/full-text/index/
              common_terms: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/index/`,
              // https://opensearch.org/docs/latest/query-dsl/full-text/query-string/
              query_string: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/query-string/`,
              // https://opensearch.org/docs/latest/query-dsl/full-text/index/
              options: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/index/`,
            },
            // https://opensearch.org/docs/latest/query-dsl/compound/bool/
            boolQuery: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/compound/bool/`,
          },
          searchTemplate: {
            // https://opensearch.org/docs/latest/api-reference/search-apis/search-template/index/
            base: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-template/index/`,
            // https://opensearch.org/docs/latest/api-reference/search-apis/search-template/index/#create-search-templates
            create: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-template/index/#create-search-templates`,
            // https://opensearch.org/docs/latest/api-reference/search-apis/search-template/index/#save-and-execute-search-templates
            execute: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-template/index/#save-and-execute-search-templates`,
            // https://opensearch.org/docs/latest/api-reference/search-apis/search-template/index/#advanced-parameter-conversion-with-search-templates
            advanced_operation: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-template/index/#advanced-parameter-conversion-with-search-templates`,
            // https://opensearch.org/docs/latest/api-reference/search-apis/search-template/index/#multiple-search-templates
            multiple_search: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-template/index/#multiple-search-templates`,
            // https://opensearch.org/docs/latest/api-reference/search-apis/search-template/index/#manage-search-templates
            manage: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-template/index/#manage-search-templates`,
          },
          searchExperience: {
            // https://opensearch.org/docs/latest/search-plugins/searching-data/index/
            base: `${OPENSEARCH_WEBSITE_DOCS}/search-plugins/searching-data/index/`,
            // https://opensearch.org/docs/latest/search-plugins/searching-data/autocomplete/
            autocomplete: `${OPENSEARCH_WEBSITE_DOCS}/search-plugins/searching-data/autocomplete/`,
            // https://opensearch.org/docs/latest/search-plugins/searching-data/paginate/
            paginate: `${OPENSEARCH_WEBSITE_DOCS}/search-plugins/searching-data/paginate/`,
            // https://opensearch.org/docs/latest/search-plugins/searching-data/paginate/#scroll-search
            scroll: `${OPENSEARCH_WEBSITE_DOCS}/search-plugins/searching-data/paginate/#scroll-search`,
            // https://opensearch.org/docs/latest/search-plugins/searching-data/sort/
            sort: `${OPENSEARCH_WEBSITE_DOCS}/search-plugins/searching-data/sort/`,
            // https://opensearch.org/docs/latest/search-plugins/searching-data/highlight/
            highlight_match: `${OPENSEARCH_WEBSITE_DOCS}/search-plugins/searching-data/highlight/`,
          },
          logs: {
            // https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/
            base: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/configuring-opensearch/logs/`,
            // https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/#application-logs
            application_log: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/configuring-opensearch/logs/#application-logs`,
            // https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/#search-request-slow-logs
            slow_log: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/configuring-opensearch/logs/#search-request-slow-logs`,
            // https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/logs/#deprecation-logs
            deprecation_log: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/configuring-opensearch/logs/#deprecation-logs`,
          },
          snapshotRestore: {
            // https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/
            base: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#register-repository
            register: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#register-repository`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#take-snapshots
            take_snapshot: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#take-snapshots`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#restore-snapshots
            restore_snapshot: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#restore-snapshots`,
            // https://opensearch.org/docs/latest/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#security-considerations
            security_plugin: `${OPENSEARCH_WEBSITE_DOCS}/tuning-your-cluster/availability-and-recovery/snapshots/snapshot-restore/#security-considerations`,
          },
          // https://opensearch.org/docs/latest/api-reference/units/
          supportedUnits: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/units/`,
          // https://opensearch.org/docs/latest/api-reference/common-parameters/
          commonParameters: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/common-parameters/`,
          // https://opensearch.org/docs/latest/api-reference/popular-api/
          popularAPI: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/popular-api/`,
          restAPI: {
            // https://opensearch.org/docs/latest/api-reference/
            base: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/`,
            indexAPI: {
              // https://opensearch.org/docs/latest/api-reference/index-apis/index/
              base: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/index/`,
              // https://opensearch.org/docs/latest/api-reference/index-apis/create-index/
              create: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/create-index/`,
              // https://opensearch.org/docs/latest/api-reference/index-apis/exists/
              exists: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/exists/`,
              // https://opensearch.org/docs/latest/api-reference/index-apis/delete-index/
              delete: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/delete-index/`,
              // https://opensearch.org/docs/latest/api-reference/index-apis/get-index/
              get: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/get-index/`,
              // https://opensearch.org/docs/latest/api-reference/index-apis/close-index/
              close: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/close-index/`,
            },
          },
          // https://opensearch.org/docs/latest/mappings/supported-field-types/date/#date-math
          dateMath: `${OPENSEARCH_WEBSITE_DOCS}/mappings/supported-field-types/date/#date-math`,
          // https://forum.opensearch.org/t/feedback-experimental-feature-connect-to-external-data-sources/11144
          openSearchForum:
            'https://forum.opensearch.org/t/feedback-experimental-feature-connect-to-external-data-sources/11144',
        },
        opensearchDashboards: {
          // https://opensearch.org/docs/latest/dashboards/
          introduction: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/`,
          installation: {
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/index/
            base: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/index/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/docker/
            docker: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/docker/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/tar/
            tar: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/tar/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/helm/
            helm: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/helm/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/tls/
            tls: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/tls/`,
            // https://opensearch.org/docs/latest/install-and-configure/install-dashboards/plugins/
            plugins: `${OPENSEARCH_WEBSITE_DOCS}/install-and-configure/install-dashboards/plugins/`,
          },
          // https://opensearch.org/docs/latest/dashboards/visualize/visualize-app/maptiles/
          mapTiles: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/visualize/visualize-app/maptiles/`,
          // https://opensearch.org/docs/latest/dashboards/gantt/
          ganttCharts: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}gantt`,
          // https://opensearch.org/docs/latest/reporting/report-dashboard-index/
          reporting: `${OPENSEARCH_WEBSITE_DOCS}/reporting/report-dashboard-index/`,
          // https://opensearch.org/docs/latest/dashboards/dev-tools/index/
          devTools: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/dev-tools/index/`,
          notebooks: {
            // https://opensearch.org/docs/latest/observing-your-data/notebooks/
            base: `${OPENSEARCH_WEBSITE_DOCS}/observing-your-data/notebooks/`,
            // https://opensearch.org/docs/latest/observing-your-data/notebooks/#get-started-with-notebooks
            notebook_tutorial: `${OPENSEARCH_WEBSITE_DOCS}/observing-your-data/notebooks/#get-started-with-notebooks`,
            // https://opensearch.org/docs/latest/observing-your-data/notebooks/#paragraph-actions
            paragraph_tutorial: `${OPENSEARCH_WEBSITE_DOCS}/observing-your-data/notebooks/#paragraph-actions`,
            // https://opensearch.org/docs/latest/observing-your-data/notebooks/#sample-notebooks
            sample_notebook: `${OPENSEARCH_WEBSITE_DOCS}/observing-your-data/notebooks/#sample-notebooks`,
            // https://opensearch.org/docs/latest/observing-your-data/notebooks/#create-a-report
            create_report: `${OPENSEARCH_WEBSITE_DOCS}/observing-your-data/notebooks/#create-a-report`,
          },
          dql: {
            // https://opensearch.org/docs/latest/dashboards/dql/
            base: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dql`,
            // https://opensearch.org/docs/latest/dashboards/dql/#search-for-terms
            terms_query: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/dql/#search-for-terms`,
            // https://opensearch.org/docs/latest/dashboards/dql/#boolean-operators
            boolean_query: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/dql/#boolean-operators`,
            // https://opensearch.org/docs/latest/dashboards/dql/#ranges
            date_query: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/dql/#ranges`,
            // https://opensearch.org/docs/latest/dashboards/dql/#nested-fields
            nested_query: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/dql/#nested-fields`,
          },
          // https://opensearch.org/docs/latest/dashboards/getting-started/index/
          browser: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/getting-started/index/`,
          dataSource: {
            // https://opensearch.org/docs/latest/dashboards/management/multi-data-sources/
            guide: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/management/multi-data-sources/`,
            // https://opensearch.org/docs/latest/dashboards/management/S3-data-source/
            s3DataSource: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}management/S3-data-source/`,
          },
          visualize: {
            // https://opensearch.org/docs/latest/dashboards/visualize/visualize-app/index/
            guide: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/visualize/visualize-app/index/`,
          },
          dashboards: {
            // https://opensearch.org/docs/latest/dashboards/getting-started/index/
            quickStart: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/getting-started/index/`,
            // https://opensearch.org/docs/latest/dashboards/dashboard/index/
            createDashboards: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}dashboard/index/`,
          },
          management: {
            // https://opensearch.org/docs/latest/dashboards/management/advanced-settings/
            advancedSettings: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}management/advanced-settings/`,
          },
          workspace: {
            // https://opensearch.org/docs/latest/dashboards/workspace/workspace-acl/#defining-workspace-collaborators
            collaborators: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}workspace/workspace-acl/#defining-workspace-collaborators`,
            // https://opensearch.org/docs/latest/dashboards/workspace/workspace-acl/#configuring-workspace-privacy
            privacy: `${OPENSEARCH_DASHBOARDS_VERSIONED_DOCS}workspace/workspace-acl/#configuring-workspace-privacy`,
          },
        },
        noDocumentation: {
          auditbeat: `${OPENSEARCH_WEBSITE_DOCS}/tools/`,
          filebeat: `${OPENSEARCH_WEBSITE_DOCS}/tools/`,
          metricbeat: `${OPENSEARCH_WEBSITE_DOCS}/tools/`,
          heartbeat: `${OPENSEARCH_WEBSITE_DOCS}/tools/`,
          logstash: `${OPENSEARCH_WEBSITE_DOCS}/tools/logstash/index/`,
          functionbeat: `${OPENSEARCH_WEBSITE_DOCS}/tools/`,
          winlogbeat: `${OPENSEARCH_WEBSITE_DOCS}`,
          siem: `${OPENSEARCH_WEBSITE_DOCS}/security-analytics/`,
          indexPatterns: {
            loadingData: `${OPENSEARCH_WEBSITE_DOCS}/getting-started/ingest-data/`,
            introduction: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/management/index-patterns/`,
          },
          management: {
            opensearchDashboardsGeneralSettings: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/management/advanced-settings/`,
            opensearchDashboardsSearchSettings: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/management/advanced-settings/`,
            dashboardSettings: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/management/advanced-settings/`,
          },
          scriptedFields: {
            scriptFields: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/index/`,
            scriptAggs: `${OPENSEARCH_WEBSITE_DOCS}/aggregations/`,
            painless: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/index/`,
            painlessApi: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/exec-script/`,
            painlessSyntax: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/index/`,
            luceneExpressions: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/index/`,
          },
          addData: `${OPENSEARCH_WEBSITE_DOCS}/getting-started/ingest-data/`,
          vega: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/visualize/visualize-app/vega/`,
          savedObject: {
            // https://opensearch.org/docs/latest/dashboards/management/saved-objects/
            manageSavedObject: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/management/saved-objects/`,
          },
          clusterAPI: {
            // https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-reroute/
            clusterRoute: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/cluster-api/cluster-reroute/`,
            clusterState: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/cluster-api/cluster-state/`,
            // https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-stats/
            clusterStats: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/cluster-api/cluster-stats/`,
            clusterPending: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/cluster-api/cluster-pending-tasks/`,
          },
          // https://opensearch.org/docs/latest/mappings/
          mappingTypes: `${OPENSEARCH_WEBSITE_DOCS}/mappings/`,
          moduleScripting: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/index/`,
          indexAPI: {
            // https://opensearch.org/docs/latest/api-reference/analyze-apis/
            indexAnalyze: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/analyze-apis/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/clear-index-cache/
            indexClearCache: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/clear-index-cache/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/clone/
            indexClone: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/clone/`,
            indexSynced: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/flush/`,
            indexFlush: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/flush/`,
            indexForceMerge: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/force-merge/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/get-settings/
            indexSetting: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/get-settings/`,
            indexUpgrade: `${OPENSEARCH_WEBSITE_DOCS}/migrate-or-upgrade/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/update-settings/
            indexUpdateSetting: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/update-settings/`,
            indexRecovery: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/recover/`,
            indexRefresh: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/refresh/`,
            indexRollover: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/rollover/`,
            indexSegment: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/segment/`,
            indexShardStore: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/shard-stores/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/shrink-index/
            indexShrink: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/shrink-index/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/split/
            indexSplit: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/split/`,
            indexStats: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/stats/`,
            indexGetFieldMapping: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/get-field-mapping/`,
            indexGetMapping: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/get-mapping/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/open-index/
            indexOpenClose: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/open-index/`,
            // https://opensearch.org/docs/latest/api-reference/index-apis/put-mapping/
            indexPutMapping: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/index-apis/put-mapping/`,
            indexSearchValidate: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/validate/`,
          },
          ingest: {
            // https://opensearch.org/docs/latest/ingest-pipelines/delete-ingest/
            deletePipeline: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/delete-ingest/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/get-ingest/
            getPipeline: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/get-ingest/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/create-ingest/
            putPipeline: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/create-ingest/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/simulate-ingest/
            simulatePipeline: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/simulate-ingest/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/grok/
            grokProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/grok/`,
            appendProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/append/`,
            bytesProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/bytes/`,
            ingestCircleProcessor: `${OPENSEARCH_WEBSITE_DOCS}`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/csv/
            csvProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/csv/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/convert/
            convertProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/convert/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/date/
            dataProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/date/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/date-index-name/
            dataIndexNamProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/date-index-name/`,
            dissectProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/dissect/`,
            dotExpandProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/dot-expander/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/drop/
            dropProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/drop/`,
            failProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/fail/`,
            foreachProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/foreach/`,
            geoIPProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/ip2geo/`,
            gusbProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/gsub/`,
            htmlstripProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/html-strip/`,
            inferenceProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/ml-inference/`,
            joinProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/join/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/json/
            jsonProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/json/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/kv/
            kvProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/kv/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/lowercase/
            lowecaseProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/lowercase/`,
            pipelineProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/pipeline/`,
            removeProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/remove/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/rename/
            renameProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/rename/`,
            scriptProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/script/`,
            setProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/set/`,
            securityUserProcessor: `${OPENSEARCH_WEBSITE_DOCS}`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/split/
            splitProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/split/`,
            sortProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/sort/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/trim/
            trimProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/trim/`,
            // https://opensearch.org/docs/latest/ingest-pipelines/processors/uppercase/
            uppercaseProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/uppercase/`,
            urldecodeProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/urldecode/`,
            userAgentProcessor: `${OPENSEARCH_WEBSITE_DOCS}/ingest-pipelines/processors/user-agent/`,
          },
          nodes: {
            // https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-info/
            info: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/nodes-apis/nodes-info/`,
            // https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-hot-threads/
            hotThreads: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/nodes-apis/nodes-hot-threads/`,
            // https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-reload-secure/
            reloadSecuritySetting: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/nodes-apis/nodes-reload-secure/`,
            // https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-stats/
            nodeStats: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/nodes-apis/nodes-stats/`,
            // https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-usage/
            usage: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/nodes-apis/nodes-usage/`,
          },
          reIndex: {
            rethrottle: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/tasks/rethrottle/`,
          },
          apmServer: `${OPENSEARCH_WEBSITE_DOCS}`,
          tutorial: {
            loadDataTutorial: `${OPENSEARCH_WEBSITE_DOCS}/getting-started/quickstart/`,
            visualizeTutorial: `${OPENSEARCH_WEBSITE_DOCS}/dashboards/visualize/index/`,
          },
          scroll: {
            // https://opensearch.org/docs/latest/api-reference/search-apis/scroll/#step-3-close-the-scroll-context
            clear_scroll: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/scroll/#step-3-close-the-scroll-context`,
          },
          documentAPI: {
            // https://opensearch.org/docs/latest/api-reference/document-apis/delete-by-query/
            delete_by_query: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/delete-by-query/`,
            multiTermVector: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/mtermvectors/`,
            termVector: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/document-apis/termvector/`,
            // https://opensearch.org/docs/latest/api-reference/tasks/rethrottle/
            update_by_query_rethrottle: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/tasks/rethrottle/`,
          },
          filed_caps: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/field-caps/`,
          // https://opensearch.org/docs/latest/api-reference/script-apis/exec-script/
          painless_execute: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/script-apis/exec-script/`,
          search: {
            // https://opensearch.org/docs/latest/api-reference/search-apis/search/
            search: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search/`,
            searchRankEval: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/rank-eval/`,
            searchShards: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/search-shards/`,
            searchFieldCap: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/search-apis/field-caps/`,
          },
          snapshot: {
            // https://opensearch.org/docs/latest/api-reference/snapshots/delete-snapshot/
            deleteSnapshot: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/snapshots/delete-snapshot/`,
            // https://opensearch.org/docs/latest/api-reference/snapshots/delete-snapshot-repository/
            deleteRepository: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/snapshots/delete-snapshot-repository/`,
            cleanup: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/snapshots/cleanup-snapshot-repository/`,
            // https://opensearch.org/docs/latest/api-reference/snapshots/verify-snapshot-repository/
            veirfyRepository: `${OPENSEARCH_WEBSITE_DOCS}/api-reference/snapshots/verify-snapshot-repository/`,
          },
          lucene: {
            // https://opensearch.org/docs/latest/query-dsl/full-text/query-string/
            base: `${OPENSEARCH_WEBSITE_DOCS}/query-dsl/full-text/query-string/`,
          },
          ppl: {
            // https://opensearch.org/docs/latest/sql-and-ppl/ppl/commands/syntax/
            base: `${OPENSEARCH_WEBSITE_DOCS}/sql-and-ppl/ppl/commands/syntax/`,
          },
          sql: {
            // https://opensearch.org/docs/latest/sql-and-ppl/sql/basic/
            base: `${OPENSEARCH_WEBSITE_DOCS}/sql-and-ppl/sql/basic/`,
          },
          sqlPplLimitation: {
            // https://opensearch.org/docs/latest/sql-and-ppl/limitation/
            base: `${OPENSEARCH_WEBSITE_DOCS}/sql-and-ppl/limitation/`,
          },
          // Landing pages for each language, as opposed to the `ppl` and `sql` entries
          // above, which point at a syntax reference and a tutorial respectively.
          sqlPplIndex: {
            // https://opensearch.org/docs/latest/sql-and-ppl/
            base: `${OPENSEARCH_WEBSITE_DOCS}/sql-and-ppl/`,
            // https://opensearch.org/docs/latest/sql-and-ppl/ppl/index/
            ppl: `${OPENSEARCH_WEBSITE_DOCS}/sql-and-ppl/ppl/index/`,
            // https://opensearch.org/docs/latest/sql-and-ppl/sql/index/
            sql: `${OPENSEARCH_WEBSITE_DOCS}/sql-and-ppl/sql/index/`,
          },
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
      readonly restAPI: {
        readonly base: string;
        readonly indexAPI: {
          readonly base: string;
          readonly create: string;
          readonly exists: string;
          readonly delete: string;
          readonly get: string;
          readonly close: string;
        };
      };
      readonly dateMath: string;
      readonly openSearchForum: string;
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
      readonly browser: string;
      readonly dataSource: {
        readonly guide: string;
        readonly s3DataSource: string;
      };
      readonly visualize: Record<string, string>;
      readonly dashboards: Record<string, string>;
      readonly management: Record<string, string>;
      readonly workspace: Record<string, string>;
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
      readonly addData: string;
      readonly vega: string;
      readonly savedObject: {
        readonly manageSavedObject: string;
      };
      readonly clusterAPI: {
        readonly clusterRoute: string;
        readonly clusterState: string;
        readonly clusterStats: string;
        readonly clusterPending: string;
      };
      readonly mappingTypes: string;
      readonly moduleScripting: string;
      readonly ingest: {
        readonly appendProcessor: string;
        readonly bytesProcessor: string;
        readonly ingestCircleProcessor: string;
        readonly csvProcessor: string;
        readonly convertProcessor: string;
        readonly dataProcessor: string;
        readonly dataIndexNamProcessor: string;
        readonly dissectProcessor: string;
        readonly dotExpandProcessor: string;
        readonly dropProcessor: string;
        readonly failProcessor: string;
        readonly foreachProcessor: string;
        readonly geoIPProcessor: string;
        readonly grokProcessor: string;
        readonly gusbProcessor: string;
        readonly htmlstripProcessor: string;
        readonly inferenceProcessor: string;
        readonly joinProcessor: string;
        readonly jsonProcessor: string;
        readonly kvProcessor: string;
        readonly lowecaseProcessor: string;
        readonly pipelineProcessor: string;
        readonly removeProcessor: string;
        readonly renameProcessor: string;
        readonly scriptProcessor: string;
        readonly setProcessor: string;
        readonly securityUserProcessor: string;
        readonly splitProcessor: string;
        readonly sortProcessor: string;
        readonly trimProcessor: string;
        readonly uppercaseProcessor: string;
        readonly urldecodeProcessor: string;
        readonly userAgentProcessor: string;
      };
      readonly indexAPI: {
        readonly indexAnalyze: string;
        readonly indexClearCache: string;
        readonly indexClone: string;
        readonly indexSynced: string;
        readonly indexFlush: string;
        readonly indexForceMerge: string;
        readonly indexSetting: string;
        readonly indexUpgrade: string;
        readonly indexUpdateSetting: string;
        readonly indexRecovery: string;
        readonly indexRefresh: string;
        readonly indexRollover: string;
        readonly indexSegment: string;
        readonly indexShardStore: string;
        readonly indexShrink: string;
        readonly indexSplit: string;
        readonly indexStats: string;
      };
      readonly nodes: {
        readonly info: string;
        readonly hotThreads: string;
        readonly reloadSecuritySetting: string;
        readonly nodeStats: string;
        readonly usage: string;
      };
      readonly reIndex: {
        readonly rethrottle: string;
      };
      readonly apmServer: string;
      readonly tutorial: {
        readonly loadDataTutorial: string;
        readonly visualizeTutorial: string;
      };
      readonly scroll: {
        readonly clear_scroll: string;
      };
      readonly documentAPI: {
        readonly delete_by_query: string;
        readonly multiTermVector: string;
        readonly termVector: string;
        readonly update_by_query_rethrottle: string;
      };
      readonly filed_caps: string;
      readonly painless_execute: string;
      readonly search: {
        readonly search: string;
        readonly searchRankEval: string;
        readonly searchShards: string;
        readonly searchFieldCap: string;
      };
      readonly snapshot: {
        readonly deleteSnapshot: string;
        readonly deleteRepository: string;
        readonly cleanup: string;
        readonly veirfyRepository: string;
      };
      readonly lucene: {
        readonly base: string;
      };
      readonly sql: {
        readonly base: string;
      };
      readonly ppl: {
        readonly base: string;
      };
      readonly sqlPplLimitation: {
        readonly base: string;
      };
      readonly sqlPplIndex: {
        readonly base: string;
        readonly ppl: string;
        readonly sql: string;
      };
    };
  };
}
