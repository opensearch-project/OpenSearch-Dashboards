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

import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { DiscoveredExtension, ExtensionOpaqueId } from '../../server';
import { ExtensionInitializerContext } from './extension_context';
import { read } from './extension_reader';
import { CoreStart, CoreSetupForExtension } from '..';

/**
 * The interface that should be returned by a `ExtensionInitializer`.
 *
 * @public
 */
export interface Extension<
  TSetup = void,
  TStart = void,
  TExtensionsSetup extends object = object,
  TExtensionsStart extends object = object
> {
  setup(
    core: CoreSetupForExtension<TExtensionsStart, TStart>,
    extensions: TExtensionsSetup
  ): TSetup | Promise<TSetup>;
  start(core: CoreStart, extensions: TExtensionsStart): TStart | Promise<TStart>;
  stop?(): void;
}

/**
 * The `extension` export at the root of a extension's `public` directory should conform
 * to this interface.
 *
 * @public
 */
export type ExtensionInitializer<
  TSetup,
  TStart,
  TExtensionsSetup extends object = object,
  TExtensionsStart extends object = object
> = (
  core: ExtensionInitializerContext
) => Extension<TSetup, TStart, TExtensionsSetup, TExtensionsStart>;

/**
 * Lightweight wrapper around discovered extension that is responsible for instantiating
 * extension and dispatching proper context and dependencies into extension's lifecycle hooks.
 *
 * @internal
 */
export class ExtensionWrapper<
  TSetup = unknown,
  TStart = unknown,
  TExtensionsSetup extends object = object,
  TExtensionsStart extends object = object
> {
  public readonly name: DiscoveredExtension['extensionId'];
  public readonly configPath: DiscoveredExtension['configPath'];
  public readonly requiredExtensions: DiscoveredExtension['requiredExtensions'];
  public readonly optionalExtensions: DiscoveredExtension['optionalExtensions'];
  public readonly requiredPlugins: DiscoveredExtension['requiredPlugins'];
  public readonly optionalPlugins: DiscoveredExtension['optionalPlugins'];
  private instance?: Extension<TSetup, TStart, TExtensionsSetup, TExtensionsStart>;

  private readonly startDependencies$ = new Subject<[CoreStart, TExtensionsStart, TStart]>();
  public readonly startDependencies = this.startDependencies$.pipe(first()).toPromise();

  constructor(
    public readonly discoveredExtension: DiscoveredExtension,
    public readonly opaqueId: ExtensionOpaqueId,
    private readonly initializerContext: ExtensionInitializerContext
  ) {
    this.name = discoveredExtension.extensionId;
    this.configPath = discoveredExtension.configPath;
    this.requiredExtensions = discoveredExtension.requiredExtensions;
    this.optionalExtensions = discoveredExtension.optionalExtensions;
    this.requiredPlugins = discoveredExtension.requiredPlugins;
    this.optionalPlugins = discoveredExtension.optionalPlugins;
  }

  /**
   * Instantiates extension and calls `setup` function exposed by the extension initializer.
   * @param setupContext Context that consists of various core services tailored specifically
   * for the `setup` lifecycle event.
   * @param extensions The dictionary where the key is the dependency name and the value
   * is the contract returned by the dependency's `setup` function.
   */
  public async setup(
    setupContext: CoreSetupForExtension<TExtensionsStart, TStart>,
    extensions: TExtensionsSetup
  ) {
    this.instance = await this.createExtensionInstance();

    return await this.instance.setup(setupContext, extensions);
  }

  /**
   * Calls `setup` function exposed by the initialized extension.
   * @param startContext Context that consists of various core services tailored specifically
   * for the `start` lifecycle event.
   * @param extensions The dictionary where the key is the dependency name and the value
   * is the contract returned by the dependency's `start` function.
   */
  public async start(startContext: CoreStart, extensions: TExtensionsStart) {
    if (this.instance === undefined) {
      throw new Error(`Extension "${this.name}" can't be started since it isn't set up.`);
    }

    const startContract = await this.instance.start(startContext, extensions);

    this.startDependencies$.next([startContext, extensions, startContract]);

    return startContract;
  }

  /**
   * Calls optional `stop` function exposed by the extension initializer.
   */
  public stop() {
    if (this.instance === undefined) {
      throw new Error(`Extension "${this.name}" can't be stopped since it isn't set up.`);
    }

    if (typeof this.instance.stop === 'function') {
      this.instance.stop();
    }

    this.instance = undefined;
  }

  private async createExtensionInstance() {
    const initializer = read(this.name) as ExtensionInitializer<
      TSetup,
      TStart,
      TExtensionsSetup,
      TExtensionsStart
    >;

    const instance = initializer(this.initializerContext);

    if (typeof instance.setup !== 'function') {
      throw new Error(`Instance of extension "${this.name}" does not define "setup" function.`);
    } else if (typeof instance.start !== 'function') {
      throw new Error(`Instance of extension "${this.name}" does not define "start" function.`);
    }

    return instance;
  }
}
