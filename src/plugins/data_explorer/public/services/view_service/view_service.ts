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

import { CoreService } from '../../../../../core/types';
import { ViewDefinition } from './types';
import { View } from './view';

/**
 * Visualization Types Service
 *
 * @internal
 */
export class ViewService implements CoreService<ViewServiceSetup, ViewServiceStart> {
  private views: Record<string, View> = {};

  private registerView(view: View) {
    if (view.id in this.views) {
      throw new Error(`A view with the id ${view.id} already exists!`);
    }
    this.views[view.id] = view;
  }

  public setup() {
    return {
      /**
       * registers a visualization type
       * @param config - visualization type definition
       */
      registerView: <T = any>(config: ViewDefinition<T>): void => {
        const view = new View(config);
        this.registerView(view);
      },
    };
  }

  public start() {
    return {
      /**
       * returns specific View or undefined if not found
       * @param {string} id - id of view to return
       */
      get: (id: string): View | undefined => {
        return this.views[id];
      },
      /**
       * returns all registered Views
       */
      all: (): View[] => {
        return Object.values(this.views);
      },
    };
  }

  public stop() {
    // nothing to do here yet
  }
}

/** @internal */
export type ViewServiceSetup = ReturnType<ViewService['setup']>;
export type ViewServiceStart = ReturnType<ViewService['start']>;
