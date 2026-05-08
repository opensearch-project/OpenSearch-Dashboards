/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getRemoteClusterConnections,
  populateRemoteClusterConnectionForDatasources,
} from './get_remote_connections';
import { HttpSetup } from 'src/core/public';
import { OPENSEARCH_CROSS_CLUSTER_SEARCH } from '../constants';

describe('Remote Connections', () => {
  let mockHttp: jest.Mocked<HttpSetup>;

  beforeEach(() => {
    mockHttp = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpSetup>;
  });

  describe('getRemoteClusterConnections', () => {
    const mockDataSource = {
      id: 'test-datasource',
      engine: OPENSEARCH_CROSS_CLUSTER_SEARCH,
      datasourceversion: '2.0.0',
      installedplugins: [],
    };

    it('should return remote cluster connections when API call is successful', async () => {
      const mockResponse = [
        { connectionAlias: 'remote-cluster-1' },
        { connectionAlias: 'remote-cluster-2' },
      ];

      mockHttp.get.mockResolvedValueOnce(mockResponse);

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = await getRemoteClusterConnections(mockDataSource, mockHttp);

      expect(mockHttp.get).toHaveBeenCalledWith('/api/enhancements/remote_cluster/list', {
        query: { dataSourceId: 'test-datasource' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'test-datasource-remote-cluster-1',
        title: 'remote-cluster-1',
        label: 'remote-cluster-1',
        type: 'Opensearch cross-cluster Search',
        engine: OPENSEARCH_CROSS_CLUSTER_SEARCH,
        parentId: 'test-datasource',
      });
    });

    it('should return empty array when API call fails', async () => {
      mockHttp.get.mockRejectedValueOnce(new Error('API Error'));

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = await getRemoteClusterConnections(mockDataSource, mockHttp);

      expect(result).toEqual([]);
    });
  });

  describe('populateRemoteClusterConnectionForDatasources', () => {
    const mockDataSources = [
      {
        id: 'ds-1',
        engine: 'OpenSearch',
        datasourceversion: '2.0.0',
        installedplugins: [],
      },
      {
        id: 'ds-2',
        engine: 'unsupported-engine',
        datasourceversion: '2.0.0',
        installedplugins: [],
      },
    ];

    it('should populate remote connections for supported data sources', async () => {
      const mockRemoteConnections = [
        { connectionAlias: 'remote-1' },
        { connectionAlias: 'remote-2' },
      ];

      mockHttp.get.mockResolvedValueOnce(mockRemoteConnections);
      mockHttp.get.mockResolvedValueOnce([]);

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = await populateRemoteClusterConnectionForDatasources(mockDataSources, mockHttp);

      expect(result).toHaveLength(2);
      expect(result[0].relatedDataSourceConnection).toHaveLength(2);
      expect(result[1].relatedDataSourceConnection).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      mockHttp.get.mockRejectedValue(new Error('API Error'));

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = await populateRemoteClusterConnectionForDatasources(mockDataSources, mockHttp);

      expect(result).toHaveLength(2);
      expect(result[0].relatedDataSourceConnection).toHaveLength(0);
      expect(result[1].relatedDataSourceConnection).toHaveLength(0);
    });
  });
});
