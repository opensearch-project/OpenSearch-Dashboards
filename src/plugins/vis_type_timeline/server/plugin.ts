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

import { i18n } from '@osd/i18n';
import { first } from 'rxjs/operators';
import { TypeOf, schema } from '@osd/config-schema';
import { RecursiveReadonly } from '@osd/utility-types';
import { deepFreeze } from '@osd/std';

import { PluginStart } from '../../data/server';
import { CoreSetup, PluginInitializerContext } from '../../../core/server';
import { configSchema } from '../config';
import loadFunctions from './lib/load_functions';
import { functionsRoute } from './routes/functions';
import { validateOpenSearchRoute } from './routes/validate_es';
import { runRoute } from './routes/run';
import { ConfigManager } from './lib/config_manager';

const experimentalLabel = i18n.translate('timeline.uiSettings.experimentalLabel', {
  defaultMessage: 'experimental',
});

export interface TimelinePluginStartDeps {
  data: PluginStart;
}

/**
 * Represents Timeline Plugin instance that will be managed by the OpenSearch Dashboards plugin system.
 */
export class Plugin {
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async setup(core: CoreSetup): void {
    const config = await this.initializerContext.config
      .create<TypeOf<typeof configSchema>>()
      .pipe(first())
      .toPromise();

    const configManager = new ConfigManager(this.initializerContext.config);

    const functions = loadFunctions('series_functions');

    const getFunction = (name: string) => {
      if (functions[name]) {
        return functions[name];
      }

      throw new Error(
        i18n.translate('timeline.noFunctionErrorMessage', {
          defaultMessage: 'No such function: {name}',
          values: { name },
        })
      );
    };

    const logger = this.initializerContext.logger.get('timeline');

    const router = core.http.createRouter();

    const deps = {
      configManager,
      functions,
      getFunction,
      logger,
      core,
    };

    functionsRoute(router, deps);
    runRoute(router, deps);
    validateOpenSearchRoute(router, core);

    core.uiSettings.register({
      'timeline:es.timefield': {
        name: i18n.translate('timeline.uiSettings.timeFieldLabel', {
          defaultMessage: 'Time field',
        }),
        value: '@timestamp',
        description: i18n.translate('timeline.uiSettings.timeFieldDescription', {
          defaultMessage: 'Default field containing a timestamp when using {opensearchParam}',
          values: { opensearchParam: '.opensearch()' },
        }),
        category: ['timeline'],
        schema: schema.string(),
      },
      'timeline:es.default_index': {
        name: i18n.translate('timeline.uiSettings.defaultIndexLabel', {
          defaultMessage: 'Default index',
        }),
        value: '_all',
        description: i18n.translate('timeline.uiSettings.defaultIndexDescription', {
          defaultMessage: 'Default opensearch index to search with {opensearchParam}',
          values: { opensearchParam: '.opensearch()' },
        }),
        category: ['timeline'],
        schema: schema.string(),
      },
      'timeline:target_buckets': {
        name: i18n.translate('timeline.uiSettings.targetBucketsLabel', {
          defaultMessage: 'Target buckets',
        }),
        value: 200,
        description: i18n.translate('timeline.uiSettings.targetBucketsDescription', {
          defaultMessage: 'The number of buckets to shoot for when using auto intervals',
        }),
        category: ['timeline'],
        schema: schema.number(),
      },
      'timeline:max_buckets': {
        name: i18n.translate('timeline.uiSettings.maximumBucketsLabel', {
          defaultMessage: 'Maximum buckets',
        }),
        value: 2000,
        description: i18n.translate('timeline.uiSettings.maximumBucketsDescription', {
          defaultMessage: 'The maximum number of buckets a single datasource can return',
        }),
        category: ['timeline'],
        schema: schema.number(),
      },
      'timeline:min_interval': {
        name: i18n.translate('timeline.uiSettings.minimumIntervalLabel', {
          defaultMessage: 'Minimum interval',
        }),
        value: '1ms',
        description: i18n.translate('timeline.uiSettings.minimumIntervalDescription', {
          defaultMessage: 'The smallest interval that will be calculated when using "auto"',
          description:
            '"auto" is a technical value in that context, that should not be translated.',
        }),
        category: ['timeline'],
        schema: schema.string(),
      },
      'timeline:graphite.url': {
        name: i18n.translate('timeline.uiSettings.graphiteURLLabel', {
          defaultMessage: 'Graphite URL',
          description:
            'The URL should be in the form of https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite',
        }),
        value:
          config.graphiteAllowedUrls && config.graphiteAllowedUrls.length
            ? config.graphiteAllowedUrls[0]
            : null,
        description: i18n.translate('timeline.uiSettings.graphiteURLDescription', {
          defaultMessage: '{experimentalLabel} The URL of your graphite host',
          values: { experimentalLabel: `<em>[${experimentalLabel}]</em>` },
        }),
        category: ['timeline'],
        schema: schema.nullable(schema.string()),
      },
      'timeline:quandl.key': {
        name: i18n.translate('timeline.uiSettings.quandlKeyLabel', {
          defaultMessage: 'Quandl key',
        }),
        value: 'someKeyHere',
        description: i18n.translate('timeline.uiSettings.quandlKeyDescription', {
          defaultMessage: '{experimentalLabel} Your API key from www.quandl.com',
          values: { experimentalLabel: `<em>[${experimentalLabel}]</em>` },
        }),
        category: ['timeline'],
        schema: schema.string(),
      },
    });
  }

  public start() {
    this.initializerContext.logger.get().debug('Starting plugin');
  }

  public stop() {
    this.initializerContext.logger.get().debug('Stopping plugin');
  }
}
