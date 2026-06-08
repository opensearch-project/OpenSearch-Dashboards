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

export { generateRegistry } from './generate';
export type { GenerateRegistryOptions } from './generate';

export { FileRegistryProvider } from './provider';
export type { RegistryProvider, RegistryFs, FileRegistryProviderOptions } from './provider';

export { resolve } from './resolve';
export type { ResolvedRemote, OverrideMap } from './resolve';

export { runUpdateCli, resolveRegistryPath } from './update_cli';
export type { UpdateCliConsole } from './update_cli';
