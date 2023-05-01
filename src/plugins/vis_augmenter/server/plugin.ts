/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';
import { augmentVisSavedObjectType } from './saved_objects';
import { capabilitiesProvider } from './capabilities_provider';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterPluginStart {}

export class VisAugmenterPlugin
  implements Plugin<VisAugmenterPluginSetup, VisAugmenterPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('VisAugmenter: Setup');
    core.savedObjects.registerType(augmentVisSavedObjectType);
    core.capabilities.registerProvider(capabilitiesProvider);

    core.uiSettings.register({
      ['visualization:enablePluginAugmentation']: {
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
      ['visualization:enablePluginAugmentation.maxPluginObjects']: {
        name: i18n.translate('visualization.enablePluginAugmentation.maxPluginObjectsTitle', {
          defaultMessage: 'Max number of associated augmentations',
        }),
        value: 10,
        description: i18n.translate('visualization.enablePluginAugmentation.maxPluginObjectsText', {
          defaultMessage:
            'Associating more than 10 plugin resources per visualization can lead to performance ' +
            'issues and increase the cost of running clusters.',
        }),
        category: ['visualization'],
        schema: schema.number({ min: 0 }),
      },
    });
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('VisAugmenter: Started');
    return {};
  }

  public stop() {}
}
