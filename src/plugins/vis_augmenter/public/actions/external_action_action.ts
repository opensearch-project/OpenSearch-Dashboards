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

import { ActionByType, createAction, ExternalActionContext } from '../../../ui_actions/public';
import { isPointInTimeAnnotation } from '../vega';

export type ExternalActionActionContext = ExternalActionContext;
export const ACTION_EXTERNAL_ACTION = 'ACTION_EXTERNAL_ACTION';

declare module '../../../ui_actions/public' {
  export interface ActionContextMapping {
    [ACTION_EXTERNAL_ACTION]: ExternalActionActionContext;
  }
}

export function createExternalActionAction(): ActionByType<typeof ACTION_EXTERNAL_ACTION> {
  return createAction<typeof ACTION_EXTERNAL_ACTION>({
    type: ACTION_EXTERNAL_ACTION,
    id: ACTION_EXTERNAL_ACTION,
    shouldAutoExecute: async () => true,
    execute: async (context: ExternalActionActionContext) => {
      if (isPointInTimeAnnotation(context.data.item)) {
        if (context.data.event === 'click') {
          // TODO: show events flyout
        } else if (context.data.event === 'mouseover') {
          // TODO: show custom tooltip
        }
      }
    },
  });
}
