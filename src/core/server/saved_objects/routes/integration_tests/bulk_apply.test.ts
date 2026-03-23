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

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { registerBulkApplyRoute } from '../bulk_apply';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('POST /api/saved_objects/_bulk_apply', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerBulkApplyRoute(router);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('creates new objects that do not exist', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-pattern',
          type: 'index-pattern',
          error: { statusCode: 404, message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.create.mockResolvedValue({
      id: 'new-pattern',
      type: 'index-pattern',
      attributes: { title: 'logstash-*' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'new-pattern',
            attributes: { title: 'logstash-*' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toEqual([
      { type: 'index-pattern', id: 'new-pattern', status: 'created' },
    ]);
    expect(savedObjectsClient.create).toHaveBeenCalledTimes(1);
  });

  it('updates existing objects with changed attributes', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-pattern',
          type: 'index-pattern',
          attributes: { title: 'old-title' },
          references: [],
        },
      ],
    });
    savedObjectsClient.update.mockResolvedValue({
      id: 'existing-pattern',
      type: 'index-pattern',
      attributes: { title: 'new-title' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'existing-pattern',
            attributes: { title: 'new-title' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toEqual([
      { type: 'index-pattern', id: 'existing-pattern', status: 'updated' },
    ]);
    expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
  });

  it('returns unchanged for existing objects with identical attributes', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-pattern',
          type: 'index-pattern',
          attributes: { title: 'logstash-*' },
          references: [],
        },
      ],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'existing-pattern',
            attributes: { title: 'logstash-*' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toEqual([
      { type: 'index-pattern', id: 'existing-pattern', status: 'unchanged' },
    ]);
    expect(savedObjectsClient.create).not.toHaveBeenCalled();
    expect(savedObjectsClient.update).not.toHaveBeenCalled();
  });

  it('handles mixed create and update operations', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-1',
          type: 'index-pattern',
          attributes: { title: 'old-title' },
          references: [],
        },
        {
          id: 'new-1',
          type: 'search',
          error: { statusCode: 404, message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.update.mockResolvedValue({
      id: 'existing-1',
      type: 'index-pattern',
      attributes: { title: 'new-title' },
      references: [],
    });
    savedObjectsClient.create.mockResolvedValue({
      id: 'new-1',
      type: 'search',
      attributes: { title: 'My Search' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'existing-1',
            attributes: { title: 'new-title' },
          },
          {
            type: 'search',
            id: 'new-1',
            attributes: { title: 'My Search' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toHaveLength(2);
    expect(result.body.results).toEqual(
      expect.arrayContaining([
        { type: 'index-pattern', id: 'existing-1', status: 'updated' },
        { type: 'search', id: 'new-1', status: 'created' },
      ])
    );
  });

  it('dry run mode does not persist changes', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-1',
          type: 'index-pattern',
          error: { statusCode: 404, message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'new-1',
            attributes: { title: 'logstash-*' },
          },
        ],
        options: { dryRun: true },
      })
      .expect(200);

    expect(result.body.results).toEqual([
      { type: 'index-pattern', id: 'new-1', status: 'created' },
    ]);
    // In dry run mode, no create or update calls should be made
    expect(savedObjectsClient.create).not.toHaveBeenCalled();
    expect(savedObjectsClient.update).not.toHaveBeenCalled();
  });

  it('handles partial failures gracefully', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'good-1',
          type: 'index-pattern',
          error: { statusCode: 404, message: 'Not found' },
          attributes: {},
          references: [],
        },
        {
          id: 'bad-1',
          type: 'search',
          error: { statusCode: 404, message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.create.mockImplementation(async (type) => {
      if (type === 'search') {
        throw new Error('Permission denied');
      }
      return {
        id: 'good-1',
        type: 'index-pattern',
        attributes: { title: 'logstash-*' },
        references: [],
      };
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'good-1',
            attributes: { title: 'logstash-*' },
          },
          {
            type: 'search',
            id: 'bad-1',
            attributes: { title: 'My Search' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toHaveLength(2);
    expect(result.body.results[0]).toEqual({
      type: 'index-pattern',
      id: 'good-1',
      status: 'created',
    });
    expect(result.body.results[1]).toEqual({
      type: 'search',
      id: 'bad-1',
      status: 'error',
      error: 'Permission denied',
    });
  });

  it('preserves references when creating objects', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-search',
          type: 'search',
          error: { statusCode: 404, message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.create.mockResolvedValue({
      id: 'new-search',
      type: 'search',
      attributes: { title: 'My Search' },
      references: [{ name: 'ref_0', type: 'index-pattern', id: 'logstash-*' }],
    });

    const refs = [{ name: 'ref_0', type: 'index-pattern', id: 'logstash-*' }];

    await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'search',
            id: 'new-search',
            attributes: { title: 'My Search' },
            references: refs,
          },
        ],
      })
      .expect(200);

    expect(savedObjectsClient.create).toHaveBeenCalledWith(
      'search',
      { title: 'My Search' },
      expect.objectContaining({ references: refs })
    );
  });

  it('returns error when overwrite is disabled and object exists', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-1',
          type: 'index-pattern',
          attributes: { title: 'old-title' },
          references: [],
        },
      ],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_bulk_apply')
      .send({
        resources: [
          {
            type: 'index-pattern',
            id: 'existing-1',
            attributes: { title: 'new-title' },
          },
        ],
        options: { overwrite: false },
      })
      .expect(200);

    expect(result.body.results).toEqual([
      {
        type: 'index-pattern',
        id: 'existing-1',
        status: 'error',
        error: 'Object already exists and overwrite is disabled',
      },
    ]);
  });
});
