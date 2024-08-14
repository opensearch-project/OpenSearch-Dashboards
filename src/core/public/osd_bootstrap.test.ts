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
  apmSystem,
  fatalErrorMock,
  i18nLoad,
  i18nSetLocale,
  consoleWarnMock,
} from './osd_bootstrap.test.mocks';
import { __osdBootstrap__ } from './';
import { getLocaleInUrl } from './locale_helper';

jest.mock('./locale_helper', () => ({
  getLocaleInUrl: jest.fn(),
}));

describe('osd_bootstrap', () => {
  let originalWindowLocation: Location;

  beforeAll(() => {
    const metadata = {
      branding: { darkMode: 'true' },
      i18n: { translationsUrl: 'http://localhost/translations/en.json' },
      vars: { apmConfig: null },
    };
    // eslint-disable-next-line no-unsanitized/property
    document.body.innerHTML = `<osd-injected-metadata data=${JSON.stringify(
      metadata
    )}> </osd-injected-metadata>`;

    originalWindowLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalWindowLocation, href: 'http://localhost' };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getLocaleInUrl as jest.Mock).mockReturnValue(null);
  });

  afterAll(() => {
    window.location = originalWindowLocation;
  });

  it('does not report a fatal error if apm load fails', async () => {
    apmSystem.setup.mockRejectedValueOnce(new Error('reason'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementationOnce(() => undefined);

    await __osdBootstrap__();

    expect(fatalErrorMock.add).toHaveBeenCalledTimes(0);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('reports a fatal error if i18n load fails', async () => {
    i18nLoad.mockRejectedValueOnce(new Error('reason'));

    await __osdBootstrap__();

    expect(fatalErrorMock.add).toHaveBeenCalledTimes(1);
  });

  it('sets locale from URL if present', async () => {
    (getLocaleInUrl as jest.Mock).mockReturnValue('fr');
    window.location.href = 'http://localhost/?locale=fr';

    await __osdBootstrap__();

    expect(i18nSetLocale).toHaveBeenCalledWith('fr');
    expect(i18nLoad).toHaveBeenCalledWith('http://localhost/translations/fr.json');
  });

  it('sets default locale if not present in URL', async () => {
    await __osdBootstrap__();

    expect(i18nSetLocale).toHaveBeenCalledWith('en');
    expect(i18nLoad).toHaveBeenCalledWith('http://localhost/translations/en.json');
  });

  it('displays locale warning if set', async () => {
    (window as any).__localeWarning = { title: 'Locale Warning', text: 'Invalid locale' };

    await __osdBootstrap__();

    expect(consoleWarnMock).toHaveBeenCalledWith('Locale Warning: Invalid locale');
    expect((window as any).__localeWarning).toBeUndefined();
  });

  it('displays i18n warning if set', async () => {
    (window as any).__i18nWarning = { title: 'i18n Warning', text: 'Translation issue' };

    await __osdBootstrap__();

    expect(consoleWarnMock).toHaveBeenCalledWith('i18n Warning: Translation issue');
    expect((window as any).__i18nWarning).toBeUndefined();
  });
});
