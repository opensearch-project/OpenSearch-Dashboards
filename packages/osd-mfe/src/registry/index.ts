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
 * Public surface of the MFE registry (Phase 2).
 *
 * NOTE: this exports the schema + generation/validation LOGIC only. The registry
 * DATA file (`registry/registry.json`) is never imported from here — it is read
 * from the filesystem at serve time via the (Story 2) RegistryProvider.
 */

export { SCHEMA_VERSION, validate, assertValidRegistry } from './schema';
export type { Registry, MfeEntry, SharedDepsDescriptor, ValidationResult } from './schema';

export {
  SCHEMA_VERSION_V2,
  validateV2,
  assertValidV2Document,
  migrateV1ToV2,
  detectRegistryShape,
  coerceToV2Document,
} from './schema_v2';
export type {
  V2Document,
  V2DefaultLayer,
  V2Rollout,
  V2RolloutMatch,
  V2RolloutOverride,
  V2TenantOverride,
  ResolutionDimensions,
  DetectedRegistryShape,
} from './schema_v2';

export { validateBootManifest, assertValidBootManifest } from './boot_manifest';
export type { BootManifest, BootManifestEntry } from './boot_manifest';

export { resolveBootManifest, resolveDecisions, matchesRollout } from './resolve_v2';
export type { ResolvedDecision, ResolvedSource } from './resolve_v2';

export { FileRegistryReader } from './reader';
export type {
  RegistryReader,
  RegistryReaderFs,
  FileRegistryReaderOptions,
} from './reader';

export { signRegistry, verifyRegistrySignature } from './signing';
export type { RegistrySigningKey } from './signing';
export { REGISTRY_SIGNATURE_ALGORITHM, canonicalRegistryString } from './signing_common';
export type { RegistrySignature, RegistryVerification, SignatureCheck } from './signing_common';
export { verifyRegistrySignatureWeb } from './verify_registry_web';

export { generateRegistry } from './generate';
export type { GenerateRegistryOptions } from './generate';

export { FileRegistryProvider } from './provider';
export type { RegistryProvider, RegistryFs, FileRegistryProviderOptions } from './provider';

export { resolve } from './resolve';
export type { ResolvedRemote, OverrideMap } from './resolve';

export { classifyCompatibility } from './compat_classifier';
export type {
  Compatibility,
  HostEnvironment,
  RemoteCompatMetadata,
  CompatibilityResult,
} from './compat_classifier';

export { runUpdateCli, resolveRegistryPath, buildRegistryFromManifest } from './update_cli';
export type { UpdateCliConsole } from './update_cli';

export {
  runUpdateCliV2,
  isV2Mode,
  parseKeyValuePairs,
  applySetDefaultEntry,
  applyAddRollout,
  applyRemoveRollout,
  applyTenantOverride,
  applyRemoveTenantOverride,
  applyRollback,
  checkDependencyGraph,
} from './update_cli_v2';
export type {
  UpdateCliV2Console,
  AuditEntry,
  AuditLog,
  AuditOp,
  ExternalsFile,
  CheckDepsResult,
} from './update_cli_v2';
