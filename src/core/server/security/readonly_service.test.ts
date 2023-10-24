/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
