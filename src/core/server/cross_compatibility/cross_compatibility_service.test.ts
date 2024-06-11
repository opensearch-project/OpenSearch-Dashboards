/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CrossCompatibilityService } from './cross_compatibility_service';
import { CompatibleEnginePluginVersions } from '../plugins/types';
import { mockCoreContext } from '../core_context.mock';
import { opensearchServiceMock } from '../opensearch/opensearch_service.mock';

describe('CrossCompatibilityService', () => {
  let service: CrossCompatibilityService;
  let opensearch: any;
  const plugins = new Map<string, CompatibleEnginePluginVersions>();

  beforeEach(() => {
    opensearch = opensearchServiceMock.createStart();
    opensearch.client.asInternalUser.cat.plugins.mockResolvedValue({
      body: [
        {
          name: 'node1',
          component: 'os-plugin',
          version: '1.1.0.0',
        },
      ],
    } as any);

    plugins?.set('foo', { 'os-plugin': '1.0.0 - 2.0.0' });
    plugins?.set('incompatiblePlugin', { 'os-plugin': '^3.0.0' });
    plugins?.set('test', {});
    service = new CrossCompatibilityService(mockCoreContext.create());
  });

  it('should start the cross compatibility service', async () => {
    const startDeps = { opensearch, plugins };
    const startResult = await service.start(startDeps);
    expect(startResult).toEqual({
      verifyOpenSearchPluginsState: expect.any(Function),
    });
  });

  it('should return an array of CrossCompatibilityResult objects if plugin dependencies are specified', async () => {
    const pluginName = 'foo';
    const startDeps = { opensearch, plugins };
    const startResult = await service.start(startDeps);
    const results = await startResult.verifyOpenSearchPluginsState(pluginName);
    expect(results).not.toBeUndefined();
    expect(results.length).toEqual(1);
    expect(results[0].pluginName).toEqual('os-plugin');
    expect(results[0].isCompatible).toEqual(true);
    expect(results[0].incompatibilityReason).toEqual('');
    expect(results[0].installedVersions).toEqual(['1.1.0.0']);
    expect(opensearch.client.asInternalUser.cat.plugins).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array if no plugin dependencies are specified', async () => {
    const pluginName = 'test';
    const startDeps = { opensearch, plugins };
    const startResult = await service.start(startDeps);
    const results = await startResult.verifyOpenSearchPluginsState(pluginName);
    expect(results).not.toBeUndefined();
    expect(results.length).toEqual(0);
    expect(opensearch.client.asInternalUser.cat.plugins).toHaveBeenCalledTimes(1);
  });

  it('should return an array of CrossCompatibilityResult objects with the incompatible reason if the plugin is not installed', async () => {
    const pluginName = 'incompatiblePlugin';
    const startDeps = { opensearch, plugins };
    const startResult = await service.start(startDeps);
    const results = await startResult.verifyOpenSearchPluginsState(pluginName);
    expect(results).not.toBeUndefined();
    expect(results.length).toEqual(1);
    expect(results[0].pluginName).toEqual('os-plugin');
    expect(results[0].isCompatible).toEqual(false);
    expect(results[0].incompatibilityReason).toEqual(
      'OpenSearch plugin "os-plugin" in the version range "^3.0.0" is not installed on the OpenSearch for the OpenSearch Dashboards plugin to function as expected.'
    );
    expect(results[0].installedVersions).toEqual(['1.1.0.0']);
    expect(opensearch.client.asInternalUser.cat.plugins).toHaveBeenCalledTimes(1);
  });
});
