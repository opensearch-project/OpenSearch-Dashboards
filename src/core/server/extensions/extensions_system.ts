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
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { ExtensionWrapper } from './extension';
import { DiscoveredExtension, ExtensionName } from './types';
import { createExtensionSetupContext, createExtensionStartContext } from './extension_context';
import { ExtensionsServiceSetupDeps, ExtensionsServiceStartDeps } from './extensions_service';
import { ExtensionDependencies } from '.';

const Sec = 1000;
/** @internal */
export class ExtensionsSystem {
  private readonly extensions = new Map<ExtensionName, ExtensionWrapper>();
  private readonly log: Logger;
  // `satup`, the past-tense version of the noun `setup`.
  private readonly satupExtensions: ExtensionName[] = [];

  constructor(private readonly coreContext: CoreContext) {
    this.log = coreContext.logger.get('extensions-system');
  }

  public addExtension(extension: ExtensionWrapper) {
    this.extensions.set(extension.name, extension);
  }

  /**
   * @returns a ReadonlyMap of each extension and an Array of its available dependencies
   * @internal
   */
  public getExtensionDependencies(): ExtensionDependencies {
    const asNames = new Map(
      [...this.extensions].map(([name, extension]) => [
        extension.name,
        [
          ...new Set([
            ...extension.requiredExtensions,
            ...extension.optionalExtensions.filter((optExtension) =>
              this.extensions.has(optExtension)
            ),
          ]),
        ].map((depId) => this.extensions.get(depId)!.name),
      ])
    );
    const asOpaqueIds = new Map(
      [...this.extensions].map(([name, extension]) => [
        extension.opaqueId,
        [
          ...new Set([
            ...extension.requiredExtensions,
            ...extension.optionalExtensions.filter((optExtension) =>
              this.extensions.has(optExtension)
            ),
          ]),
        ].map((depId) => this.extensions.get(depId)!.opaqueId),
      ])
    );

    return { asNames, asOpaqueIds };
  }

