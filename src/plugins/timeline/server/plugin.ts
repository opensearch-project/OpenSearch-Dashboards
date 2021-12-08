/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { CoreSetup, CoreStart, Plugin, PluginInitializerContext, Logger } from 'src/core/server';
import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';
import { TimelineConfigType } from './config';
import { timelineSheetSavedObjectType } from './saved_objects';

/**
 * Deprecated since 7.0, the Timeline app will be removed in 8.0.
 * To continue using your Timeline worksheets, migrate them to a dashboard.
 **/
const showWarningMessageIfTimelineSheetWasFound = (core: CoreStart, logger: Logger) => {
  const { savedObjects } = core;
  const savedObjectsClient = savedObjects.createInternalRepository();

  savedObjectsClient
    .find({
      type: 'timelion-sheet',
      perPage: 1,
    })
    .then(
      ({ total }) =>
        total &&
        logger.warn(
          'Deprecated since 7.0, the Timeline app will be removed in 8.0. To continue using your Timeline worksheets, migrate them to a dashboard.'
        )
    );
};

export class TimelinePlugin implements Plugin {
  private logger: Logger;

  constructor(context: PluginInitializerContext<TimelineConfigType>) {
    this.logger = context.logger.get();
  }

  public setup(core: CoreSetup) {
    core.capabilities.registerProvider(() => ({
      timelion: {
        save: true,
      },
    }));
    core.savedObjects.registerType(timelineSheetSavedObjectType);

    core.uiSettings.register({
      'timeline:showTutorial': {
        name: i18n.translate('timeline.uiSettings.showTutorialLabel', {
          defaultMessage: 'Show tutorial',
        }),
        value: false,
        description: i18n.translate('timeline.uiSettings.showTutorialDescription', {
          defaultMessage: 'Should I show the tutorial by default when entering the timeline app?',
        }),
        category: ['timeline'],
        schema: schema.boolean(),
      },
      'timeline:default_columns': {
        name: i18n.translate('timeline.uiSettings.defaultColumnsLabel', {
          defaultMessage: 'Default columns',
        }),
        value: 2,
        description: i18n.translate('timeline.uiSettings.defaultColumnsDescription', {
          defaultMessage: 'Number of columns on a timeline sheet by default',
        }),
        category: ['timeline'],
        schema: schema.number(),
      },
      'timeline:default_rows': {
        name: i18n.translate('timeline.uiSettings.defaultRowsLabel', {
          defaultMessage: 'Default rows',
        }),
        value: 2,
        description: i18n.translate('timeline.uiSettings.defaultRowsDescription', {
          defaultMessage: 'Number of rows on a timeline sheet by default',
        }),
        category: ['timeline'],
        schema: schema.number(),
      },
    });
  }
  start(core: CoreStart) {
    showWarningMessageIfTimelineSheetWasFound(core, this.logger);
  }
  stop() {}
}
