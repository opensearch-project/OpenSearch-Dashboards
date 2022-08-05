import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { BrandingPluginSetup, BrandingPluginStart } from './types';
import { defineRoutes } from './routes';

import { first } from 'rxjs/operators';
import { TypeOf, schema } from '@osd/config-schema';
import { RecursiveReadonly } from '@osd/utility-types';
import { deepFreeze } from '@osd/std';

import { PluginStart } from '../../data/server';

import { configSchema } from '../config';
import { ConfigManager } from './config_manager';

export class BrandingPlugin implements Plugin<BrandingPluginSetup, BrandingPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('branding: Setup');
    const router = core.http.createRouter();
    const config = await this.initializerContext.config
        .create<TypeOf<typeof configSchema>>()
        .pipe(first())
        .toPromise()
    
    console.log(config)

    const configManager = new ConfigManager(this.initializerContext.config);

    // Register server side APIs
    defineRoutes(router);

    return configManager;
  }

  public start(core: CoreStart) {
    this.logger.debug('branding: Started');
    return {};
  }

  public stop() {}
}
