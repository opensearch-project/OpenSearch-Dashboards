/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { throwFacetError } from './utils';

describe('handleFacetError', () => {
  const error = new Error('mock-error');
  (error as any).body = {
    message: 'test error message',
  };
  (error as any).status = '400';
  it('should throw an error with message from response.data.body.message', () => {
    const response = {
      data: error,
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('test error message');
      expect(err.name).toBe('400');
      expect(err.status).toBe('400');
    }
  });
});
