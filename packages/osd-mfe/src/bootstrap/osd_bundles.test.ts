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

import {
  invokeCoreBootstrap,
  isPluginRegistered,
  pluginBundleKey,
  registerPlugin,
} from './osd_bundles';
import { MfeBrowserWindow, OsdBundlesShim } from './types';

/**
 * A faithful reimplementation of the real `__osdBundles__` shim
 * (src/legacy/ui/ui_render/bootstrap/osd_bundles_loader_source.js): `define`
 * stores a thunk, `get` CALLS it.
 */
function createShim(): OsdBundlesShim {
  const modules: Record<string, () => unknown> = {};
  return {
    has: (key) => Object.prototype.hasOwnProperty.call(modules, key),
    define: (key, bundleRequire) => {
      if (Object.prototype.hasOwnProperty.call(modules, key)) {
        throw new Error(`bundle named "${key}" has already been defined`);
      }
      modules[key] = bundleRequire;
    },
    get: (key) => {
      if (!Object.prototype.hasOwnProperty.call(modules, key)) {
        throw new Error(`bundle named "${key}" has not been defined`);
      }
      return modules[key]();
    },
  };
}

function testWindow(): MfeBrowserWindow {
  return (window as unknown) as MfeBrowserWindow;
}

describe('osd_bundles shim bridge', () => {
  beforeEach(() => {
    testWindow().__osdBundles__ = createShim();
  });

  it('derives the plugin/<id>/public key', () => {
    expect(pluginBundleKey('inspector')).toBe('plugin/inspector/public');
  });

  it('registers a remote-loaded plugin so plugin_reader resolves it synchronously', () => {
    const initializer = () => ({ setup: () => undefined });
    const mod = { plugin: initializer };

    registerPlugin('inspector', mod);

    expect(isPluginRegistered('inspector')).toBe(true);
    const resolved = testWindow().__osdBundles__.get('plugin/inspector/public') as {
      plugin: unknown;
    };
    // plugin_reader requires `.plugin` to be a function and returns it as-is.
    expect(resolved).toBe(mod);
    expect(typeof resolved.plugin).toBe('function');
  });

  it('is a no-op when a plugin is already registered (no duplicate-define throw)', () => {
    const first = { plugin: () => undefined };
    const second = { plugin: () => undefined };

    registerPlugin('inspector', first);
    expect(() => registerPlugin('inspector', second)).not.toThrow();

    // The first registration wins; the second is ignored.
    expect(testWindow().__osdBundles__.get('plugin/inspector/public')).toBe(first);
  });

  it('invokeCoreBootstrap calls __osdBootstrap__ on the core entry module', async () => {
    const bootstrap = jest.fn().mockResolvedValue(undefined);
    testWindow().__osdBundles__.define('entry/core/public', () => ({
      __osdBootstrap__: bootstrap,
    }));

    await invokeCoreBootstrap();

    expect(bootstrap).toHaveBeenCalledTimes(1);
  });
});
