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

import { withTimeout } from '@osd/std';
import { ExtensionName, ExtensionOpaqueId } from '../../server';
import { CoreService } from '../../types';
import { CoreContext } from '../core_system';
import { ExtensionWrapper } from './extension';
import {
  createExtensionInitializerContext,
  createExtensionSetupContext,
  createExtensionStartContext,
} from './extension_context';
import { InternalCoreSetup, InternalCoreStart } from '../core_system';
import { InjectedExtensionMetadata } from '../injected_metadata';

const Sec = 1000;
/** @internal */
export type ExtensionsServiceSetupDeps = InternalCoreSetup;
/** @internal */
export type ExtensionsServiceStartDeps = InternalCoreStart;

/** @internal */
export interface ExtensionsServiceSetup {
  contracts: ReadonlyMap<string, unknown>;
}
/** @internal */
export interface ExtensionsServiceStart {
  contracts: ReadonlyMap<string, unknown>;
}

/**
 * Service responsible for loading extension bundles, initializing extensions, and managing the lifecycle
 * of all extensions.
 *
 * @internal
 */
export class ExtensionsService
  implements CoreService<ExtensionsServiceSetup, ExtensionsServiceStart> {
  /** Extension wrappers in topological order. */
  private readonly extensions = new Map<ExtensionName, ExtensionWrapper<unknown, unknown>>();
  private readonly extensionDependencies = new Map<ExtensionName, ExtensionName[]>();

  private readonly satupExtensions: ExtensionName[] = [];

  constructor(private readonly coreContext: CoreContext, extensions: InjectedExtensionMetadata[]) {
    // Generate opaque ids
    const opaqueIds = new Map<ExtensionName, ExtensionOpaqueId>(
      extensions.map((p) => [p.extensionId, Symbol(p.extensionId)])
    );

    // Setup dependency map and extension wrappers
    extensions.forEach(({ extensionId, extension, config = {} }) => {
      // Setup map of dependencies
      this.extensionDependencies.set(extensionId, [
        ...extension.requiredExtensions,
        ...extension.optionalExtensions.filter((optExtension) => opaqueIds.has(optExtension)),
        ...extension.requiredPlugins,
        ...extension.optionalPlugins.filter((optPlugin) => opaqueIds.has(optPlugin)),
      ]);

      // Construct extension wrappers, depending on the topological order set by the server.
      this.extensions.set(
        extensionId,
        new ExtensionWrapper(
          extension,
          opaqueIds.get(extensionId)!,
          createExtensionInitializerContext(
            this.coreContext,
            opaqueIds.get(extensionId)!,
            extension,
            config
          )
        )
      );
    });
  }

  public getOpaqueIds(): ReadonlyMap<ExtensionOpaqueId, ExtensionOpaqueId[]> {
    // Return dependency map of opaque ids
    return new Map(
      [...this.extensionDependencies].map(([extensionId, deps]) => [
        this.extensions.get(extensionId)!.opaqueId,
        deps.map((depId) => this.extensions.get(depId)!.opaqueId),
      ])
    );
  }

  public async setup(deps: ExtensionsServiceSetupDeps): Promise<ExtensionsServiceSetup> {
    // Setup each extension with required and optional extension contracts
    const contracts = new Map<string, unknown>();
    for (const [extensionName, extension] of this.extensions.entries()) {
      const extensionDepContracts = [...this.extensionDependencies.get(extensionName)!].reduce(
        (depContracts, dependencyName) => {
          // Only set if present. Could be absent if extension does not have client-side code or is a
          // missing optional extension.
          if (contracts.has(dependencyName)) {
            depContracts[dependencyName] = contracts.get(dependencyName);
          }

          return depContracts;
        },
        {} as Record<ExtensionName, unknown>
      );

      const contract = await withTimeout({
        promise: extension.setup(
          createExtensionSetupContext(this.coreContext, deps, extension),
          extensionDepContracts
        ),
        timeout: 30 * Sec,
        errorMessage: `Setup lifecycle of "${extensionName}" extension wasn't completed in 30sec. Consider disabling the extension and re-start.`,
      });
      contracts.set(extensionName, contract);

      this.satupExtensions.push(extensionName);
    }

    // Expose setup contracts
    return { contracts };
  }

  public async start(deps: ExtensionsServiceStartDeps): Promise<ExtensionsServiceStart> {
    // Setup each extension with required and optional extension contracts
    const contracts = new Map<string, unknown>();
    for (const [extensionName, extension] of this.extensions.entries()) {
      const extensionDepContracts = [...this.extensionDependencies.get(extensionName)!].reduce(
        (depContracts, dependencyName) => {
          // Only set if present. Could be absent if extension does not have client-side code or is a
          // missing optional extension.
          if (contracts.has(dependencyName)) {
            depContracts[dependencyName] = contracts.get(dependencyName);
          }

          return depContracts;
        },
        {} as Record<ExtensionName, unknown>
      );

      const contract = await withTimeout({
        promise: extension.start(
          createExtensionStartContext(this.coreContext, deps, extension),
          extensionDepContracts
        ),
        timeout: 30 * Sec,
        errorMessage: `Start lifecycle of "${extensionName}" extension wasn't completed in 30sec. Consider disabling the extension and re-start.`,
      });
      contracts.set(extensionName, contract);
    }

    // Expose start contracts
    return { contracts };
  }

  public async stop() {
    // Stop extensions in reverse topological order.
    for (const extensionName of this.satupExtensions.reverse()) {
      this.extensions.get(extensionName)!.stop();
    }
  }
}
