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
