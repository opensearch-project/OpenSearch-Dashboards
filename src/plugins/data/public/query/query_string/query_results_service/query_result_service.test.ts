/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryResultService } from './query_result_service';

describe('QueryResultService', () => {
  let service: QueryResultService;

  beforeEach(() => {
    service = new QueryResultService();
  });

  test('__enhance adds query result extensions', () => {
    const mockExtension = { id: 'test-extension', order: 1 };
    service.__enhance({ queryResultExtension: mockExtension });
    expect(service.getQueryResultExtensionMap()).toEqual({ 'test-extension': mockExtension });
  });
});
