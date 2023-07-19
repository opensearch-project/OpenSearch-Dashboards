/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';
import { augmentVisSavedObjectType } from './saved_objects';
import { capabilitiesProvider } from './capabilities_provider';
import { VisAugmenterPluginConfigType } from '../config';
import {
  PLUGIN_AUGMENTATION_ENABLE_SETTING,
  PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING,
} from '../common/constants';
import { registerStatsRoute } from './routes/stats';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterPluginStart {}

export class VisAugmenterPlugin
  implements Plugin<VisAugmenterPluginSetup, VisAugmenterPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<VisAugmenterPluginConfigType>;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.create<VisAugmenterPluginConfigType>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('VisAugmenter: Setup');
    core.savedObjects.registerType(augmentVisSavedObjectType);
    core.capabilities.registerProvider(capabilitiesProvider);

    const config: VisAugmenterPluginConfigType = await this.config$.pipe(first()).toPromise();
    const isAugmentationEnabled =
      config.pluginAugmentationEnabled === undefined ? true : config.pluginAugmentationEnabled;

    // Checks if the global yaml setting for enabling plugin augmentation is disabled.
    // If it is disabled, remove the settings as we would not want to show these to the
    // user due to it being disabled at the cluster level.
    if (isAugmentationEnabled) {
      core.uiSettings.register({
        [PLUGIN_AUGMENTATION_ENABLE_SETTING]: {
          name: i18n.translate('visualization.enablePluginAugmentationTitle', {
            defaultMessage: 'Enable plugin augmentation',
          }),
          value: true,
          description: i18n.translate('visualization.enablePluginAugmentationText', {
            defaultMessage: 'Plugin functionality can be accessed from line chart visualizations',
          }),
          category: ['visualization'],
          schema: schema.boolean(),
        },
        [PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING]: {
          name: i18n.translate('visualization.enablePluginAugmentation.maxPluginObjectsTitle', {
            defaultMessage: 'Max number of associated augmentations',
          }),
          value: 10,
          description: i18n.translate(
            'visualization.enablePluginAugmentation.maxPluginObjectsText',
            {
              defaultMessage:
                'Associating more than 10 plugin resources per visualization can lead to performance ' +
                'issues and increase the cost of running clusters.',
            }
          ),
          category: ['visualization'],
          schema: schema.number({ min: 0 }),
        },
      });
    }

    // Register server-side APIs
    const router = core.http.createRouter();
    registerStatsRoute(router, this.logger);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('VisAugmenter: Started');
    return {};
  }

  public stop() {}
}
