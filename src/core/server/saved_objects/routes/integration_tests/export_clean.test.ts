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

import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';

jest.mock('../../export', () => ({
  exportSavedObjectsToStream: jest.fn(),
}));

import * as exportMock from '../../export';
import { createListStream } from '../../../utils/streams';
import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { SavedObjectConfig } from '../../saved_objects_config';
import { registerExportCleanRoute } from '../export_clean';
import { setupServer, createExportableType } from '../test_utils';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;
const exportSavedObjectsToStream = exportMock.exportSavedObjectsToStream as jest.Mock;
const allowedTypes = ['index-pattern', 'search'];
const config = {
  maxImportPayloadBytes: 26214400,
  maxImportExportSize: 10000,
} as SavedObjectConfig;

describe('POST /api/saved_objects/_export_clean', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    handlerContext.savedObjects.typeRegistry.getImportableAndExportableTypes.mockReturnValue(
      allowedTypes.map(createExportableType)
    );

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerExportCleanRoute(router, config);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await server.stop();
  });

  it('produces output with sorted keys', async () => {
    const objects = [
      {
        id: '1',
        type: 'index-pattern',
        attributes: { zebra: 'z', alpha: 'a', middle: 'm' },
        references: [],
      },
    ];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(objects));

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: 'index-pattern' })
      .expect(200);

    expect(result.body).toBeInstanceOf(Array);
    expect(result.body).toHaveLength(1);

    // Verify keys are sorted by checking the JSON string
    const jsonStr = JSON.stringify(result.body[0]);
    const alphaIdx = jsonStr.indexOf('"alpha"');
    const middleIdx = jsonStr.indexOf('"middle"');
    const zebraIdx = jsonStr.indexOf('"zebra"');
    expect(alphaIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(zebraIdx);
  });

  it('produces deterministic output (same input always same output)', async () => {
    const objects = [
      {
        id: '2',
        type: 'search',
        attributes: { title: 'Search B' },
        references: [{ name: 'ref_0', type: 'index-pattern', id: '1' }],
      },
      {
        id: '1',
        type: 'index-pattern',
        attributes: { title: 'Pattern A' },
        references: [],
      },
    ];

    // Run twice with same input
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream([...objects]));
    const result1 = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: ['index-pattern', 'search'] })
      .expect(200);

    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream([...objects]));
    const result2 = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: ['index-pattern', 'search'] })
      .expect(200);

    expect(JSON.stringify(result1.body)).toEqual(JSON.stringify(result2.body));
  });

  it('sorts objects by type then id', async () => {
    const objects = [
      {
        id: 'b',
        type: 'search',
        attributes: { title: 'B' },
        references: [],
      },
      {
        id: 'a',
        type: 'index-pattern',
        attributes: { title: 'A' },
        references: [],
      },
      {
        id: 'c',
        type: 'index-pattern',
        attributes: { title: 'C' },
        references: [],
      },
    ];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(objects));

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: ['index-pattern', 'search'] })
      .expect(200);

    expect(result.body).toHaveLength(3);
    // index-pattern comes before search alphabetically, a before c
    expect(result.body[0].type).toBe('index-pattern');
    expect(result.body[0].id).toBe('a');
    expect(result.body[1].type).toBe('index-pattern');
    expect(result.body[1].id).toBe('c');
    expect(result.body[2].type).toBe('search');
    expect(result.body[2].id).toBe('b');
  });

  it('filters by type', async () => {
    const objects = [
      {
        id: '1',
        type: 'index-pattern',
        attributes: { title: 'Pattern' },
        references: [],
      },
    ];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(objects));

    await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: 'index-pattern' })
      .expect(200);

    expect(exportSavedObjectsToStream).toHaveBeenCalledWith(
      expect.objectContaining({
        types: ['index-pattern'],
      })
    );
  });

  it('filters by specific objects', async () => {
    const objects = [
      {
        id: '1',
        type: 'index-pattern',
        attributes: { title: 'Pattern' },
        references: [],
      },
    ];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(objects));

    await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({
        objects: [{ type: 'index-pattern', id: '1' }],
      })
      .expect(200);

    expect(exportSavedObjectsToStream).toHaveBeenCalledWith(
      expect.objectContaining({
        objects: [{ type: 'index-pattern', id: '1' }],
      })
    );
  });

  it('strips empty references from clean output', async () => {
    const objects = [
      {
        id: '1',
        type: 'index-pattern',
        attributes: { title: 'Pattern' },
        references: [],
      },
    ];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(objects));

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: 'index-pattern' })
      .expect(200);

    // Empty references array should be stripped from clean output
    expect(result.body[0].references).toBeUndefined();
  });

  it('preserves non-empty references in clean output', async () => {
    const objects = [
      {
        id: '1',
        type: 'search',
        attributes: { title: 'My Search' },
        references: [{ name: 'ref_0', type: 'index-pattern', id: 'pattern-1' }],
      },
    ];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(objects));

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_export_clean')
      .send({ type: 'search' })
      .expect(200);

    expect(result.body[0].references).toEqual([
      { id: 'pattern-1', name: 'ref_0', type: 'index-pattern' },
    ]);
  });
});
