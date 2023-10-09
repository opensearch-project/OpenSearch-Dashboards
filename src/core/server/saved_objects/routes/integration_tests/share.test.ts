/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { registerShareRoute } from '../share';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { createExportableType, setupServer } from '../test_utils';
import { WORKSPACE_TYPE } from '../../../../utils/constants';
import { typeRegistryMock } from '../../saved_objects_type_registry.mock';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('POST /api/saved_objects/_share', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;
  let typeRegistry: ReturnType<typeof typeRegistryMock.create>;
  const allowedTypes = ['index-pattern', 'dashboard', 'settings'];

  beforeEach(async () => {
    const clientResponse = [
      {
        id: 'abc123',
        type: 'index-pattern',
        workspaces: ['ws-1', 'ws-2'],
      },
    ];

    const bulkGetResponse = {
      saved_objects: [
        {
          id: 'abc123',
          type: 'index-pattern',
          title: 'logstash-*',
          version: 'foo',
          references: [],
          attributes: {},
          workspaces: ['ws-1'],
        },
      ],
    };

    ({ server, httpSetup, handlerContext } = await setupServer());
    typeRegistry = handlerContext.savedObjects.typeRegistry;
    typeRegistry.getAllTypes.mockReturnValue(allowedTypes.map(createExportableType));

    savedObjectsClient = handlerContext.savedObjects.client;
    savedObjectsClient.addToWorkspaces.mockResolvedValue(clientResponse);
    savedObjectsClient.bulkGet.mockImplementation(() => Promise.resolve(bulkGetResponse));

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerShareRoute(router);

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('workspace itself are not allowed to share', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_share')
      .send({
        objects: [
          {
            id: 'abc123',
            type: WORKSPACE_TYPE,
          },
        ],
        targetWorkspaceIds: ['ws-2'],
      })
      .expect(400);

    expect(result.body.message).toEqual(
      `Trying to share object(s) with non-shareable types: ${WORKSPACE_TYPE}:abc123`
    );
  });

  it('ignore legacy saved objects when share', async () => {
    const bulkGetResponse = {
      saved_objects: [
        {
          id: 'settings-1.0',
          type: 'settings',
          title: 'Advanced-settings',
          version: 'foo',
          references: [],
          attributes: {},
          workspaces: undefined,
        },
      ],
    };
    savedObjectsClient.bulkGet.mockImplementation(() => Promise.resolve(bulkGetResponse));

    const clientResponse = [
      {
        id: 'settings-1.0',
        type: 'settings',
        workspaces: undefined,
      },
    ];

    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_share')
      .send({
        objects: [
          {
            id: 'settings-1.0',
            type: 'settings',
          },
        ],
        targetWorkspaceIds: ['ws-2'],
      });

    expect(result.body).toEqual(clientResponse);
  });

  it('formats successful response', async () => {
    const clientResponse = [
      {
        id: 'abc123',
        type: 'index-pattern',
        workspaces: ['ws-1', 'ws-2'],
      },
    ];
    const result = await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_share')
      .send({
        objects: [
          {
            id: 'abc123',
            type: 'index-pattern',
          },
        ],
        targetWorkspaceIds: ['ws-2'],
      })
      .expect(200);

    expect(result.body).toEqual(clientResponse);
  });

  it('calls upon savedObjectClient.addToWorkspaces', async () => {
    await supertest(httpSetup.server.listener)
      .post('/api/saved_objects/_share')
      .send({
        objects: [
          {
            id: 'abc123',
            type: 'index-pattern',
          },
        ],
        targetWorkspaceIds: ['ws-2'],
      })
      .expect(200);

    expect(savedObjectsClient.addToWorkspaces).toHaveBeenCalledWith(
      [
        {
          id: 'abc123',
          type: 'index-pattern',
          workspaces: ['ws-1'],
        },
      ],
      ['ws-2'],
      { workspaces: undefined }
    );
  });
});
