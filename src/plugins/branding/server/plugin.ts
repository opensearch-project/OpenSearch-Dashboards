import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { BrandingPluginSetup, BrandingPluginStart } from './types';
import { first } from 'rxjs/operators';
import { TypeOf } from '@osd/config-schema';
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

    const configManager = new ConfigManager(this.initializerContext.config);
    console.log(configManager)
    console.log(configManager.getLogo())
    // Register server side APIs
  

    return {}
  }

  public start(core: CoreStart) {
    this.logger.debug('branding: Started');
    return {};
  }

  public stop() {}
}
