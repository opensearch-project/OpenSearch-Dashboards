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
import { registerSchemasRoute } from '../schemas';
import { registerSchema } from '../validate';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('GET /api/saved_objects/_schemas', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];

  beforeEach(async () => {
    ({ server, httpSetup } = await setupServer());

    // Register some schemas for testing
    registerSchema('index-pattern', '1.0.0', {
      type: 'object',
      properties: {
        title: { type: 'string' },
      },
      required: ['title'],
    });
    registerSchema('index-pattern', '2.0.0', {
      type: 'object',
      properties: {
        title: { type: 'string' },
        timeFieldName: { type: 'string' },
      },
      required: ['title'],
    });
    registerSchema('dashboard', '1.0.0', {
      type: 'object',
      properties: {
        title: { type: 'string' },
        panelsJSON: { type: 'string' },
      },
      required: ['title'],
    });

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerSchemasRoute(router);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('lists all registered schemas', async () => {
    const result = await supertest(httpSetup.server.listener)
      .get('/api/saved_objects/_schemas')
      .expect(200);

    expect(result.body).toHaveProperty('index-pattern');
    expect(result.body).toHaveProperty('dashboard');
    expect(result.body['index-pattern']).toHaveProperty('1.0.0');
    expect(result.body['index-pattern']).toHaveProperty('2.0.0');
    expect(result.body['dashboard']).toHaveProperty('1.0.0');
  });

  it('returns a specific schema by type and version', async () => {
    const result = await supertest(httpSetup.server.listener)
      .get('/api/saved_objects/_schemas/index-pattern/1.0.0')
      .expect(200);

    expect(result.body).toEqual({
      type: 'object',
      properties: {
        title: { type: 'string' },
      },
      required: ['title'],
    });
  });

  it('returns a different version of the same type', async () => {
    const result = await supertest(httpSetup.server.listener)
      .get('/api/saved_objects/_schemas/index-pattern/2.0.0')
      .expect(200);

    expect(result.body).toEqual({
      type: 'object',
      properties: {
        title: { type: 'string' },
        timeFieldName: { type: 'string' },
      },
      required: ['title'],
    });
  });

  it('returns 404 for unknown schema type', async () => {
    const result = await supertest(httpSetup.server.listener)
      .get('/api/saved_objects/_schemas/unknown-type/1.0.0')
      .expect(404);

    expect(result.body.message).toContain('Schema not found');
  });

  it('returns 404 for unknown schema version', async () => {
    const result = await supertest(httpSetup.server.listener)
      .get('/api/saved_objects/_schemas/index-pattern/99.0.0')
      .expect(404);

    expect(result.body.message).toContain('Schema not found');
  });
});
