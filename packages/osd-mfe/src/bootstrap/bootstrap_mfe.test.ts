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

import { bootstrapMfe, BootstrapMfeDeps } from './bootstrap_mfe';
import { MfeBrowserWindow, MfeContainer, PluginPublicModule, ShareScope } from './types';

const SHARED_DEPS_URL = 'http://localhost:8080/shared-deps/osd-ui-shared-deps.js';
const REGISTRY_URL = 'http://localhost:8080/registry';

function validRegistry() {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
    mfes: {
      inspector: {
        version: '3.5.0+aaa',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'inspector',
        module: './public',
      },
      data: {
        version: '3.5.0+bbb',
        remoteEntry: 'http://localhost:8080/mfe/data/remoteEntry.js',
        scope: 'data',
        module: './public',
      },
    },
  };
}

function testWindow(): MfeBrowserWindow {
  return (window as unknown) as MfeBrowserWindow;
}

describe('bootstrapMfe (locked sequence)', () => {
  it('seeds singletons, loads remotes, populates the shim, then boots core', async () => {
    const order: string[] = [];
    const registered = new Set<string>();
    let scopeSeenByRemotes: ShareScope | undefined;

    const fakeContainer: MfeContainer = {
      init: () => undefined,
      get: () => Promise.resolve(() => ({ plugin: () => undefined })),
    };

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          // The shared-deps script assigns the singleton globals on load.
          testWindow().__osdSharedDeps__ = {
            React: { version: '16.14.0' },
            ReactDom: { version: '16.14.0' },
            Lodash: { VERSION: '4.17.21' },
          };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer),
      getRemoteModule: jest.fn(
        async (_container: MfeContainer, shareScope: ShareScope): Promise<PluginPublicModule> => {
          scopeSeenByRemotes = shareScope;
          return { plugin: () => undefined };
        }
      ),
      registerPlugin: jest.fn((id: string) => {
        order.push(`register:${id}`);
        registered.add(id);
      }),
      invokeCoreBootstrap: jest.fn(async () => {
        order.push('coreBootstrap');
        // CRITICAL: every plugin must already be in the shim before core boots,
        // because plugin_reader reads __osdBundles__ synchronously at start.
        expect(registered.has('inspector')).toBe(true);
        expect(registered.has('data')).toBe(true);
      }),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    // Both plugins registered BEFORE core bootstrap (order check).
    expect(order).toEqual(
      expect.arrayContaining(['register:inspector', 'register:data', 'coreBootstrap'])
    );
    expect(order.indexOf('coreBootstrap')).toBe(order.length - 1);
    expect(order.indexOf('register:inspector')).toBeLessThan(order.indexOf('coreBootstrap'));
    expect(order.indexOf('register:data')).toBeLessThan(order.indexOf('coreBootstrap'));

    // react/react-dom were seeded as singletons in the scope handed to remotes.
    expect(scopeSeenByRemotes).toBeDefined();
    expect(scopeSeenByRemotes!.react).toBeDefined();
    expect(scopeSeenByRemotes!['react-dom']).toBeDefined();
    expect(deps.loadRemoteContainer).toHaveBeenCalledTimes(2);
  });

  it('throws when shared deps are unavailable after loading the script', async () => {
    const deps: Partial<BootstrapMfeDeps> = {
      // Does not assign __osdSharedDeps__.
      loadScript: jest.fn(async () => undefined),
    };
    testWindow().__osdSharedDeps__ = (undefined as unknown) as Record<string, unknown>;

    await expect(
      bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps })
    ).rejects.toThrow(/__osdSharedDeps__ is not available/);
  });

  it('throws on a non-ok registry response', async () => {
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async () => {
        testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
      }),
      fetchImpl: ((async () => ({
        ok: false,
        status: 503,
        json: async () => ({}),
      })) as unknown) as typeof fetch,
    };

    await expect(
      bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps })
    ).rejects.toThrow(/HTTP 503/);
  });
});