  public async setupExtensions(deps: ExtensionsServiceSetupDeps) {
    const contracts = new Map<ExtensionName, unknown>();
    if (this.extensions.size === 0) {
      return contracts;
    }

    const sortedExtensions = new Map(
      [...this.getTopologicallySortedExtensionNames()]
        .map(
          (extensionName) =>
            [extensionName, this.extensions.get(extensionName)!] as [string, ExtensionWrapper]
        )
        .filter(([extensionName, extension]) => extension.includesServerExtension)
    );
    this.log.info(
      `Setting up [${sortedExtensions.size}] extensions: [${[...sortedExtensions.keys()].join(
        ','
      )}]`
    );

    for (const [extensionName, extension] of sortedExtensions) {
      this.log.debug(`Setting up extension "${extensionName}"...`);
      const extensionDeps = new Set([
        ...extension.requiredExtensions,
        ...extension.optionalExtensions,
      ]);
      const extensionDepContracts = Array.from(extensionDeps).reduce(
        (depContracts, dependencyName) => {
          // Only set if present. Could be absent if extension does not have server-side code or is a
          // missing optional dependency.
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

    return contracts;
  }

  public async startExtensions(deps: ExtensionsServiceStartDeps) {
    const contracts = new Map<ExtensionName, unknown>();
    if (this.satupExtensions.length === 0) {
      return contracts;
    }

    this.log.info(
      `Starting [${this.satupExtensions.length}] extensions: [${[...this.satupExtensions]}]`
    );

    for (const extensionName of this.satupExtensions) {
      this.log.debug(`Starting extension "${extensionName}"...`);
      const extension = this.extensions.get(extensionName)!;
      const extensionDeps = new Set([
        ...extension.requiredExtensions,
        ...extension.optionalExtensions,
      ]);
      const extensionDepContracts = Array.from(extensionDeps).reduce(
        (depContracts, dependencyName) => {
          // Only set if present. Could be absent if extension does not have server-side code or is a
          // missing optional dependency.
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

    return contracts;
  }

  public async stopExtensions() {
    if (this.extensions.size === 0 || this.satupExtensions.length === 0) {
      return;
    }

    this.log.info(`Stopping all extensions.`);

    // Stop extensions in the reverse order of when they were set up.
    while (this.satupExtensions.length > 0) {
      const extensionName = this.satupExtensions.pop()!;

      this.log.debug(`Stopping extension "${extensionName}"...`);
      await this.extensions.get(extensionName)!.stop();
    }
  }

  /**
   * Get a Map of all discovered UI extensions in topological order.
   */
  public uiExtensions() {
    const uiExtensionNames = [...this.getTopologicallySortedExtensionNames().keys()].filter(
      (extensionName) => this.extensions.get(extensionName)!.includesUiExtension
    );
    // TODO: get ui plugin names from plugin service
    const publicExtensions = new Map<ExtensionName, DiscoveredExtension>(
      uiExtensionNames.map((extensionName) => {
        const extension = this.extensions.get(extensionName)!;
        return [
          extensionName,
          {
            extensionId: extensionName,
            configPath: extension.manifest.configPath,
            requiredExtensions: extension.manifest.requiredExtensions.filter((p) =>
              uiExtensionNames.includes(p)
            ),
            optionalExtensions: extension.manifest.optionalExtensions.filter((p) =>
              uiExtensionNames.includes(p)
            ),
            requiredBundles: extension.manifest.requiredBundles,
            requiredPlugins: extension.manifest.requiredPlugins.filter((p) =>
              uiExtensionNames.includes(p)
            ),
            optionalPlugins: extension.manifest.optionalPlugins.filter((p) =>
              uiExtensionNames.includes(p)
            ),
          },
        ];
      })
    );

    return publicExtensions;
  }

  /**
   * Gets topologically sorted extension names that are registered with the extension system.
   * Ordering is possible if and only if the extensions graph has no directed cycles,
   * that is, if it is a directed acyclic graph (DAG). If extensions cannot be ordered
   * an error is thrown.
   *
   * Uses Kahn's Algorithm to sort the graph.
   */
  private getTopologicallySortedExtensionNames() {
    // We clone extensions so we can remove handled nodes while we perform the
    // topological ordering. If the cloned graph is _not_ empty at the end, we
    // know we were not able to topologically order the graph. We exclude optional
    // dependencies that are not present in the extensions graph.
    const extensionsDependenciesGraph = new Map(
      [...this.extensions.entries()].map(([extensionName, extension]) => {
        return [
          extensionName,
          new Set([
            ...extension.requiredExtensions,
            ...extension.optionalExtensions.filter((dependency) => this.extensions.has(dependency)),
          ]),
        ] as [ExtensionName, Set<ExtensionName>];
      })
    );

    // First, find a list of "start nodes" which have no outgoing edges. At least
    // one such node must exist in a non-empty acyclic graph.
    const extensionsWithAllDependenciesSorted = [...extensionsDependenciesGraph.keys()].filter(
      (extensionName) => extensionsDependenciesGraph.get(extensionName)!.size === 0
    );

    const sortedExtensionNames = new Set<ExtensionName>();
    while (extensionsWithAllDependenciesSorted.length > 0) {
      const sortedExtensionName = extensionsWithAllDependenciesSorted.pop()!;

      // We know this extension has all its dependencies sorted, so we can remove it
      // and include into the final result.
      extensionsDependenciesGraph.delete(sortedExtensionName);
      sortedExtensionNames.add(sortedExtensionName);

      // Go through the rest of the extensions and remove `sortedExtensionName` from their
      // unsorted dependencies.
      for (const [extensionName, dependencies] of extensionsDependenciesGraph) {
        // If we managed delete `sortedExtensionName` from dependencies let's check
        // whether it was the last one and we can mark extension as sorted.
        if (dependencies.delete(sortedExtensionName) && dependencies.size === 0) {
          extensionsWithAllDependenciesSorted.push(extensionName);
        }
      }
    }

    if (extensionsDependenciesGraph.size > 0) {
      const edgesLeft = JSON.stringify([...extensionsDependenciesGraph.keys()]);
      throw new Error(
        `Topological ordering of extensions did not complete, these extensions have cyclic or missing dependencies: ${edgesLeft}`
      );
    }

    return sortedExtensionNames;
  }
}
