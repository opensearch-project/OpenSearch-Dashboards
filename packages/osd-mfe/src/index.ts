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

export { discoverUiPlugins } from './discover_plugins';
export type { DiscoveredUiPlugin } from './discover_plugins';
export { getMfeRspackConfig } from './mfe_rspack_config';
export type { MfeRspackConfigOptions } from './mfe_rspack_config';
export { getMfeSharedConfig, getMfeExternals, getSharedPackageRoots } from './mfe_shared_deps';
export type { MfeSharedConfig, MfeSharedMap } from './mfe_shared_deps';
export { buildMfeForPlugin, buildAllMfe } from './build_mfe_for_plugin';
export type {
  MfeBuildResult,
  MfeBuildAllResult,
  MfeBuildFailure,
  BuildAllMfeOptions,
} from './build_mfe_for_plugin';
export { runCli } from './cli';

// Registry (Phase 2): schema, validation, and generation logic. The registry
// DATA file lives outside the source tree (workspace-root registry/registry.json)
// and is read at serve time — never imported as a code constant.
export {
  SCHEMA_VERSION,
  validate,
  assertValidRegistry,
  generateRegistry,
  runUpdateCli,
} from './registry';
export type {
  Registry,
  MfeEntry,
  SharedDepsDescriptor,
  ValidationResult,
  GenerateRegistryOptions,
} from './registry';
