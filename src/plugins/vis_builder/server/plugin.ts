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

import { VisBuilderPluginSetup, VisBuilderPluginStart } from './types';
import { capabilitiesProvider } from './capabilities_provider';
import { visBuilderSavedObjectType } from './saved_objects';
import { VISBUILDER_ENABLE_VEGA_SETTING } from '../common/constants';

export class VisBuilderPlugin implements Plugin<VisBuilderPluginSetup, VisBuilderPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup({ capabilities, http, savedObjects, uiSettings }: CoreSetup) {
    this.logger.debug('vis-builder: Setup');

    // Register saved object types
    savedObjects.registerType(visBuilderSavedObjectType);

    // Register capabilities
    capabilities.registerProvider(capabilitiesProvider);

    // Register settings
    uiSettings.register({
      [VISBUILDER_ENABLE_VEGA_SETTING]: {
        name: i18n.translate('visBuilder.advancedSettings.visbuilderEnableVegaTitle', {
          defaultMessage: 'Enable vega transformation in visbuilder',
        }),
        value: false,
        description: i18n.translate('visBuilder.advancedSettings.visbuilderEnableVegaText', {
          defaultMessage: `Allow visbuilder to render visualizations via vega.`,
        }),
        requiresPageReload: true,
        category: ['visbuilder'],
        schema: schema.boolean(),
      },
    });

    return {};
  }

  public start(_core: CoreStart) {
    this.logger.debug('vis-builder: Started');
    return {};
  }

  public stop() {}
}
