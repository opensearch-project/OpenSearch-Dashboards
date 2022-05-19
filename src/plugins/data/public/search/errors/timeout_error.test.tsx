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

import { SearchTimeoutError, TIMEOUT_MESSAGE } from './timeout_error';

import { coreMock } from '../../../../../core/public/mocks';
const startMock = coreMock.createStart();

import { mount } from 'enzyme';
import { AbortError } from 'src/plugins/data/common';

describe('SearchTimeoutError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startMock.application.navigateToApp.mockImplementation(jest.fn());
  });

  it('Should create timeout message', () => {
    const e = new SearchTimeoutError(new AbortError());
    const component = mount(e.getErrorMessage(startMock.application));
    expect(component.html()).toEqual(TIMEOUT_MESSAGE);
  });
});
