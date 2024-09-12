/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { coreMock } from '../../../../core/server/mocks';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { RequestHandlerContext } from '../../../../core/server';
import { IOpenSearchSearchRequest } from '../../../data/common';
import { decideClient, decideLegacyClient } from './decide_client';

const context: RequestHandlerContext = {
  core: {
    ...coreMock.createRequestHandlerContext(),
  },
  dataSource: {
    opensearch: {
      getClient: jest.fn(),
      legacy: {
        getClient: jest.fn(),
      },
    },
  },
};

describe('decideClient', () => {
  const request: IOpenSearchSearchRequest = {
    dataSourceId: 'dataSourceId',
  };

  it('should return defaultOpenSearchClient when dataSourceId is not provided', async () => {
    const result = await decideClient(context, { ...request, dataSourceId: undefined });
    expect(result).toBe(context.core.opensearch.client.asCurrentUser);
  });

  it('should return defaultOpenSearchClientWithLongNumeralsSupport when withLongNumeralsSupport is true', async () => {
    const result = await decideClient(context, { ...request, dataSourceId: undefined }, true);
    expect(result).toBe(context.core.opensearch.client.asCurrentUserWithLongNumeralsSupport);
  });

  it('should return client from dataSource when dataSourceId is provided', async () => {
    const dataSourceClient = jest.fn();
    (context.dataSource.opensearch.getClient as jest.Mock).mockResolvedValueOnce(dataSourceClient);

    const result = await decideClient(context, request);
    expect(result).toBe(dataSourceClient);
    expect(context.dataSource.opensearch.getClient).toHaveBeenCalledWith(request.dataSourceId);
  });
});

describe('decideLegacyClient', () => {
  const request = {
    query: {
      data_source: 'dataSourceId',
    },
  };

  it('should return callAsCurrentUser when dataSourceId is not provided', async () => {
    const result = await decideLegacyClient(context, { ...request, query: {} });
    expect(result).toBe(context.core.opensearch.legacy.client.callAsCurrentUser);
  });

  it('should return legacy client from dataSource when dataSourceId is provided', async () => {
    const dataSourceClient = jest.fn();
    (context.dataSource.opensearch.legacy.getClient as jest.Mock).mockReturnValueOnce({
      callAPI: dataSourceClient,
    });

    const result = await decideLegacyClient(context, request);
    expect(result).toBe(dataSourceClient);
    expect(context.dataSource.opensearch.legacy.getClient).toHaveBeenCalledWith(
      request.query.data_source
    );
  });
});
