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

import { posix } from 'path';
import typeDetect from 'type-detect';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { isConfigSchema } from '@osd/config-schema';

import { Logger } from '../logging';
import {
  Extension,
  ExtensionInitializerContext,
  ExtensionManifest,
  ExtensionInitializer,
  ExtensionOpaqueId,
  ExtensionConfigDescriptor,
} from './types';
import { CoreSetupForExtension, CoreStart } from '..';

const { join } = posix;

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
  public readonly path: string;
  public readonly manifest: ExtensionManifest;
  public readonly opaqueId: ExtensionOpaqueId;
  public readonly name: ExtensionManifest['extensionId'];
  public readonly configPath: ExtensionManifest['configPath'];
  public readonly requiredExtensions: ExtensionManifest['requiredExtensions'];
  public readonly optionalExtensions: ExtensionManifest['optionalExtensions'];
  public readonly requiredBundles: ExtensionManifest['requiredBundles'];
  public readonly includesServerExtension: ExtensionManifest['server'];
  public readonly includesUiExtension: ExtensionManifest['ui'];

  private readonly log: Logger;
  private readonly initializerContext: ExtensionInitializerContext;

  private instance?: Extension<TSetup, TStart, TExtensionsSetup, TExtensionsStart>;

  private readonly startDependencies$ = new Subject<[CoreStart, TExtensionsStart, TStart]>();
  public readonly startDependencies = this.startDependencies$.pipe(first()).toPromise();

  constructor(
    public readonly params: {
      readonly path: string;
      readonly manifest: ExtensionManifest;
      readonly opaqueId: ExtensionOpaqueId;
      readonly initializerContext: ExtensionInitializerContext;
    }
  ) {
    this.path = params.path;
    this.manifest = params.manifest;
    this.opaqueId = params.opaqueId;
    this.initializerContext = params.initializerContext;
    this.log = params.initializerContext.logger.get();
    this.name = params.manifest.extensionId;
    this.configPath = params.manifest.configPath;
    this.requiredExtensions = params.manifest.requiredExtensions;
    this.optionalExtensions = params.manifest.optionalExtensions;
    this.requiredBundles = params.manifest.requiredBundles;
    this.includesServerExtension = params.manifest.server;
    this.includesUiExtension = params.manifest.ui;
  }

  /**
   * Instantiates extension and calls `setup` function exposed by the extension initializer.
   * @param setupContext Context that consists of various core services tailored specifically
   * for the `setup` lifecycle event.
   * @param extensions The dictionary where the key is the dependency name and the value
   * is the contract returned by the dependency's `setup` function.
   */
  public async setup(
    setupContext: CoreSetupForExtension<TExtensionsStart>,
    extensions: TExtensionsSetup
  ) {
    this.instance = this.createExtensionInstance();

    return this.instance.setup(setupContext, extensions);
  }

  /**
   * Calls `start` function exposed by the initialized extension.
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
  public async stop() {
    if (this.instance === undefined) {
      throw new Error(`Extension "${this.name}" can't be stopped since it isn't set up.`);
    }

    if (typeof this.instance.stop === 'function') {
      await this.instance.stop();
    }

    this.instance = undefined;
  }

  public getConfigDescriptor(): ExtensionConfigDescriptor | null {
    if (!this.manifest.server) {
      return null;
    }
    const extensionPathServer = join(this.path, 'server');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const extensionDefinition = require(extensionPathServer);

    if (!('config' in extensionDefinition)) {
      this.log.debug(`"${extensionPathServer}" does not export "config".`);
      return null;
    }

    const configDescriptor = extensionDefinition.config;
    if (!isConfigSchema(configDescriptor.schema)) {
      throw new Error('Configuration schema expected to be an instance of Type');
    }
    return configDescriptor;
  }

  private createExtensionInstance() {
    this.log.debug('Initializing extension');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const extensionDefinition = require(join(this.path, 'server'));
    if (!('extension' in extensionDefinition)) {
      throw new Error(
        `Extension "${this.name}" does not export "extension" definition (${this.path}).`
      );
    }

    const { extension: initializer } = extensionDefinition as {
      extension: ExtensionInitializer<TSetup, TStart, TExtensionsSetup, TExtensionsStart>;
    };
    if (!initializer || typeof initializer !== 'function') {
      throw new Error(
        `Definition of extension "${this.name}" should be a function (${this.path}).`
      );
    }

    const instance = initializer(this.initializerContext);
    if (!instance || typeof instance !== 'object') {
      throw new Error(
        `Initializer for extension "${
          this.manifest.extensionId
        }" is expected to return extension instance, but returned "${typeDetect(instance)}".`
      );
    }

    if (typeof instance.setup !== 'function') {
      throw new Error(`Instance of extension "${this.name}" does not define "setup" function.`);
    }

    return instance;
  }
}
