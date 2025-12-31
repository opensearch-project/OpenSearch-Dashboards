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

import { BehaviorSubject } from 'rxjs';

jest.mock('!!raw-loader!./disable_animations.css', () => 'MOCK DISABLE ANIMATIONS CSS');
jest.mock('../../utils', () => ({
  getNonce: jest.fn(),
}));

import { StylesService } from './styles_service';
import { uiSettingsServiceMock } from '../../ui_settings/ui_settings_service.mock';
import { getNonce } from '../../utils';

describe('StylesService', () => {
  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 100));
  const getDisableAnimationsTag = () => document.querySelector('style#disableAnimationsCss')!;

  afterEach(() => getDisableAnimationsTag().remove());

  test('sets initial disable animations style', async () => {
    const disableAnimations$ = new BehaviorSubject(false);

    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockReturnValueOnce(disableAnimations$);

    new StylesService().start({ uiSettings });
    await flushPromises();

    const styleTag = getDisableAnimationsTag();
    expect(styleTag).toBeDefined();
    expect(styleTag.textContent).toEqual('');
  });

  test('updates disable animations style', async () => {
    const disableAnimations$ = new BehaviorSubject(false);

    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockReturnValueOnce(disableAnimations$);

    new StylesService().start({ uiSettings });

    disableAnimations$.next(true);
    await flushPromises();
    expect(getDisableAnimationsTag().textContent).toEqual('MOCK DISABLE ANIMATIONS CSS');

    disableAnimations$.next(false);
    await flushPromises();
    expect(getDisableAnimationsTag().textContent).toEqual('');
  });

  test('sets nonce attribute on style tag when getNonce returns a value', async () => {
    const mockGetNonce = getNonce as jest.Mock;
    mockGetNonce.mockReturnValue('test-nonce-abc123');

    const disableAnimations$ = new BehaviorSubject(false);
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockReturnValueOnce(disableAnimations$);

    new StylesService().start({ uiSettings });
    await flushPromises();

    const styleTag = getDisableAnimationsTag();
    expect(styleTag.getAttribute('nonce')).toBe('test-nonce-abc123');
  });

  test('does not set nonce attribute on style tag when getNonce returns empty string', async () => {
    const mockGetNonce = getNonce as jest.Mock;
    mockGetNonce.mockReturnValue('');

    const disableAnimations$ = new BehaviorSubject(false);
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockReturnValueOnce(disableAnimations$);

    new StylesService().start({ uiSettings });
    await flushPromises();

    const styleTag = getDisableAnimationsTag();
    expect(styleTag.getAttribute('nonce')).toBeNull();
  });
});
