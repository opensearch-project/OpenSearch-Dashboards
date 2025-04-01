/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { IndexPattern } from './index_pattern';
import { formatHitProvider } from './format_hit';

const mockFlattenHit = {
  fieldA: 'valueA',
  fieldB: 'valueB',
};
const indexPatternGetFormatterForFieldConvertMock = jest.fn((val) => val);
const getByNameMock = (name: string) => {
  if (name === 'fieldA' || name === 'fieldB') {
    return name;
  }
  return undefined;
};
const defaultFormatConvertMock = jest.fn((val) => val);
const defaultFormatMock = {
  convert: defaultFormatConvertMock,
};

// this is a mock of index pattern that has just the things needed for this test
const indexPatternMock = ({
  fields: {
    getByName: getByNameMock,
  },
  flattenHit: () => mockFlattenHit,
  getFormatterForField: () => ({ convert: indexPatternGetFormatterForFieldConvertMock }),
} as unknown) as IndexPattern;

describe('formatHit', () => {
  let formatHit: any;

  beforeEach(() => {
    formatHit = formatHitProvider(indexPatternMock, defaultFormatMock);
  });

  afterEach(() => {
    indexPatternGetFormatterForFieldConvertMock.mockClear();
    defaultFormatConvertMock.mockClear();
  });

  test('formats hit in html as default correctly', () => {
    formatHit({});
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(2);
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenNthCalledWith(
      1,
      'valueA',
      'html',
      expect.objectContaining({ field: 'fieldA' })
    );
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenNthCalledWith(
      2,
      'valueB',
      'html',
      expect.objectContaining({ field: 'fieldB' })
    );
  });

  test('formats hit in html called multiple times leverages the cache', () => {
    const mockHit = {};
    formatHit(mockHit);
    formatHit(mockHit);
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(2);
  });

  test('formats hit in text correctly', () => {
    formatHit({}, 'text');
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(2);
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenNthCalledWith(
      1,
      'valueA',
      'text',
      expect.objectContaining({ field: 'fieldA' })
    );
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenNthCalledWith(
      2,
      'valueB',
      'text',
      expect.objectContaining({ field: 'fieldB' })
    );
  });

  test('formats hit in text called multiple times does not leverage cache', () => {
    const mockHit = {};
    formatHit(mockHit, 'text');
    formatHit(mockHit, 'text');
    expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(4);
  });

  describe('formatHit.formatField', () => {
    test('formats field in html as default correctly for field in index pattern', () => {
      const mockHit = {};
      formatHit.formatField(mockHit, 'fieldA');
      expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(1);
      expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledWith(
        'valueA',
        'html',
        expect.objectContaining({ field: 'fieldA' })
      );
    });

    test('formats field in html as default correctly for field in index pattern, using the cache when called after formatField()', () => {
      const mockHit = {};
      // should call indexPatternGetFormatterForFieldConvertMock twice
      formatHit(mockHit);
      // should not call indexPatternGetFormatterForFieldConvertMock
      formatHit.formatField(mockHit, 'fieldA');
      expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(2);
    });

    test('formats field in html as default correctly for field not in index pattern', () => {
      formatHit.formatField({}, 'fieldC');
      expect(indexPatternGetFormatterForFieldConvertMock).not.toHaveBeenCalled();
      expect(defaultFormatConvertMock).toHaveBeenCalledTimes(1);
      expect(defaultFormatConvertMock).toHaveBeenCalledWith(undefined, 'html', expect.anything());
    });

    test('formats field in html as default correctly for _source', () => {
      formatHit.formatField({ _source: 'source value' }, '_source');
      expect(defaultFormatConvertMock).toHaveBeenCalledTimes(1);
      expect(defaultFormatConvertMock).toHaveBeenCalledWith(
        'source value',
        'html',
        expect.anything()
      );
    });

    test('formats field in text correctly for field in index pattern', () => {
      const mockHit = {};
      formatHit.formatField(mockHit, 'fieldA', 'text');
      expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(1);
      expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledWith(
        'valueA',
        'text',
        expect.objectContaining({ field: 'fieldA' })
      );
    });

    test('formats field in text correctly for field in index pattern, skipping the cache when called after formatField()', () => {
      const mockHit = {};
      // should call indexPatternGetFormatterForFieldConvertMock twice
      formatHit(mockHit);
      // should call indexPatternGetFormatterForFieldConvertMock once
      formatHit.formatField(mockHit, 'fieldA', 'text');
      expect(indexPatternGetFormatterForFieldConvertMock).toHaveBeenCalledTimes(3);
    });

    test('formats field in text correctly for field not in index pattern', () => {
      formatHit.formatField({}, 'fieldC', 'text');
      expect(indexPatternGetFormatterForFieldConvertMock).not.toHaveBeenCalled();
      expect(defaultFormatConvertMock).toHaveBeenCalledTimes(1);
      expect(defaultFormatConvertMock).toHaveBeenCalledWith(undefined, 'text', expect.anything());
    });

    test('formats field in text correctly for _source', () => {
      formatHit.formatField({ _source: 'source value' }, '_source', 'text');
      expect(defaultFormatConvertMock).toHaveBeenCalledTimes(1);
      expect(defaultFormatConvertMock).toHaveBeenCalledWith(
        'source value',
        'text',
        expect.anything()
      );
    });
  });
});
