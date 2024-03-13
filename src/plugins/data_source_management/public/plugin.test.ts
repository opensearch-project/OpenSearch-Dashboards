/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { coreMock } from '../../../core/public/mocks';
import { DataSourceManagementPluginStart } from './plugin';
import { testDataSourceManagementPlugin, createAuthenticationMethod } from './mocks';

describe('#dataSourceManagement', () => {
  let coreSetup: any;
  let coreStart: any;
  let mockDataSourceManagementPluginStart: MockedKeys<DataSourceManagementPluginStart>;
  beforeEach(() => {
    coreSetup = coreMock.createSetup({ pluginStartContract: mockDataSourceManagementPluginStart });
    coreStart = coreMock.createStart();
  });
  it('can register custom authentication method', () => {
    const { setup, doStart } = testDataSourceManagementPlugin(coreSetup, coreStart);
    const typeA = createAuthenticationMethod({ name: 'typeA' });
    setup.registerAuthenticationMethod(createAuthenticationMethod(typeA));
    const start = doStart();
    const registry = start.getAuthenticationMethodRegistery();
    expect(registry.getAuthenticationMethod('typeA')).toEqual(typeA);
  });
});
