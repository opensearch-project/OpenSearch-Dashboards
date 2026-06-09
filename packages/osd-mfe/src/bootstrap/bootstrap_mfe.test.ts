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
      getRemoteModuleFactory: jest.fn(
        async (
          _container: MfeContainer,
          shareScope: ShareScope
        ): Promise<() => PluginPublicModule> => {
          scopeSeenByRemotes = shareScope;
          return () => ({ plugin: () => undefined });
        }
      ),
      registerPluginFactory: jest.fn((id: string) => {
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

  it('loads the shared-deps dependency chunks (in order) BEFORE the entry', async () => {
    const loadOrder: string[] = [];
    const DEP_A = 'http://localhost:8080/shared-deps/osd-ui-shared-deps.@elastic.js';

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        loadOrder.push(url);
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      sharedDepsDepUrls: [DEP_A],
      deps,
    });

    // The dependency chunk must load strictly before the shared-deps entry, since
    // the entry only assigns window.__osdSharedDeps__ once its chunks are present.
    expect(loadOrder.indexOf(DEP_A)).toBeGreaterThanOrEqual(0);
    expect(loadOrder.indexOf(DEP_A)).toBeLessThan(loadOrder.indexOf(SHARED_DEPS_URL));
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

  it('disables a single failed remote (allSettled) and still boots core with the rest', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const factories = new Map<string, () => PluginPublicModule>();
    let coreBooted = false;

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      // `inspector` fails to load; `data` succeeds.
      loadRemoteContainer: jest.fn(async (_remoteEntry: string, scope: string) => {
        if (scope === 'inspector') {
          throw new Error(`boom: ${scope}`);
        }
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string, factory: () => PluginPublicModule) => {
        factories.set(id, factory);
      }),
      invokeCoreBootstrap: jest.fn(async () => {
        coreBooted = true;
      }),
    };

    // A single failed remote MUST NOT reject the whole boot.
    await expect(
      bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps })
    ).resolves.toBeUndefined();

    // Both plugins are registered (the healthy one + a placeholder for the failed
    // one) and core still booted.
    expect(factories.has('data')).toBe(true);
    expect(factories.has('inspector')).toBe(true);
    expect(coreBooted).toBe(true);
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);

    // The failed plugin's registered factory must yield an INERT plugin so OSD
    // core's plugin_reader resolves it (has `.plugin`, instance has setup/start).
    const disabled = factories.get('inspector')!();
    expect(typeof disabled.plugin).toBe('function');
    const instance = disabled.plugin() as {
      setup: () => unknown;
      start: () => unknown;
      stop: () => unknown;
    };
    expect(typeof instance.setup).toBe('function');
    expect(typeof instance.start).toBe('function');
    expect(instance.setup()).toEqual({});
    expect(instance.start()).toEqual({});

    // The failure is logged clearly (per-remote error naming the id + a summary warn).
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('inspector');
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn.mock.calls[0][0]).toContain('inspector');

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('does not log failures and registers all remotes when every remote loads', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const registered = new Set<string>();

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string) => {
        registered.add(id);
      }),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps });

    expect(registered.has('inspector')).toBe(true);
    expect(registered.has('data')).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe('bootstrapMfe — dev URL-override wiring (Phase 5, Story 1)', () => {
  const REGISTRY_INSPECTOR_URL = 'http://localhost:8080/mfe/inspector/remoteEntry.js';
  const REGISTRY_DATA_URL = 'http://localhost:8080/mfe/data/remoteEntry.js';
  const OVERRIDE_INSPECTOR_URL = 'http://localhost:5601/mfe/inspector/remoteEntry.js';

  /**
   * Build deps that record every (remoteEntry, scope) passed to
   * loadRemoteContainer so a test can assert which URL each plugin loaded from.
   */
  function recordingDeps(
    extra: Partial<BootstrapMfeDeps> = {}
  ): { deps: Partial<BootstrapMfeDeps>; loadedByScope: Map<string, string> } {
    const loadedByScope = new Map<string, string>();
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (remoteEntry: string, scope: string) => {
        loadedByScope.set(scope, remoteEntry);
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      // Stub the dev Inspector mount so these load-focused tests don't render
      // the real React/EUI panel; a dedicated describe below asserts the gate.
      mountInspector: jest.fn(),
      ...extra,
    };
    return { deps, loadedByScope };
  }

  it('loads an overridden plugin from its override URL while others use the registry (allowOverride=true)', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () => `?mfe.inspector=${OVERRIDE_INSPECTOR_URL}`,
      readOverrideStorage: () => undefined,
    });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(loadedByScope.get('inspector')).toBe(OVERRIDE_INSPECTOR_URL);
    expect(loadedByScope.get('data')).toBe(REGISTRY_DATA_URL);
  });

  it('applies a base override (?mfe.all) to every plugin, swapping origin but keeping the path', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () => '?mfe.all=http://localhost:5601',
      readOverrideStorage: () => undefined,
    });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(loadedByScope.get('inspector')).toBe(
      'http://localhost:5601/mfe/inspector/remoteEntry.js'
    );
    expect(loadedByScope.get('data')).toBe('http://localhost:5601/mfe/data/remoteEntry.js');
  });

  it('reads a persisted localStorage override when allowOverride=true', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () => '',
      readOverrideStorage: () => ({
        getItem: () => JSON.stringify({ inspector: OVERRIDE_INSPECTOR_URL }),
      }),
    });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(loadedByScope.get('inspector')).toBe(OVERRIDE_INSPECTOR_URL);
  });

  it('IGNORES every override source when the gate is off (allowOverride defaults to false)', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () =>
        `?mfe.inspector=${OVERRIDE_INSPECTOR_URL}&mfe.all=http://localhost:5601`,
      readOverrideStorage: () => ({
        getItem: () => JSON.stringify({ data: 'http://evil/data/remoteEntry.js' }),
      }),
    });

    // No allowOverride passed → defaults to false (production behavior).
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    // Both plugins load from the REGISTRY; the override sources are not consulted.
    expect(loadedByScope.get('inspector')).toBe(REGISTRY_INSPECTOR_URL);
    expect(loadedByScope.get('data')).toBe(REGISTRY_DATA_URL);
  });
});

