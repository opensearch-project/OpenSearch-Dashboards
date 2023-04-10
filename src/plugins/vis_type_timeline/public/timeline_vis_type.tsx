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

import React, { lazy } from 'react';
import { i18n } from '@osd/i18n';

import { DefaultEditorSize } from '../../vis_default_editor/public';
import { getTimelineRequestHandler } from './helpers/timeline_request_handler';
import { TimelineOptionsProps } from './timeline_options';
import { TimelineVisDependencies } from './plugin';
import { toExpressionAst } from './to_ast';

import { VIS_EVENT_TO_TRIGGER } from '../../visualizations/public';

const TimelineOptions = lazy(() => import('./timeline_options'));

export const TIMELINE_VIS_NAME = 'timelion';

export function getTimelineVisDefinition(dependencies: TimelineVisDependencies) {
  const timelineRequestHandler = getTimelineRequestHandler(dependencies);

  // return the visType object, which OpenSearch Dashboards will use to display and configure new
  // Vis object of this type.
  return {
    name: TIMELINE_VIS_NAME,
    title: 'Timeline',
    icon: 'timeline',
    description: i18n.translate('timeline.timelineDescription', {
      defaultMessage: 'Build time-series using functional expressions',
    }),
    visConfig: {
      defaults: {
        expression: '.opensearch(*)',
        interval: 'auto',
      },
    },
    editorConfig: {
      optionsTemplate: (props: TimelineOptionsProps) => (
        <TimelineOptions services={dependencies} {...props} />
      ),
      defaultSize: DefaultEditorSize.MEDIUM,
    },
    requestHandler: timelineRequestHandler,
    toExpressionAst,
    responseHandler: 'none',
    inspectorAdapters: {},
    getSupportedTriggers: () => {
      return [VIS_EVENT_TO_TRIGGER.applyFilter];
    },
    options: {
      showIndexSelection: false,
      showQueryBar: false,
      showFilterBar: false,
    },
  };
}
