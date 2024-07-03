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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SavedObjectsClient } from './saved_objects_client';

test(`#create`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    create: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const attributes = Symbol();
  const options = Symbol();
  const result = await client.create(type, attributes, options);

  expect(mockRepository.create).toHaveBeenCalledWith(type, attributes, options);
  expect(result).toBe(returnValue);
});

test(`#checkConflicts`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    checkConflicts: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const objects = Symbol();
  const options = Symbol();
  const result = await client.checkConflicts(objects, options);

  expect(mockRepository.checkConflicts).toHaveBeenCalledWith(objects, options);
  expect(result).toBe(returnValue);
});

test(`#bulkCreate`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    bulkCreate: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const objects = Symbol();
  const options = Symbol();
  const result = await client.bulkCreate(objects, options);

  expect(mockRepository.bulkCreate).toHaveBeenCalledWith(objects, options);
  expect(result).toBe(returnValue);
});

test(`#delete`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    delete: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const options = Symbol();
  const result = await client.delete(type, id, options);

  expect(mockRepository.delete).toHaveBeenCalledWith(type, id, options);
  expect(result).toBe(returnValue);
});

test(`#find`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    find: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const options = Symbol();
  const result = await client.find(options);

  expect(mockRepository.find).toHaveBeenCalledWith(options);
  expect(result).toBe(returnValue);
});

test(`#bulkGet`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    bulkGet: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const objects = Symbol();
  const options = Symbol();
  const result = await client.bulkGet(objects, options);

  expect(mockRepository.bulkGet).toHaveBeenCalledWith(objects, options);
  expect(result).toBe(returnValue);
});

test(`#get`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    get: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const options = Symbol();
  const result = await client.get(type, id, options);

  expect(mockRepository.get).toHaveBeenCalledWith(type, id, options);
  expect(result).toBe(returnValue);
});

test(`#update`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    update: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const attributes = Symbol();
  const options = Symbol();
  const result = await client.update(type, id, attributes, options);

  expect(mockRepository.update).toHaveBeenCalledWith(type, id, attributes, options);
  expect(result).toBe(returnValue);
});

test(`#bulkUpdate`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    bulkUpdate: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const attributes = Symbol();
  const version = Symbol();
  const namespace = Symbol();
  const result = await client.bulkUpdate([{ type, id, attributes, version }], { namespace });

  expect(mockRepository.bulkUpdate).toHaveBeenCalledWith([{ type, id, attributes, version }], {
    namespace,
  });
  expect(result).toBe(returnValue);
});

test(`#addToNamespaces`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    addToNamespaces: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const namespaces = Symbol();
  const options = Symbol();
  const result = await client.addToNamespaces(type, id, namespaces, options);

  expect(mockRepository.addToNamespaces).toHaveBeenCalledWith(type, id, namespaces, options);
  expect(result).toBe(returnValue);
});

test(`#deleteFromNamespaces`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    deleteFromNamespaces: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const namespaces = Symbol();
  const options = Symbol();
  const result = await client.deleteFromNamespaces(type, id, namespaces, options);

  expect(mockRepository.deleteFromNamespaces).toHaveBeenCalledWith(type, id, namespaces, options);
  expect(result).toBe(returnValue);
});

test(`#deleteByWorkspace`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    deleteByWorkspace: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const workspace = Symbol();
  const options = Symbol();
  const result = await client.deleteByWorkspace(workspace, options);

  expect(mockRepository.deleteByWorkspace).toHaveBeenCalledWith(workspace, options);
  expect(result).toBe(returnValue);
});

test(`#deleteFromWorkspaces Should use update if there is existing workspaces`, async () => {
  const returnValue = Symbol();
  const create = jest.fn();
  const mockRepository = {
    get: jest.fn().mockResolvedValue({
      workspaces: ['id1', 'id2'],
    }),
    update: jest.fn().mockResolvedValue(returnValue),
    create,
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  await client.deleteFromWorkspaces(type, id, ['id2']);
  expect(mockRepository.get).toHaveBeenCalledWith(type, id, {});
  expect(mockRepository.update).toHaveBeenCalledWith(type, id, undefined, {
    version: undefined,
    workspaces: ['id1'],
  });
});

test(`#deleteFromWorkspaces Should use overwrite create if there is no existing workspaces`, async () => {
  const returnValue = Symbol();
  const create = jest.fn();
  const mockRepository = {
    get: jest.fn().mockResolvedValue({
      workspaces: [],
    }),
    update: jest.fn().mockResolvedValue(returnValue),
    create,
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  await client.deleteFromWorkspaces(type, id, ['id1']);
  expect(mockRepository.get).toHaveBeenCalledWith(type, id, {});
  expect(mockRepository.create).toHaveBeenCalledWith(
    type,
    {},
    { id, overwrite: true, permissions: undefined, version: undefined }
  );
});

test(`#deleteFromWorkspaces should throw error if no workspaces passed`, () => {
  const mockRepository = {};
  const client = new SavedObjectsClient(mockRepository);
  const type = Symbol();
  const id = Symbol();
  const workspaces = [];
  expect(() => client.deleteFromWorkspaces(type, id, workspaces)).rejects.toThrowError();
});

test(`#addToWorkspaces`, async () => {
  const returnValue = Symbol();
  const mockRepository = {
    get: jest.fn().mockResolvedValue(returnValue),
    update: jest.fn().mockResolvedValue(returnValue),
  };
  const client = new SavedObjectsClient(mockRepository);

  const type = Symbol();
  const id = Symbol();
  const workspaces = Symbol();
  const result = await client.addToWorkspaces(type, id, workspaces);

  expect(mockRepository.get).toHaveBeenCalledWith(type, id, {});
  expect(mockRepository.update).toHaveBeenCalledWith(type, id, undefined, {
    workspaces: [workspaces],
  });

  expect(result).toBe(returnValue);
});

test(`#addToWorkspaces should throw error if no workspaces passed`, () => {
  const mockRepository = {};
  const client = new SavedObjectsClient(mockRepository);
  const type = Symbol();
  const id = Symbol();
  const workspaces = [];
  expect(() => client.addToWorkspaces(type, id, workspaces)).rejects.toThrowError();
});
