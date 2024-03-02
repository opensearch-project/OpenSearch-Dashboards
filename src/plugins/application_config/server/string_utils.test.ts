/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validate } from './string_utils';

describe('application config string utils', () => {
  it('returns input when input is not empty and no prefix or suffix whitespaces', () => {
    const logger = {
      error: jest.fn(),
    };

    const input = 'abc';

    const validatedInput = validate(input, logger);

    expect(validatedInput).toBe(input);
    expect(logger.error).not.toBeCalled();
  });

  it('returns trimmed input when input is not empty and prefix or suffix whitespaces', () => {
    const logger = {
      error: jest.fn(),
    };

    const input = ' abc ';

    const validatedInput = validate(input, logger);

    expect(validatedInput).toBe('abc');
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
