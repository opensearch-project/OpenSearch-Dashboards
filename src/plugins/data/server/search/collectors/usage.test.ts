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

import { coreMock } from '../../../../../core/server/mocks';
import { CoreSetup } from '../../../../../core/server';
import { first } from 'rxjs/operators';
import { usageProvider } from '..';
import { ConfigSchema } from '../../../config';

describe('Search usage telemetry', () => {
  let mockCoreSetup: MockedKeys<CoreSetup>;
  const initializerContext = coreMock.createPluginInitializerContext({
    search: { usageTelemetry: { enabled: false } },
  });

  it('trackSuccess should not throw with disabled usageTelemetry', async () => {
    const configObject = await initializerContext.config
      .create<ConfigSchema>()
      .pipe(first())
      .toPromise();
    expect(configObject.search.usageTelemetry.enabled).toBe(false);

    const searchUsage = usageProvider(mockCoreSetup, initializerContext);
    expect(searchUsage.trackSuccess(1)).resolves.not.toThrow();
  });

  it('trackError should not throw with disabled usageTelemetry', () => {
    const searchUsage = usageProvider(mockCoreSetup, initializerContext);
    expect(searchUsage.trackError.name).toBe('trackError');
    expect(searchUsage.trackError()).resolves.not.toThrow();
  });
});
