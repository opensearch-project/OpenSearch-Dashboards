/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as exportMock from '../../export';
import { createListStream } from '../../../utils/streams';
import { mockUuidv4 } from '../../import/__mocks__';
import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { registerCopyRoute } from '../copy';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { SavedObjectConfig } from '../../saved_objects_config';
import { setupServer, createExportableType } from '../test_utils';
import { SavedObjectsErrorHelpers } from '../..';

jest.mock('../../export', () => ({
  exportSavedObjectsToStream: jest.fn(),
}));

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

const { v4: uuidv4 } = jest.requireActual('uuid');
const allowedTypes = ['index-pattern', 'visualization', 'dashboard'];
const config = { maxImportPayloadBytes: 26214400, maxImportExportSize: 10000 } as SavedObjectConfig;
const URL = '/internal/saved_objects/_copy';
const exportSavedObjectsToStream = exportMock.exportSavedObjectsToStream as jest.Mock;

describe(`POST ${URL}`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  const emptyResponse = { saved_objects: [], total: 0, per_page: 0, page: 0 };
  const mockIndexPattern = {
    type: 'index-pattern',
    id: 'my-pattern',
    attributes: { title: 'my-pattern-*' },
    references: [],
  };
  const mockVisualization = {
    type: 'visualization',
    id: 'my-visualization',
    attributes: { title: 'Test visualization' },
    references: [
      {
        name: 'ref_0',
        type: 'index-pattern',
        id: 'my-pattern',
      },
    ],
  };
  const mockDashboard = {
    type: 'dashboard',
    id: 'my-dashboard',
    attributes: { title: 'Look at my dashboard' },
    references: [],
  };

  beforeEach(async () => {
    mockUuidv4.mockReset();
    mockUuidv4.mockImplementation(() => uuidv4());
    ({ server, httpSetup, handlerContext } = await setupServer());
    handlerContext.savedObjects.typeRegistry.getImportableAndExportableTypes.mockReturnValue(
      allowedTypes.map(createExportableType)
    );
    handlerContext.savedObjects.typeRegistry.getType.mockImplementation(
      (type: string) =>
        // other attributes aren't needed for the purposes of injecting metadata
        ({ management: { icon: `${type}-icon` } } as any)
    );

    savedObjectsClient = handlerContext.savedObjects.client;
    savedObjectsClient.find.mockResolvedValue(emptyResponse);
    savedObjectsClient.checkConflicts.mockResolvedValue({ errors: [] });

    const router = httpSetup.createRouter('/internal/saved_objects/');
    registerCopyRoute(router, config);

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('formats successful response', async () => {
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream([]));

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        objects: [
          {
            type: 'index-pattern',
            id: 'my-pattern',
          },
          {
            type: 'dashboard',
            id: 'my-dashboard',
          },
        ],
        includeReferencesDeep: true,
        targetWorkspace: 'test_workspace',
      })
      .expect(200);

    expect(result.body).toEqual({ success: true, successCount: 0 });
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled(); // no objects were created
  });

  it('requires objects', async () => {
    const result = await supertest(httpSetup.server.listener).post(URL).send({}).expect(400);

    expect(result.body.message).toMatchInlineSnapshot(
      `"[request body.objects]: expected value of type [array] but got [undefined]"`
    );
  });

  it('requires target workspace', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        objects: [
          {
            type: 'index-pattern',
            id: 'my-pattern',
          },
          {
            type: 'dashboard',
            id: 'my-dashboard',
          },
        ],
        includeReferencesDeep: true,
      })
      .expect(400);

    expect(result.body.message).toMatchInlineSnapshot(
      `"[request body.targetWorkspace]: expected value of type [string] but got [undefined]"`
    );
  });

  it('copy unsupported objects', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        objects: [
          {
            type: 'unknown',
            id: 'my-pattern',
          },
        ],
        includeReferencesDeep: true,
        targetWorkspace: 'test_workspace',
      })
      .expect(400);

    expect(result.body.message).toMatchInlineSnapshot(
      `"Trying to copy object(s) with unsupported types: unknown:my-pattern"`
    );
  });

  it('copy index pattern and dashboard into a workspace successfully', async () => {
    const targetWorkspace = 'target_workspace_id';
    const savedObjects = [mockIndexPattern, mockDashboard];
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(savedObjects));
    savedObjectsClient.bulkCreate.mockResolvedValueOnce({
      saved_objects: savedObjects.map((obj) => ({ ...obj, workspaces: [targetWorkspace] })),
    });

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        objects: [
          {
            type: 'index-pattern',
            id: 'my-pattern',
          },
          {
            type: 'dashboard',
            id: 'my-dashboard',
          },
        ],
        includeReferencesDeep: true,
        targetWorkspace,
      })
      .expect(200);
    expect(result.body).toEqual({
      success: true,
      successCount: 2,
      successResults: [
        {
          type: mockIndexPattern.type,
          id: mockIndexPattern.id,
          meta: { title: mockIndexPattern.attributes.title, icon: 'index-pattern-icon' },
        },
        {
          type: mockDashboard.type,
          id: mockDashboard.id,
          meta: { title: mockDashboard.attributes.title, icon: 'dashboard-icon' },
        },
      ],
    });
    expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
  });

  it('copy a visualization with missing references', async () => {
    const targetWorkspace = 'target_workspace_id';
    const savedObjects = [mockVisualization];
    const exportDetail = {
      exportedCount: 2,
      missingRefCount: 1,
      missingReferences: [{ type: 'index-pattern', id: 'my-pattern' }],
    };
    exportSavedObjectsToStream.mockResolvedValueOnce(
      createListStream(...savedObjects, exportDetail)
    );

    const error = SavedObjectsErrorHelpers.createGenericNotFoundError(
      'index-pattern',
      'my-pattern-*'
    ).output.payload;
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [{ ...mockIndexPattern, error }],
    });

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        objects: [
          {
            type: 'visualization',
            id: 'my-visualization',
          },
        ],
        includeReferencesDeep: true,
        targetWorkspace,
      })
      .expect(200);
    expect(result.body).toEqual({
      success: false,
      successCount: 0,
      errors: [
        {
          id: 'my-visualization',
          type: 'visualization',
          title: 'Test visualization',
          meta: { title: 'Test visualization', icon: 'visualization-icon' },
          error: {
            type: 'missing_references',
            references: [{ type: 'index-pattern', id: 'my-pattern' }],
          },
        },
      ],
    });
    expect(savedObjectsClient.bulkGet).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.bulkGet).toHaveBeenCalledWith(
      [{ fields: ['id'], id: 'my-pattern', type: 'index-pattern' }],
      expect.any(Object) // options
    );
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
  });
});
