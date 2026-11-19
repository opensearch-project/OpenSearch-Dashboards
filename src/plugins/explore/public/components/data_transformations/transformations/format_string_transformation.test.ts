/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createFormatStringTransformation,
  formatString,
  StringFormat,
} from './format_string_transformation';

describe('format string', () => {
  it('formats', () => {
    expect(formatString('hello world', 'upper')).toBe('HELLO WORLD');
    expect(formatString('Hello World', 'lower')).toBe('hello world');
    expect(formatString('hello world', 'sentence')).toBe('Hello world');
    expect(formatString('hello  big world', 'title')).toBe('Hello  Big World');
    expect(formatString('  hi  ', 'trim')).toBe('hi');
  });

  it('sentence and title lower the rest, and skip leading spaces', () => {
    expect(formatString('hELLO wORLD', 'sentence')).toBe('Hello world');
    expect(formatString('  hello', 'sentence')).toBe('  Hello');
    expect(formatString('hELLO wORLD', 'title')).toBe('Hello World');
  });

  it('leaves the value as it is for an unknown format', () => {
    expect(formatString('Hi', 'bogus' as StringFormat)).toBe('Hi');
  });

  it('is invalid for an unknown format', () => {
    const { transformationMethod } = createFormatStringTransformation();
    const result = transformationMethod([{ s: 'ab' }], {
      field: 's',
      format: 'bogus' as StringFormat,
    });
    expect(result.issues[0].code).toBe('invalid_config');
    expect(result.rows).toEqual([{ s: 'ab' }]);
  });

  it('changes only string values of the field', () => {
    const { transformationMethod } = createFormatStringTransformation();
    const result = transformationMethod([{ s: 'ab', n: 1 }, { s: null }, { s: 2 }], {
      field: 's',
      format: 'upper',
    });
    expect(result.status).toBe('applied');
    expect(result.rows).toEqual([{ s: 'AB', n: 1 }, { s: null }, { s: 2 }]);
  });

  it('is invalid without a field, skipped when the field is missing', () => {
    const { transformationMethod } = createFormatStringTransformation();
    expect(
      transformationMethod([{ a: 'x' }], { field: undefined, format: 'upper' }).issues[0].code
    ).toBe('invalid_config');
    expect(transformationMethod([{ a: 'x' }], { field: 's', format: 'upper' }).issues[0].code).toBe(
      'missing_fields'
    );
  });
});
