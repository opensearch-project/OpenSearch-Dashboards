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
import { registerDiffRoute } from '../diff';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('POST /api/saved_objects/_diff', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerDiffRoute(router);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('returns status "new" when object does not exist', async () => {
    savedObjectsClient.get.mockRejectedValue(
      Object.assign(new Error('Not found'), { output: { statusCode: 404 } })
    );

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'index-pattern',
        id: 'non-existent',
        attributes: { title: 'logstash-*' },
      })
      .expect(200);

    expect(result.body).toEqual({ status: 'new' });
  });

  it('returns status "unchanged" when attributes are identical', async () => {
    savedObjectsClient.get.mockResolvedValue({
      id: 'logstash-*',
      type: 'index-pattern',
      attributes: { title: 'logstash-*', timeFieldName: '@timestamp' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'index-pattern',
        id: 'logstash-*',
        attributes: { title: 'logstash-*', timeFieldName: '@timestamp' },
      })
      .expect(200);

    expect(result.body).toEqual({ status: 'unchanged' });
  });

  it('returns status "updated" with correct diff for modified fields', async () => {
    savedObjectsClient.get.mockResolvedValue({
      id: 'logstash-*',
      type: 'index-pattern',
      attributes: { title: 'logstash-*', timeFieldName: '@timestamp' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'index-pattern',
        id: 'logstash-*',
        attributes: { title: 'logstash-v2-*', timeFieldName: '@timestamp' },
      })
      .expect(200);

    expect(result.body.status).toBe('updated');
    expect(result.body.diff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'replace',
          path: 'title',
          oldValue: 'logstash-*',
          newValue: 'logstash-v2-*',
        }),
      ])
    );
  });

  it('detects added fields', async () => {
    savedObjectsClient.get.mockResolvedValue({
      id: 'logstash-*',
      type: 'index-pattern',
      attributes: { title: 'logstash-*' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'index-pattern',
        id: 'logstash-*',
        attributes: { title: 'logstash-*', timeFieldName: '@timestamp' },
      })
      .expect(200);

    expect(result.body.status).toBe('updated');
    expect(result.body.diff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'add',
          path: 'timeFieldName',
          newValue: '@timestamp',
        }),
      ])
    );
  });

  it('detects removed fields', async () => {
    savedObjectsClient.get.mockResolvedValue({
      id: 'logstash-*',
      type: 'index-pattern',
      attributes: { title: 'logstash-*', timeFieldName: '@timestamp' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'index-pattern',
        id: 'logstash-*',
        attributes: { title: 'logstash-*' },
      })
      .expect(200);

    expect(result.body.status).toBe('updated');
    expect(result.body.diff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'remove',
          path: 'timeFieldName',
          oldValue: '@timestamp',
        }),
      ])
    );
  });

  it('detects deeply nested changes', async () => {
    savedObjectsClient.get.mockResolvedValue({
      id: 'my-vis',
      type: 'visualization',
      attributes: {
        title: 'My Vis',
        visState: {
          type: 'pie',
          params: {
            isDonut: false,
            showLabels: true,
          },
        },
      },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'visualization',
        id: 'my-vis',
        attributes: {
          title: 'My Vis',
          visState: {
            type: 'pie',
            params: {
              isDonut: true,
              showLabels: true,
            },
          },
        },
      })
      .expect(200);

    expect(result.body.status).toBe('updated');
    expect(result.body.diff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'replace',
          path: 'visState.params.isDonut',
          oldValue: false,
          newValue: true,
        }),
      ])
    );
  });

  it('handles multiple changes at once', async () => {
    savedObjectsClient.get.mockResolvedValue({
      id: 'logstash-*',
      type: 'index-pattern',
      attributes: { title: 'logstash-*', fieldA: 'old', fieldB: 'remove-me' },
      references: [],
    });

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_diff')
      .send({
        type: 'index-pattern',
        id: 'logstash-*',
        attributes: { title: 'logstash-*', fieldA: 'new', fieldC: 'added' },
      })
      .expect(200);

    expect(result.body.status).toBe('updated');
    expect(result.body.diff).toHaveLength(3);
    expect(result.body.diff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ op: 'replace', path: 'fieldA' }),
        expect.objectContaining({ op: 'remove', path: 'fieldB' }),
        expect.objectContaining({ op: 'add', path: 'fieldC' }),
      ])
    );
  });
});
