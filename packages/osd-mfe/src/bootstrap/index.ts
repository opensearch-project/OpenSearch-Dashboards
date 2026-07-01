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
 * Public surface of the browser MFE bootstrap.
 *
 * This is the BROWSER entry for MFE mode and is intentionally NOT re-exported
 * from the package's node `src/index.ts` (which serves the build/registry CLIs).
 * The server render branch loads this as a script in `--mfe` mode only.
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

export { resolveCompatPolicy } from './compat_policy';
export type {
  CompatPolicy,
  CompatPolicyConfig,
  IncompatibleAction,
  MissingAction,
} from './compat_policy';

export { decideCompat, decideRemoteCompat } from './compat_enforcement';
export type { CompatAction, CompatDecision, EvaluatedRemote } from './compat_enforcement';

export { COMPAT_BLOCK_ROOT_ID, renderCompatBlockPage } from './compat_block_page';

export {
  CHUNK_ERROR_ROOT_ID,
  isChunkLoadFailure,
  renderChunkErrorSurface,
  installChunkErrorSurface,
} from './chunk_error_surface';
export type { ChunkErrorDetail, ChunkErrorSurfaceDeps } from './chunk_error_surface';

export { createTelemetryDispatcher } from './telemetry';
export type {
  CreateTelemetryDispatcherDeps,
  MfeLoadTelemetryEvent,
  MfeLoadTelemetryInput,
  TelemetryDispatcher,
  TelemetryDispatcherConfig,
  TelemetryErrorClass,
  TelemetryStatus,
} from './telemetry';

export {
  OVERRIDE_STORAGE_KEY,
  parseQueryOverrides,
  parseStorageOverrides,
  parseOverrideSources,
  buildOverrideMap,
  resolveAllowOverride,
} from './override_sources';
export type { ParsedOverrides, OverrideSourcesInput, OverrideStorage } from './override_sources';

export {
  INSPECTOR_ROOT_ID,
  DISABLED_SECTION_TEST_SUBJ,
  MfeInspector,
  applyOverride,
  clearOverride,
  mountInspector,
} from './inspector';
export type {
  InspectorEntry,
  MfeInspectorProps,
  InspectorEnv,
  OverrideWritableStorage,
  MountInspectorOptions,
} from './inspector';

export {
  DEGRADED_APP_TEST_SUBJ,
  DEGRADED_APP_CLASS,
  createDisabledPluginModuleWithReason,
  createDisabledPluginRecord,
  humanReasonFor,
  renderDegradedAppContent,
} from './disabled_plugin';
export type { DisabledPluginRecord } from './disabled_plugin';
