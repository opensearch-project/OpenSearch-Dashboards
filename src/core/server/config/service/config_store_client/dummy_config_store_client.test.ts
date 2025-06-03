/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DummyConfigStoreClient } from './dummy_config_store_client';

describe('DummyConfigStoreClient', () => {
  const expectedResponse = {
    body: {},
    statusCode: 200,
    headers: {},
    warnings: [],
    meta: {},
  };
  const dummyStoreConfigClient = new DummyConfigStoreClient();

  it('should return empty map for listConfigs', async () => {
    const response = await dummyStoreConfigClient.listConfigs();
    expect(response).toMatchObject(new Map());
  });

  it('should return expectedResponse for bulkCreateConfigs', async () => {
    const response = await dummyStoreConfigClient.bulkCreateConfigs({
      configs: [],
    });
    expect(response).toMatchObject(expectedResponse);
  });

  it('should return expectedResponse for createConfigs', async () => {
    const response = await dummyStoreConfigClient.createConfig({
      config: {
        name: 'foo',
        updatedConfig: {},
      },
    });
    expect(response).toMatchObject(expectedResponse);
  });

  it('should return expectedResponse for bulkDeleteConfigs', async () => {
    const response = await dummyStoreConfigClient.bulkDeleteConfigs({
      paths: [],
    });
    expect(response).toMatchObject(expectedResponse);
  });

  it('should return expectedResponse for deleteConfig', async () => {
    const response = await dummyStoreConfigClient.deleteConfig({
      pluginConfigPath: 'foo',
    });
    expect(response).toMatchObject(expectedResponse);
  });

  it('should return undefined for getConfig', async () => {
    const response = await dummyStoreConfigClient.getConfig('foo');
    expect(response).toBeUndefined();
  });

  it('should return empty for bulkGetConfigs', async () => {
    const response = await dummyStoreConfigClient.bulkGetConfigs([]);
    expect(response).toMatchObject(new Map());
  });
});
