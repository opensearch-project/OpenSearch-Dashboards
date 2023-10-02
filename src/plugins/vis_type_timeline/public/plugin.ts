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

import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  IUiSettingsClient,
  HttpSetup,
} from 'opensearch-dashboards/public';
import { Plugin as ExpressionsPlugin } from 'src/plugins/expressions/public';
import {
  DataPublicPluginSetup,
  DataPublicPluginStart,
  TimefilterContract,
} from 'src/plugins/data/public';

import { VisualizationsSetup } from '../../visualizations/public';

import { getTimelineVisualizationConfig } from './timeline_vis_fn';
import { getTimelineVisDefinition } from './timeline_vis_type';
import { setIndexPatterns, setSavedObjectsClient } from './helpers/plugin_services';
import { ConfigSchema } from '../config';

import { getArgValueSuggestions } from './helpers/arg_value_suggestions';
import { getTimelineVisRenderer } from './timeline_vis_renderer';

/** @internal */
export interface TimelineVisDependencies extends Partial<CoreStart> {
  uiSettings: IUiSettingsClient;
  http: HttpSetup;
  timefilter: TimefilterContract;
}

/** @internal */
export interface TimelineVisSetupDependencies {
  expressions: ReturnType<ExpressionsPlugin['setup']>;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
}

/** @internal */
export interface TimelineVisStartDependencies {
  data: DataPublicPluginStart;
}

/** @public */
export interface VisTypeTimelinePluginStart {
  getArgValueSuggestions: typeof getArgValueSuggestions;
}

/** @internal */
export class TimelineVisPlugin
  implements
    Plugin<
      void,
      VisTypeTimelinePluginStart,
      TimelineVisSetupDependencies,
      TimelineVisStartDependencies
    > {
  constructor(public initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(
    core: CoreSetup,
    { expressions, visualizations, data }: TimelineVisSetupDependencies
  ) {
    const dependencies: TimelineVisDependencies = {
      uiSettings: core.uiSettings,
      http: core.http,
      timefilter: data.query.timefilter.timefilter,
    };

    expressions.registerFunction(() => getTimelineVisualizationConfig(dependencies));
    expressions.registerRenderer(getTimelineVisRenderer(dependencies));
    visualizations.createBaseVisualization(getTimelineVisDefinition(dependencies));
  }

  public start(core: CoreStart, plugins: TimelineVisStartDependencies) {
    setIndexPatterns(plugins.data.indexPatterns);
    setSavedObjectsClient(core.savedObjects.client);

    return {
      getArgValueSuggestions,
    };
  }
}
