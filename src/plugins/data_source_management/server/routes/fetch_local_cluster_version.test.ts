/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock, httpServerMock } from '../../../../../core/server/mocks';
import { registerLocalClusterVersionRoute } from './fetch_local_cluster_version';

describe('fetch_local_cluster_version route', () => {
  let router: ReturnType<typeof httpServiceMock.createRouter>;
  let mockContext: any;
  let mockResponse: ReturnType<typeof httpServerMock.createResponseFactory>;

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    mockResponse = httpServerMock.createResponseFactory();
    mockContext = {
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              info: jest.fn(),
            },
          },
        },
      },
    };
    registerLocalClusterVersionRoute(router);
  });

  it('registers GET /internal/data-source-management/localClusterVersion', () => {
    expect(router.get).toHaveBeenCalledTimes(1);
    expect(router.get.mock.calls[0][0].path).toBe(
      '/internal/data-source-management/localClusterVersion'
    );
  });

  it('returns cluster version on success', async () => {
    mockContext.core.opensearch.client.asCurrentUser.info.mockResolvedValue({
      body: { version: { number: '2.11.0' } },
    });

    const handler = router.get.mock.calls[0][1];
    await handler(mockContext, httpServerMock.createOpenSearchDashboardsRequest(), mockResponse);

    expect(mockResponse.ok).toHaveBeenCalledWith({ body: { version: '2.11.0' } });
  });

  it('returns empty version on failure', async () => {
    mockContext.core.opensearch.client.asCurrentUser.info.mockRejectedValue(
      new Error('connection refused')
    );

    const handler = router.get.mock.calls[0][1];
    await handler(mockContext, httpServerMock.createOpenSearchDashboardsRequest(), mockResponse);

    expect(mockResponse.ok).toHaveBeenCalledWith({ body: { version: '' } });
  });
});
