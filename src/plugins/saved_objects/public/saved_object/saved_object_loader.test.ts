/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { SavedObjectLoader } from './saved_object_loader';

describe('SimpleSavedObjectLoader', () => {
  const createLoader = (updatedAt?: any) => {
    const id = 'logstash-*';
    const type = 'index-pattern';

    const savedObject = {
      attributes: {},
      id,
      type,
      updated_at: updatedAt as any,
    };

    client = {
      ...client,
      find: jest.fn(() =>
        Promise.resolve({
          total: 1,
          savedObjects: [savedObject],
        })
      ),
    } as any;

    return new SavedObjectLoader(savedObject, client);
  };

  let client: SavedObjectsClientContract;
  let loader: SavedObjectLoader;
  beforeEach(() => {
    client = {
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as any;
  });

  afterEach(async () => {
    const savedObjects = await loader.findAll();

    expect(savedObjects.hits[0].updated_at).toEqual(undefined);
  });

  it('set updated_at as undefined if undefined', async () => {
    loader = createLoader(undefined);
  });

  it("set updated_at as undefined if doesn't exist", async () => {
    loader = createLoader();
  });

  it('set updated_at as undefined if null', async () => {
    loader = createLoader(null);
  });
});
