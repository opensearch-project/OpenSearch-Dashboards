/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  ILegacyClusterClient,
  SessionStorageFactory,
  SharedGlobalConfig,
} from '../../../core/server';

import { SecurityPluginSetup, SecurityPluginStart } from './types';

export interface SecurityPluginRequestContext {
  logger: Logger;
}

export interface SecurityPluginRequestContext {
  logger: Logger;
}

export class SecurityPlugin implements Plugin<SecurityPluginSetup, SecurityPluginStart> {
  private readonly logger: Logger;

  // @ts-ignore: property not initialzied in constructor
  private securityClient: SecurityClient;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');
    return {};
  }

  // TODO: add more logs
  public async start(core: CoreStart) {
    this.logger.debug('dashboards_security: Started');

    return {};
  }

  public stop() {}
}
