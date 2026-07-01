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
 * Public surface of the MFE registry.
 *
 * NOTE: this exports the schema + generation/validation LOGIC only. The
 * registry DATA file (`registry/registry.json`) is never imported from here
 * — it is read from the filesystem at serve time via the
 * `FileRegistryReader`.
 */

export {
  SCHEMA_VERSION,
  validate,
  validateRegistry,
  assertValidRegistry,
  assertValidRegistryDocument,
} from './schema';
export type {
  Registry,
  RegistryDocument,
  AssetDescriptor,
  DefaultLayer,
  Rollout,
  RolloutMatch,
  RolloutOverride,
  TenantOverride,
  ResolutionDimensions,
  MfeEntry,
  SharedDepsDescriptor,
  BuiltAgainst,
  CompatDeclaration,
  ValidationResult,
} from './schema';

export { validateBootManifest, assertValidBootManifest } from './boot_manifest';
export type { BootManifest, BootManifestEntry } from './boot_manifest';

export { resolveBootManifest, resolveDecisions, matchesRollout } from './resolve';
export type { ResolvedDecision, ResolvedSource } from './resolve';

export { FileRegistryReader } from './reader';
export type { RegistryReader, RegistryReaderFs, FileRegistryReaderOptions } from './reader';

export { signRegistry, verifyRegistrySignature } from './signing';
export type { RegistrySigningKey } from './signing';
export { REGISTRY_SIGNATURE_ALGORITHM, canonicalRegistryString } from './signing_common';
export type { RegistrySignature, RegistryVerification, SignatureCheck } from './signing_common';
export { verifyRegistrySignatureWeb } from './verify_registry_web';

export { generateRegistry } from './generate';
export type { GenerateRegistryOptions } from './generate';

export { FileRegistryProvider } from './provider';
export type { RegistryProvider, RegistryFs, FileRegistryProviderOptions } from './provider';

export { resolve } from './dev_override';
export type { ResolvedRemote, OverrideMap } from './dev_override';

export { classifyCompatibility } from './compat_classifier';
export type {
  Compatibility,
  HostEnvironment,
  RemoteCompatMetadata,
  CompatibilityResult,
} from './compat_classifier';

export {
  runUpdateCli,
  resolveRegistryPath,
  buildRegistryFromManifest,
  mergeRegistryFromManifest,
  parseKeyValuePairs,
  applySetDefaultEntry,
  applyAddRollout,
  applyRemoveRollout,
  applyTenantOverride,
  applyRemoveTenantOverride,
  applyRollback,
  checkDependencyGraph,
} from './update_cli';
export type {
  UpdateCliConsole,
  AuditEntry,
  AuditLog,
  AuditOp,
  ExternalsFile,
  CheckDepsResult,
} from './update_cli';

export {
  ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
  stageAsset,
  readAssetBuildManifest,
  manifestToAssetDescriptor,
  defaultSourcePath,
  defaultTargetRoot,
} from './asset_build';
export type {
  AssetKind,
  AssetBuildManifest,
  StagedFile,
  StageAssetOptions,
} from './asset_build';
