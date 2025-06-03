/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as exportMock from '../../../../core/server';
import supertest from 'supertest';
import { SavedObjectsErrorHelpers } from '../../../../core/server';
import { UnwrapPromise } from '@osd/utility-types';
import { loggingSystemMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { setupServer } from '../../../../core/server/test_utils';
import { registerDuplicateRoute } from '../routes/duplicate';
import { createListStream } from '../../../../core/server/utils/streams';
import Boom from '@hapi/boom';
import { dynamicConfigServiceMock } from '../../../../core/server/mocks';

jest.mock('../../../../core/server/saved_objects/export', () => ({
  exportSavedObjectsToStream: jest.fn(),
}));

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

const allowedTypes = ['index-pattern', 'visualization', 'dashboard'];
const URL = '/api/workspaces/_duplicate_saved_objects';
const exportSavedObjectsToStream = exportMock.exportSavedObjectsToStream as jest.Mock;
const logger = loggingSystemMock.create();
const clientMock = {
  init: jest.fn(),
  enterWorkspace: jest.fn(),
  getCurrentWorkspaceId: jest.fn(),
  getCurrentWorkspace: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  stop: jest.fn(),
  setup: jest.fn(),
  destroy: jest.fn(),
  setSavedObjects: jest.fn(),
};

export const createExportableType = (name: string): exportMock.SavedObjectsType => {
  return {
    name,
    hidden: false,
    namespaceType: 'single',
    mappings: {
      properties: {},
    },
    management: {
      importableAndExportable: true,
    },
  };
};

describe(`duplicate saved objects among workspaces`, () => {
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
  const mockIndexPatternWithDataSourceReference = {
    type: 'index-pattern',
    id: 'my-pattern',
    attributes: { title: 'my-pattern-*' },
    references: [
      {
        name: 'dataSource',
        type: 'data-source',
        id: 'my-data-source',
      },
    ],
  };
  const mockDynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();

  beforeEach(async () => {
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

    const router = httpSetup.createRouter('');

    registerDuplicateRoute(router, logger.get(), clientMock, 10000);

    await server.start({ dynamicConfigService: mockDynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('duplicate failed if the requested saved objects are not valid', async () => {
    const savedObjects = [mockIndexPattern, mockDashboard];
    clientMock.get.mockResolvedValueOnce({ success: true });
    exportSavedObjectsToStream.mockImplementation(() => {
      const err = Boom.badRequest();
      err.output.payload.attributes = {
        objects: savedObjects,
      };
      throw err;
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
        targetWorkspace: 'test_workspace',
      })
      .expect(400);

    expect(result.body.error).toEqual('Bad Request');
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

  it('target workspace does not exist', async () => {
    clientMock.get.mockResolvedValueOnce({ success: false });
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
        targetWorkspace: 'non-existen-workspace',
      })
      .expect(400);

    expect(result.body.message).toMatchInlineSnapshot(`"Get target workspace error: undefined"`);
  });

  it('duplicate unsupported objects', async () => {
    clientMock.get.mockResolvedValueOnce({ success: true });
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
      `"Trying to duplicate object(s) with unsupported types: unknown:my-pattern"`
    );
  });

  it('duplicate index pattern and dashboard into a workspace successfully', async () => {
    const targetWorkspace = 'target_workspace_id';
    const savedObjects = [mockIndexPattern, mockDashboard];
    clientMock.get.mockResolvedValueOnce({ success: true });
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

  it('duplicate a saved object failed if its references are missing', async () => {
    const targetWorkspace = 'target_workspace_id';
    const savedObjects = [mockVisualization];
    const exportDetail = {
      exportedCount: 2,
      missingRefCount: 1,
      missingReferences: [{ type: 'index-pattern', id: 'my-pattern' }],
    };
    clientMock.get.mockResolvedValueOnce({ success: true });
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

  it('copy a saved object failed if its data source in target workspace is missing', async () => {
    const targetWorkspace = 'target_workspace_id';
    const savedObjects = [mockIndexPatternWithDataSourceReference];
    clientMock.get.mockResolvedValueOnce({ success: true });
    savedObjectsClient.find.mockResolvedValueOnce({
      saved_objects: [],
      total: 0,
      per_page: 5,
      page: 1,
    });
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        {
          id: 'my-data-source',
          type: 'data-source',
          attributes: {},
          references: [],
        },
      ],
    });
    exportSavedObjectsToStream.mockResolvedValueOnce(createListStream(savedObjects));

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        objects: [
          {
            type: 'index-pattern',
            id: 'my-pattern',
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
          id: 'my-pattern',
          type: 'index-pattern',
          title: 'my-pattern-*',
          meta: { title: 'my-pattern-*', icon: 'index-pattern-icon' },
          error: {
            type: 'missing_data_source',
            dataSource: 'my-data-source',
          },
        },
      ],
    });
    expect(savedObjectsClient.bulkGet).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.bulkGet).toHaveBeenCalledWith(
      [{ id: 'my-data-source', type: 'data-source' }],
      expect.any(Object) // options
    );
    expect(savedObjectsClient.bulkCreate).not.toHaveBeenCalled();
  });
});