describe('bootstrapMfe — dev Inspector mount gate (Phase 5, Story 3)', () => {
  /** Minimal happy-path deps plus an injectable mountInspector spy. */
  function inspectorDeps(): {
    deps: Partial<BootstrapMfeDeps>;
    mountInspector: jest.Mock;
  } {
    const mountInspector = jest.fn();
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      mountInspector,
    };
    return { deps, mountInspector };
  }

  it('mounts the inspector with the resolved remotes when allowOverride=true', async () => {
    const { deps, mountInspector } = inspectorDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(mountInspector).toHaveBeenCalledTimes(1);
    const entries = mountInspector.mock.calls[0][0] as Array<{
      id: string;
      remoteEntry: string;
      source: string;
    }>;
    // The inspector receives every registry plugin with its resolved source.
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toEqual(['data', 'inspector']);
    expect(entries.every((e) => e.source === 'registry')).toBe(true);
  });

  it('reports an OVERRIDE source to the inspector for an overridden plugin', async () => {
    const { deps, mountInspector } = inspectorDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps: {
        ...deps,
        readOverrideSearch: () =>
          '?mfe.inspector=http://localhost:5601/mfe/inspector/remoteEntry.js',
        readOverrideStorage: () => undefined,
      },
    });

    const entries = mountInspector.mock.calls[0][0] as Array<{ id: string; source: string }>;
    const byId = Object.fromEntries(entries.map((e) => [e.id, e.source]));
    expect(byId.inspector).toBe('override');
    expect(byId.data).toBe('registry');
  });

  it('does NOT mount the inspector when allowOverride is off (production gate)', async () => {
    const { deps, mountInspector } = inspectorDeps();

    // No allowOverride passed → defaults to false (production behavior).
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    expect(mountInspector).not.toHaveBeenCalled();
  });
});
