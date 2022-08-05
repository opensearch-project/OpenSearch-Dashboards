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
import { VisualizationTypeOptions } from './types';
import { VisualizationType } from './visualization_type';

/**
 * Visualization Types Service
 *
 * @internal
 */
export class TypeService implements CoreService<TypeServiceSetup, TypeServiceStart> {
  private types: Record<string, VisualizationType> = {};

  private registerVisualizationType(visDefinition: VisualizationType) {
    if (this.types[visDefinition.name]) {
      throw new Error(`A visualization with this the name ${visDefinition.name} already exists!`);
    }
    this.types[visDefinition.name] = visDefinition;
  }

  public setup() {
    return {
      /**
       * registers a visualization type
       * @param config - visualization type definition
       */
      createVisualizationType: (config: VisualizationTypeOptions): void => {
        const vis = new VisualizationType(config);
        this.registerVisualizationType(vis);
      },
    };
  }

  public start() {
    return {
      /**
       * returns specific visualization or undefined if not found
       * @param {string} visualization - id of visualization to return
       */
      get: (visualization: string): VisualizationType | undefined => {
        return this.types[visualization];
      },
      /**
       * returns all registered visualization types
       */
      all: (): VisualizationType[] => {
        return [...Object.values(this.types)];
      },
    };
  }

  public stop() {
    // nothing to do here yet
  }
}

/** @internal */
export type TypeServiceSetup = ReturnType<TypeService['setup']>;
export type TypeServiceStart = ReturnType<TypeService['start']>;
