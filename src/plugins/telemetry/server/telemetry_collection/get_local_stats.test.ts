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

import { merge, omit } from 'lodash';

import { getLocalStats, handleLocalStats } from './get_local_stats';
import { usageCollectionPluginMock } from '../../../usage_collection/server/mocks';
import { opensearchServiceMock } from '../../../../../src/core/server/mocks';

function mockUsageCollection(opensearchDashboardsUsage = {}) {
  const usageCollection = usageCollectionPluginMock.createSetupContract();
  usageCollection.bulkFetch = jest.fn().mockResolvedValue(opensearchDashboardsUsage);
  usageCollection.toObject = jest.fn().mockImplementation((data: any) => data);
  return usageCollection;
}
// set up successful call mocks for info, cluster stats, nodes usage and data telemetry
function mockGetLocalStats(clusterInfo: any, clusterStats: any) {
  const opensearchClient = opensearchServiceMock.createClusterClient().asInternalUser;
  opensearchClient.info
    // @ts-ignore we only care about the response body
    .mockResolvedValue(
      // @ts-ignore we only care about the response body
      {
        body: { ...clusterInfo },
      }
    );
  opensearchClient.cluster.stats
    // @ts-ignore we only care about the response body
    .mockResolvedValue({ body: { ...clusterStats } });
  opensearchClient.nodes.usage.mockResolvedValue(
    // @ts-ignore we only care about the response body
    {
      body: {
        cluster_name: 'testCluster',
        nodes: {
          some_node_id: {
            timestamp: 1588617023177,
            since: 1588616945163,
            rest_actions: {
              nodes_usage_action: 1,
              create_index_action: 1,
              document_get_action: 1,
              search_action: 19,
              nodes_info_action: 36,
            },
            aggregations: {
              terms: {
                bytes: 2,
              },
              scripted_metric: {
                other: 7,
              },
            },
          },
        },
      },
    }
  );
  // @ts-ignore we only care about the response body
  opensearchClient.indices.getMapping.mockResolvedValue({ body: { mappings: {} } });
  // @ts-ignore we only care about the response body
  opensearchClient.indices.stats.mockResolvedValue({ body: { indices: {} } });
  return opensearchClient;
}

describe('get_local_stats', () => {
  const clusterUuid = 'abc123';
  const clusterName = 'my-cool-cluster';
  const version = '2.3.4';
  const clusterInfo = {
    cluster_uuid: clusterUuid,
    cluster_name: clusterName,
    version: { number: version },
  };
  const nodesUsage = [
    {
      node_id: 'some_node_id',
      timestamp: 1588617023177,
      since: 1588616945163,
      rest_actions: {
        nodes_usage_action: 1,
        create_index_action: 1,
        document_get_action: 1,
        search_action: 19,
        nodes_info_action: 36,
      },
      aggregations: {
        terms: {
          bytes: 2,
        },
        scripted_metric: {
          other: 7,
        },
      },
    },
  ];
  const clusterStats = {
    _nodes: { failed: 123 },
    cluster_name: 'real-cool',
    indices: { totally: 456 },
    nodes: { yup: 'abc' },
    random: 123,
  };

  const opensearchDashboards = {
    opensearch_dashboards: {
      great: 'googlymoogly',
      versions: [{ version: '8675309', count: 1 }],
    },
    opensearch_dashboards_stats: {
      os: {
        platform: 'rocky',
        platformRelease: 'iv',
      },
    },
    localization: {
      locale: 'en',
      labelsCount: 0,
      integrities: {},
    },
    sun: { chances: 5 },
    clouds: { chances: 95 },
    rain: { chances: 2 },
    snow: { chances: 0 },
  };

  const clusterStatsWithNodesUsage = {
    ...clusterStats,
    nodes: merge(clusterStats.nodes, { usage: { nodes: nodesUsage } }),
  };

  const combinedStatsResult = {
    collection: 'local',
    cluster_uuid: clusterUuid,
    cluster_name: clusterName,
    version,
    cluster_stats: omit(clusterStatsWithNodesUsage, '_nodes', 'cluster_name'),
    stack_stats: {
      opensearch_dashboards: {
        great: 'googlymoogly',
        count: 1,
        indices: 1,
        os: {
          platforms: [{ platform: 'rocky', count: 1 }],
          platformReleases: [{ platformRelease: 'iv', count: 1 }],
        },
        versions: [{ version: '8675309', count: 1 }],
        plugins: {
          localization: {
            locale: 'en',
            labelsCount: 0,
            integrities: {},
          },
          sun: { chances: 5 },
          clouds: { chances: 95 },
          rain: { chances: 2 },
          snow: { chances: 0 },
        },
      },
    },
  };

  const context = {
    logger: console,
    version: '8.0.0',
  };

  describe('handleLocalStats', () => {
    it('returns expected object without OpenSearch Dashboards data', () => {
      const result = handleLocalStats(
        clusterInfo,
        clusterStatsWithNodesUsage,
        void 0,
        void 0,
        context
      );
      expect(result.cluster_uuid).toStrictEqual(combinedStatsResult.cluster_uuid);
      expect(result.cluster_name).toStrictEqual(combinedStatsResult.cluster_name);
      expect(result.cluster_stats).toStrictEqual(combinedStatsResult.cluster_stats);
      expect(result.version).toEqual('2.3.4');
      expect(result.collection).toEqual('local');
      expect(Object.keys(result)).not.toContain('license');
      expect(result.stack_stats).toEqual({ opensearch_dashboards: undefined, data: undefined });
    });
  });

  describe('getLocalStats', () => {
    it('returns expected object with OpenSearch Dashboards data', async () => {
      const callCluster = jest.fn();
      const usageCollection = mockUsageCollection(opensearchDashboards);
      const opensearchClient = mockGetLocalStats(clusterInfo, clusterStats);
      const response = await getLocalStats(
        [{ clusterUuid: 'abc123' }],
        { callCluster, usageCollection, opensearchClient, start: '', end: '' },
        context
      );
      const result = response[0];
      expect(result.cluster_uuid).toEqual(combinedStatsResult.cluster_uuid);
      expect(result.cluster_name).toEqual(combinedStatsResult.cluster_name);
      expect(result.cluster_stats).toEqual(combinedStatsResult.cluster_stats);
      expect(result.cluster_stats.nodes).toEqual(combinedStatsResult.cluster_stats.nodes);
      expect(result.version).toBe('2.3.4');
      expect(result.collection).toBe('local');
      expect(Object.keys(result).indexOf('license')).toBeLessThan(0);
      expect(Object.keys(result.stack_stats).indexOf('xpack')).toBeLessThan(0);
    });

    it('returns an empty array when no cluster uuid is provided', async () => {
      const callCluster = jest.fn();
      const usageCollection = mockUsageCollection(opensearchDashboards);
      const opensearchClient = mockGetLocalStats(clusterInfo, clusterStats);
      const response = await getLocalStats(
        [],
        { callCluster, usageCollection, opensearchClient, start: '', end: '' },
        context
      );
      expect(response).toBeDefined();
      expect(response.length).toEqual(0);
    });
  });
});
