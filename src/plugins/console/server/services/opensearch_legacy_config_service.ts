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

import { Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { OpenSearchConfig } from 'opensearch-dashboards/server';

export class OpenSearchLegacyConfigService {
  /**
   * The OpenSearch config value at a given point in time.
   */
  private config?: OpenSearchConfig;

  /**
   * An observable that emits OpenSearch config.
   */
  private config$?: Observable<OpenSearchConfig>;

  /**
   * A reference to the subscription to the OpenSearch observable
   */
  private configSub?: Subscription;

  setup(config$: Observable<OpenSearchConfig>) {
    this.config$ = config$;
    this.configSub = this.config$.subscribe((config) => {
      this.config = config;
    });
  }

  stop() {
    if (this.configSub) {
      this.configSub.unsubscribe();
    }
  }

  async readConfig(): Promise<OpenSearchConfig> {
    if (!this.config$) {
      throw new Error('Could not read OpenSearch config, this service has not been setup!');
    }

    if (!this.config) {
      return this.config$.pipe(first()).toPromise();
    }

    return this.config;
  }
}
