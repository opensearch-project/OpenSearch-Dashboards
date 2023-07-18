/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createMockErrorEmbeddable } from '../../mocks';
import { getErrorMessage } from './utils';

describe('utils', () => {
  describe('getErrorMessage', () => {
    const errorMsg = 'oh no an error!';
    it('returns message when error field is string', async () => {
      const errorEmbeddable = createMockErrorEmbeddable();
      errorEmbeddable.error = errorMsg;
      expect(getErrorMessage(errorEmbeddable)).toEqual(errorMsg);
    });
    it('returns message when error field is Error obj', async () => {
      const errorEmbeddable = createMockErrorEmbeddable();
      errorEmbeddable.error = new Error(errorMsg);
      expect(getErrorMessage(errorEmbeddable)).toEqual(errorMsg);
    });
  });
});
