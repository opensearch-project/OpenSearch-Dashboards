/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validate } from './string_utils';

describe('application config string utils', () => {
  it('returns smoothly when input is not empty', () => {
    const logger = {
      error: jest.fn(),
    };

    validate('abc', logger);

    expect(logger.error).not.toBeCalled();
  });

  it('throws error when input is empty', () => {
    const logger = {
      error: jest.fn(),
    };

    expect(() => {
      validate('   ', logger);
    }).toThrowError('Input cannot be empty!');
  });
});
