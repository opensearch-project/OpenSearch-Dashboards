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
import { SavedObjectConfig } from '../../saved_objects_config';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

const config = {
  maxImportExportSize: 10000,
  maxImportPayloadBytes: 26214400,
} as SavedObjectConfig;

describe('POST /api/saved_objects/_bulk_apply', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerBulkApplyRoute(router, config);

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
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.bulkCreate.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-pattern',
          type: 'index-pattern',
          attributes: { title: 'logstash-*', labels: { 'managed-by': 'osdctl' } },
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
            id: 'new-pattern',
            attributes: { title: 'logstash-*' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toEqual([
      { type: 'index-pattern', id: 'new-pattern', status: 'created' },
    ]);
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: 'index-pattern',
          id: 'new-pattern',
          attributes: { title: 'logstash-*', labels: { 'managed-by': 'osdctl' } },
        }),
      ],
      { overwrite: true }
    );
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
    savedObjectsClient.bulkCreate.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-pattern',
          type: 'index-pattern',
          attributes: { title: 'new-title', labels: { 'managed-by': 'osdctl' } },
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
            attributes: { title: 'new-title' },
          },
        ],
      })
      .expect(200);

    expect(result.body.results).toEqual([
      { type: 'index-pattern', id: 'existing-pattern', status: 'updated' },
    ]);
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: 'index-pattern',
          id: 'existing-pattern',
          attributes: { title: 'new-title', labels: { 'managed-by': 'osdctl' } },
        }),
      ],
      { overwrite: true }
    );
  });

  it('returns unchanged for existing objects with identical attributes', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-pattern',
          type: 'index-pattern',
          attributes: { title: 'logstash-*', labels: { 'managed-by': 'osdctl' } },
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
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
  });

  it('handles mixed create and update operations using bulkCreate', async () => {
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
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.bulkCreate.mockResolvedValue({
      saved_objects: [
        {
          id: 'existing-1',
          type: 'index-pattern',
          attributes: { title: 'new-title', labels: { 'managed-by': 'osdctl' } },
          references: [],
        },
        {
          id: 'new-1',
          type: 'search',
          attributes: { title: 'My Search', labels: { 'managed-by': 'osdctl' } },
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
    // Both writes should be in a single bulkCreate call
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'index-pattern', id: 'existing-1' }),
        expect.objectContaining({ type: 'search', id: 'new-1' }),
      ]),
      { overwrite: true }
    );
  });

  it('dry run mode does not persist changes', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-1',
          type: 'index-pattern',
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
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
    // In dry run mode, no bulkCreate calls should be made
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
  });

  it('returns 400 atomically when overwrite is disabled and object exists', async () => {
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
      .expect(400);

    expect(result.body.message).toBe('Apply failed: one or more resources had errors');
    expect(result.body.attributes.results).toEqual([
      {
        type: 'index-pattern',
        id: 'existing-1',
        status: 'error',
        error: 'Object already exists and overwrite is disabled',
      },
    ]);
    // No writes should happen when there are errors (atomic)
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
  });

  it('does not write any objects if any resource has an overwrite conflict (atomic)', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-1',
          type: 'index-pattern',
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
          attributes: {},
          references: [],
        },
        {
          id: 'existing-1',
          type: 'search',
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
            id: 'new-1',
            attributes: { title: 'logstash-*' },
          },
          {
            type: 'search',
            id: 'existing-1',
            attributes: { title: 'new-title' },
          },
        ],
        options: { overwrite: false },
      })
      .expect(400);

    // Even though new-1 would be a valid create, the entire batch fails atomically
    expect(result.body.message).toBe('Apply failed: one or more resources had errors');
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
  });

  it('preserves references when creating objects via bulkCreate', async () => {
    const refs = [{ name: 'ref_0', type: 'index-pattern', id: 'logstash-*' }];

    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-search',
          type: 'search',
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.bulkCreate.mockResolvedValue({
      saved_objects: [
        {
          id: 'new-search',
          type: 'search',
          attributes: { title: 'My Search', labels: { 'managed-by': 'osdctl' } },
          references: refs,
        },
      ],
    });

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

    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: 'search',
          id: 'new-search',
          references: refs,
        }),
      ],
      { overwrite: true }
    );
  });

  describe('dependency resolution', () => {
    it('orders resources so dependencies are created before dependents', async () => {
      // Dashboard depends on visualization, but dashboard is listed first in the request
      savedObjectsClient.bulkGet.mockResolvedValue({
        saved_objects: [
          {
            id: 'vis-1',
            type: 'visualization',
            error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
            attributes: {},
            references: [],
          },
          {
            id: 'dash-1',
            type: 'dashboard',
            error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
            attributes: {},
            references: [],
          },
        ],
      });
      savedObjectsClient.bulkCreate.mockResolvedValue({
        saved_objects: [
          {
            id: 'vis-1',
            type: 'visualization',
            attributes: { title: 'My Vis', labels: { 'managed-by': 'osdctl' } },
            references: [],
          },
          {
            id: 'dash-1',
            type: 'dashboard',
            attributes: { title: 'My Dashboard', labels: { 'managed-by': 'osdctl' } },
            references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
          },
        ],
      });

      const result = await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/_bulk_apply')
        .send({
          resources: [
            {
              type: 'dashboard',
              id: 'dash-1',
              attributes: { title: 'My Dashboard' },
              references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
            },
            {
              type: 'visualization',
              id: 'vis-1',
              attributes: { title: 'My Vis' },
            },
          ],
        })
        .expect(200);

      expect(result.body.results).toHaveLength(2);
      // bulkCreate should be called with visualization before dashboard (dependency order)
      const bulkCreateArgs = savedObjectsClient.bulkCreate.mock.calls[0][0];
      const visIndex = bulkCreateArgs.findIndex(
        (obj: any) => obj.type === 'visualization' && obj.id === 'vis-1'
      );
      const dashIndex = bulkCreateArgs.findIndex(
        (obj: any) => obj.type === 'dashboard' && obj.id === 'dash-1'
      );
      expect(visIndex).toBeLessThan(dashIndex);
    });

    it('returns 400 when circular dependencies are detected', async () => {
      const result = await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/_bulk_apply')
        .send({
          resources: [
            {
              type: 'visualization',
              id: 'vis-a',
              attributes: { title: 'Vis A' },
              references: [{ name: 'ref_0', type: 'visualization', id: 'vis-b' }],
            },
            {
              type: 'visualization',
              id: 'vis-b',
              attributes: { title: 'Vis B' },
              references: [{ name: 'ref_0', type: 'visualization', id: 'vis-a' }],
            },
          ],
        })
        .expect(400);

      expect(result.body.message).toBe('Circular dependency detected among resources');
      expect(result.body.attributes.circular).toEqual(expect.arrayContaining(['vis-a', 'vis-b']));
      expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
    });

    it('passes through resources with no dependencies in their original order', async () => {
      savedObjectsClient.bulkGet.mockResolvedValue({
        saved_objects: [
          {
            id: 'ip-1',
            type: 'index-pattern',
            error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
            attributes: {},
            references: [],
          },
          {
            id: 'ip-2',
            type: 'index-pattern',
            error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
            attributes: {},
            references: [],
          },
        ],
      });
      savedObjectsClient.bulkCreate.mockResolvedValue({
        saved_objects: [
          {
            id: 'ip-1',
            type: 'index-pattern',
            attributes: { title: 'pattern-1', labels: { 'managed-by': 'osdctl' } },
            references: [],
          },
          {
            id: 'ip-2',
            type: 'index-pattern',
            attributes: { title: 'pattern-2', labels: { 'managed-by': 'osdctl' } },
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
              id: 'ip-1',
              attributes: { title: 'pattern-1' },
            },
            {
              type: 'index-pattern',
              id: 'ip-2',
              attributes: { title: 'pattern-2' },
            },
          ],
        })
        .expect(200);

      expect(result.body.results).toHaveLength(2);
      expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
      const bulkCreateArgs = savedObjectsClient.bulkCreate.mock.calls[0][0];
      expect(bulkCreateArgs[0]).toEqual(expect.objectContaining({ id: 'ip-1' }));
      expect(bulkCreateArgs[1]).toEqual(expect.objectContaining({ id: 'ip-2' }));
    });
  });

  it('handles bulkCreate per-object errors', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'good-1',
          type: 'index-pattern',
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
          attributes: {},
          references: [],
        },
        {
          id: 'bad-1',
          type: 'search',
          error: { statusCode: 404, error: 'Not Found', message: 'Not found' },
          attributes: {},
          references: [],
        },
      ],
    });
    savedObjectsClient.bulkCreate.mockResolvedValue({
      saved_objects: [
        {
          id: 'good-1',
          type: 'index-pattern',
          attributes: { title: 'logstash-*', labels: { 'managed-by': 'osdctl' } },
          references: [],
        },
        {
          id: 'bad-1',
          type: 'search',
          attributes: {},
          references: [],
          error: { statusCode: 403, error: 'Forbidden', message: 'Permission denied' },
        },
      ],
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
});
