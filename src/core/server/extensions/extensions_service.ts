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

import Path from 'path';
import { Observable } from 'rxjs';
import { filter, first, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { pick } from '@osd/std';

import { CoreService } from '../../types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { discover, ExtensionDiscoveryError, ExtensionDiscoveryErrorType } from './discovery';
import { ExtensionWrapper } from './extension';
import {
  DiscoveredExtension,
  ExtensionConfigDescriptor,
  ExtensionName,
  InternalExtensionInfo,
} from './types';
import { ExtensionsConfig, ExtensionsConfigType } from './extensions_config';
import { ExtensionsSystem } from './extensions_system';
import { InternalCoreSetup, InternalCoreStart } from '../internal_types';
import { IConfigService } from '../config';
import { InternalEnvironmentServiceSetup } from '../environment';

/** @internal */
export interface ExtensionsServiceSetup {
  /** Indicates whether or not extensions were initialized. */
  initialized: boolean;
  /** Setup contracts returned by extensions. */
  contracts: Map<ExtensionName, unknown>;
}

/** @internal */
export interface UiExtensions {
  /**
   * Paths to all discovered ui extension entrypoints on the filesystem, even if
   * disabled.
   */
  internal: Map<ExtensionName, InternalExtensionInfo>;

  /**
   * Information needed by client-side to load extensions and wire dependencies.
   */
  public: Map<ExtensionName, DiscoveredExtension>;

  /**
   * Configuration for extensions to be exposed to the client-side.
   */
  browserConfigs: Map<ExtensionName, Observable<unknown>>;
}

/** @internal */
export interface ExtensionsServiceStart {
  /** Start contracts returned by extensions. */
  contracts: Map<ExtensionName, unknown>;
}

/** @internal */
export type ExtensionsServiceSetupDeps = InternalCoreSetup;

/** @internal */
export type ExtensionsServiceStartDeps = InternalCoreStart;

/** @internal */
export interface ExtensionsServiceDiscoverDeps {
  environment: InternalEnvironmentServiceSetup;
}

/** @internal */
export class ExtensionsService
  implements CoreService<ExtensionsServiceSetup, ExtensionsServiceStart> {
  private readonly log: Logger;
  private readonly extensionsSystem: ExtensionsSystem;
  private readonly configService: IConfigService;
  private readonly config$: Observable<ExtensionsConfig>;
  private readonly extensionConfigDescriptors = new Map<ExtensionName, ExtensionConfigDescriptor>();
  private readonly uiExtensionInternalInfo = new Map<ExtensionName, InternalExtensionInfo>();

  constructor(private readonly coreContext: CoreContext) {
    this.log = coreContext.logger.get('extensions-service');
    this.extensionsSystem = new ExtensionsSystem(coreContext);
    this.configService = coreContext.configService;
    this.config$ = coreContext.configService
      .atPath<ExtensionsConfigType>('extensions')
      .pipe(map((rawConfig) => new ExtensionsConfig(rawConfig, coreContext.env)));
  }

  public async discover({ environment }: ExtensionsServiceDiscoverDeps) {
    this.log.debug('Discovering extensions');

    const config = await this.config$.pipe(first()).toPromise();

    const { error$, extension$ } = discover(config, this.coreContext, {
      uuid: environment.instanceUuid,
    });
    await this.handleDiscoveryErrors(error$);
    await this.handleDiscoveredExtensions(extension$);

    const uiExtensions = this.extensionsSystem.uiExtensions();

    return {
      // Return dependency tree
      extensionTree: this.extensionsSystem.getExtensionDependencies(),
      uiExtensions: {
        internal: this.uiExtensionInternalInfo,
        public: uiExtensions,
        browserConfigs: this.generateUiExtensionsConfigs(uiExtensions),
      },
    };
  }

  public async setup(deps: ExtensionsServiceSetupDeps) {
    this.log.debug('Setting up extensions service');

    const config = await this.config$.pipe(first()).toPromise();

    let contracts = new Map<ExtensionName, unknown>();
    const initialize = config.initialize && !this.coreContext.env.isDevClusterManager;
    if (initialize) {
      contracts = await this.extensionsSystem.setupExtensions(deps);
      this.registerExtensionStaticDirs(deps);
    } else {
      this.log.info('Extension initialization disabled.');
    }

    return {
      initialized: initialize,
      contracts,
    };
  }

  public async start(deps: ExtensionsServiceStartDeps) {
    this.log.debug('Extensions service starts extensions');
    const contracts = await this.extensionsSystem.startExtensions(deps);
    return { contracts };
  }

  public async stop() {
    this.log.debug('Stopping extensions service');
    await this.extensionsSystem.stopExtensions();
  }

  private generateUiExtensionsConfigs(
    uiExtensions: Map<string, DiscoveredExtension>
  ): Map<ExtensionName, Observable<unknown>> {
    return new Map(
      [...uiExtensions]
        .filter(([extensionId, _]) => {
          const configDescriptor = this.extensionConfigDescriptors.get(extensionId);
          return (
            configDescriptor &&
            configDescriptor.exposeToBrowser &&
            Object.values(configDescriptor?.exposeToBrowser).some((exposed) => exposed)
          );
        })
        .map(([extensionId, extension]) => {
          const configDescriptor = this.extensionConfigDescriptors.get(extensionId)!;
          return [
            extensionId,
            this.configService.atPath(extension.configPath).pipe(
              map((config: any) =>
                pick(
                  config || {},
                  Object.entries(configDescriptor.exposeToBrowser!)
                    .filter(([_, exposed]) => exposed)
                    .map(([key, _]) => key)
                )
              )
            ),
          ];
        })
    );
  }

  private async handleDiscoveryErrors(error$: Observable<ExtensionDiscoveryError>) {
    // At this stage we report only errors that can occur when new platform extension
    // manifest is present, otherwise we can't be sure that the extension is for the new
    // platform and let legacy platform to handle it.
    const errorTypesToReport = [
      ExtensionDiscoveryErrorType.IncompatibleVersion,
      ExtensionDiscoveryErrorType.InvalidManifest,
    ];

    const errors = await error$
      .pipe(
        filter((error) => errorTypesToReport.includes(error.type)),
        tap((extensionError) => this.log.error(extensionError)),
        toArray()
      )
      .toPromise();
    if (errors.length > 0) {
      throw new Error(
        `Failed to initialize extensions:${errors.map((err) => `\n\t${err.message}`).join('')}`
      );
    }
  }

  private async handleDiscoveredExtensions(extension$: Observable<ExtensionWrapper>) {
    const extensionEnableStatuses = new Map<
      ExtensionName,
      { extension: ExtensionWrapper; isEnabled: boolean }
    >();
    await extension$
      .pipe(
        mergeMap(async (extension) => {
          const configDescriptor = extension.getConfigDescriptor();
          if (configDescriptor) {
            this.extensionConfigDescriptors.set(extension.name, configDescriptor);
            if (configDescriptor.deprecations) {
              this.coreContext.configService.addDeprecationProvider(
                extension.configPath,
                configDescriptor.deprecations
              );
            }
            await this.coreContext.configService.setSchema(
              extension.configPath,
              configDescriptor.schema
            );
          }
          const isEnabled = await this.coreContext.configService.isEnabledAtPath(
            extension.configPath
          );

          if (extensionEnableStatuses.has(extension.name)) {
            throw new Error(`Extension with id "${extension.name}" is already registered!`);
          }

          if (extension.includesUiExtension) {
            this.uiExtensionInternalInfo.set(extension.name, {
              requiredBundles: extension.requiredBundles,
              publicTargetDir: Path.resolve(extension.path, 'target/public'),
              publicAssetsDir: Path.resolve(extension.path, 'public/assets'),
            });
          }

          extensionEnableStatuses.set(extension.name, { extension, isEnabled });
        })
      )
      .toPromise();

    for (const [extensionName, { extension, isEnabled }] of extensionEnableStatuses) {
      // validate that `requiredBundles` ids point to a discovered extension which `includesUiExtension`
      for (const requiredBundleId of extension.requiredBundles) {
        if (!extensionEnableStatuses.has(requiredBundleId)) {
          throw new Error(
            `Extension bundle with id "${requiredBundleId}" is required by extension "${extensionName}" but it is missing.`
          );
        }

        if (!extensionEnableStatuses.get(requiredBundleId)!.extension.includesUiExtension) {
          throw new Error(
            `Extension bundle with id "${requiredBundleId}" is required by extension "${extensionName}" but it doesn't have a UI bundle.`
          );
        }
      }

      const extensionEnablement = this.shouldEnableExtension(
        extensionName,
        extensionEnableStatuses
      );

      if (extensionEnablement.enabled) {
        this.extensionsSystem.addExtension(extension);
      } else if (isEnabled) {
        this.log.info(
          `Extension "${extensionName}" has been disabled since the following direct or transitive dependencies are missing or disabled: [${extensionEnablement.missingDependencies.join(
            ', '
          )}]`
        );
      } else {
        this.log.info(`Extension "${extensionName}" is disabled.`);
      }
    }

    this.log.debug(`Discovered ${extensionEnableStatuses.size} extensions.`);
  }

  private shouldEnableExtension(
    extensionName: ExtensionName,
    extensionEnableStatuses: Map<
      ExtensionName,
      { extension: ExtensionWrapper; isEnabled: boolean }
    >,
    parents: ExtensionName[] = []
  ): { enabled: true } | { enabled: false; missingDependencies: string[] } {
    const extensionInfo = extensionEnableStatuses.get(extensionName);

    if (extensionInfo === undefined || !extensionInfo.isEnabled) {
      return {
        enabled: false,
        missingDependencies: [],
      };
    }

    const missingDependencies = extensionInfo.extension.requiredExtensions
      .filter((dep) => !parents.includes(dep))
      .filter(
        (dependencyName) =>
          !this.shouldEnableExtension(dependencyName, extensionEnableStatuses, [
            ...parents,
            extensionName,
          ]).enabled
      );

    if (missingDependencies.length === 0) {
      return {
        enabled: true,
      };
    }

    return {
      enabled: false,
      missingDependencies,
    };
  }

  private registerExtensionStaticDirs(deps: ExtensionsServiceSetupDeps) {
    for (const [extensionName, extensionInfo] of this.uiExtensionInternalInfo) {
      deps.http.registerStaticDir(
        `/extensions/${extensionName}/assets/{path*}`,
        extensionInfo.publicAssetsDir
      );
    }
  }
}
