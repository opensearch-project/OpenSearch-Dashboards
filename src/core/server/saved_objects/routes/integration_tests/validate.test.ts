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
import { registerValidateRoute, registerSchema } from '../validate';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('POST /api/saved_objects/_validate', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    // Register a schema for 'index-pattern' type
    registerSchema('index-pattern', '1.0.0', {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1 },
        timeFieldName: { type: 'string' },
        intervalName: { type: 'string' },
      },
      required: ['title'],
      additionalProperties: false,
    });

    // Mock the type registry to recognize 'index-pattern'
    handlerContext.savedObjects.typeRegistry.getType.mockImplementation((type: string) => {
      if (type === 'index-pattern') {
        return {
          name: 'index-pattern',
          hidden: false,
          namespaceType: 'single' as const,
          mappings: { properties: {} },
        };
      }
      return undefined;
    });

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerValidateRoute(router);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('returns valid=true for a valid object', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'index-pattern',
        attributes: { title: 'logstash-*' },
      })
      .expect(200);

    expect(result.body.valid).toBe(true);
    expect(result.body.errors).toBeUndefined();
  });

  it('returns errors for invalid object with missing required fields', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'index-pattern',
        attributes: {},
      })
      .expect(200);

    expect(result.body.valid).toBe(false);
    expect(result.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'title',
          message: expect.stringContaining('Required field "title" is missing'),
        }),
      ])
    );
  });

  it('returns errors for invalid field types', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'index-pattern',
        attributes: { title: 123 },
      })
      .expect(200);

    expect(result.body.valid).toBe(false);
    expect(result.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'title',
          message: expect.stringContaining('Expected type string'),
        }),
      ])
    );
  });

  it('returns 400 for unknown type', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'unknown-type',
        attributes: { title: 'test' },
      })
      .expect(400);

    expect(result.body.message).toContain('Unknown saved object type');
  });

  it('returns errors for additional properties when not allowed', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'index-pattern',
        attributes: { title: 'logstash-*', unknownField: 'value' },
      })
      .expect(200);

    expect(result.body.valid).toBe(false);
    expect(result.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'unknownField',
          message: expect.stringContaining('Unknown field'),
        }),
      ])
    );
  });

  it('uses schema mode by default', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'index-pattern',
        attributes: { title: 'logstash-*' },
      })
      .expect(200);

    expect(result.body.valid).toBe(true);
    // In schema mode, savedObjectsClient.get should not be called
    expect(savedObjectsClient.get).not.toHaveBeenCalled();
  });

  it('in full mode, checks references and reports warnings', async () => {
    savedObjectsClient.get.mockRejectedValue(
      Object.assign(new Error('Not found'), { output: { statusCode: 404 } })
    );

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate?mode=full')
      .send({
        type: 'index-pattern',
        attributes: { title: 'logstash-*', sourceId: 'some-ref-id' },
      })
      .expect(200);

    // sourceId doesn't match additionalProperties=false, but we still get the warning about refs
    // The object may have errors from additionalProperties, but warnings should be present
    expect(result.body.warnings).toBeDefined();
    expect(result.body.warnings.length).toBeGreaterThan(0);
  });

  it('returns minLength validation error for empty title', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_validate')
      .send({
        type: 'index-pattern',
        attributes: { title: '' },
      })
      .expect(200);

    expect(result.body.valid).toBe(false);
    expect(result.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'title',
          message: expect.stringContaining('at least 1 character'),
        }),
      ])
    );
  });
});
