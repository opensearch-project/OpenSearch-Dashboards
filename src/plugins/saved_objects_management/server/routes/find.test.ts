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

import { registerFindRoute } from './find';
import { ISavedObjectsManagement } from '../services';
import { managementMock } from '../services/management.mock';
import { IRouter } from 'src/core/server';
import { httpServiceMock } from '../../../../core/server/mocks';

describe('Find route', () => {
  let router: jest.Mocked<IRouter>;
  let managementService: jest.Mocked<ISavedObjectsManagement>;
  let context: any;
  let req: any;
  let res: any;

  beforeAll(() => {
    router = httpServiceMock.createRouter();

    // Mock management service
    managementService = managementMock.create();

    // Mock context with savedObjects client
    const savedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
    };

    context = {
      core: {
        savedObjects: {
          client: savedObjectsClient,
        },
      },
    };

    // Mock request
    req = {
      query: {
        perPage: 20,
        page: 1,
        type: 'test-type',
        fields: ['field1', 'field2'],
      },
    };

    // Mock response
    res = {
      ok: jest.fn(),
    };
  });

  it('should register GET route with correct path', () => {
    registerFindRoute(router, Promise.resolve(managementService));

    expect(router.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/opensearch-dashboards/management/saved_objects/_find',
      }),
      expect.any(Function)
    );
  });

  it('should handle basic find request', async () => {
    registerFindRoute(router, Promise.resolve(managementService));

    const findResponse = {
      saved_objects: [
        {
          type: 'test-type',
          id: '1',
          attributes: {
            field1: 'value1',
            field2: 'value2',
          },
        },
      ],
      total: 1,
      per_page: 20,
      page: 1,
    };

    context.core.savedObjects.client.find.mockResolvedValue(findResponse);

    const handler = router.get.mock.calls[0][1];
    await handler(context, req, res);

    expect(context.core.savedObjects.client.find).toHaveBeenCalledWith(
      expect.objectContaining({
        perPage: 20,
        page: 1,
        type: 'test-type',
      })
    );
    expect(res.ok).toHaveBeenCalled();
  });

  it('should handle index-pattern type correctly', async () => {
    registerFindRoute(router, Promise.resolve(managementService));

    const findResponse = {
      saved_objects: [
        {
          type: 'index-pattern',
          id: '1',
          attributes: {
            title: 'test-pattern',
          },
          references: [],
        },
      ],
      total: 1,
      per_page: 20,
      page: 1,
    };

    context.core.savedObjects.client.find.mockResolvedValue(findResponse);
    context.core.savedObjects.client.get.mockResolvedValue({ attributes: {} });

    const handler = router.get.mock.calls[0][1];
    await handler(context, req, res);

    expect(context.core.savedObjects.client.find).toHaveBeenCalled();
    expect(res.ok).toHaveBeenCalled();
  });

  it('should handle workspace filtering', async () => {
    registerFindRoute(router, Promise.resolve(managementService));

    req.query.workspaces = ['workspace1'];

    const findResponse = {
      saved_objects: [],
      total: 0,
      per_page: 20,
      page: 1,
    };

    context.core.savedObjects.client.find.mockResolvedValue(findResponse);

    const handler = router.get.mock.calls[0][1];
    await handler(context, req, res);

    expect(context.core.savedObjects.client.find).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaces: ['workspace1'],
      })
    );
  });
});
