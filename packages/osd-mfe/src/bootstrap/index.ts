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

/**
 * Public surface of the browser MFE bootstrap (Phase 3, Story 3).
 *
 * This is the BROWSER entry for MFE mode and is intentionally NOT re-exported
 * from the package's node `src/index.ts` (which serves the build/registry CLIs).
 * The Phase 3 server render branch loads this as a script in `--mfe` mode only.
 */

export {
  SharedModuleRecord,
  ShareScope,
  MfeContainer,
  PluginPublicModule,
  OsdBundlesShim,
  CoreEntryModule,
  MfeBrowserWindow,
  mfeWindow,
} from './types';

export { SHARED_SINGLETONS, readVersion, buildShareScope } from './share_scope';

export { loadScript, loadRemoteContainer, getRemoteModule } from './load_remote';

export {
  pluginBundleKey,
  registerPlugin,
  isPluginRegistered,
  invokeCoreBootstrap,
} from './osd_bundles';

export { bootstrapMfe } from './bootstrap_mfe';
export type { BootstrapMfeOptions, BootstrapMfeDeps } from './bootstrap_mfe';
