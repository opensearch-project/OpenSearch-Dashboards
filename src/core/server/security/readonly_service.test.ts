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

import { OpenSearchDashboardsRequest } from '../index';
import { ReadonlyService } from './readonly_service';
import { httpServerMock } from '../http/http_server.mocks';

describe('ReadonlyService', () => {
  let readonlyService: ReadonlyService;
  let request: OpenSearchDashboardsRequest;

  beforeEach(() => {
    readonlyService = new ReadonlyService();
    request = httpServerMock.createOpenSearchDashboardsRequest();
  });

  it('isReadonly returns false by default', () => {
    expect(readonlyService.isReadonly(request)).resolves.toBeFalsy();
  });

  it('hideForReadonly merges capabilites to hide', () => {
    readonlyService.isReadonly = jest.fn(() => new Promise(() => true));
    const result = readonlyService.hideForReadonly(
      request,
      { foo: { show: true } },
      { foo: { show: false } }
    );

    expect(readonlyService.isReadonly).toBeCalledTimes(1);
    expect(result).resolves.toEqual({ foo: { show: false } });
  });
});
