/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import {
  brainExcludeSearchPatternQuery,
  brainUpdateSearchPatternQuery,
  createExcludeSearchPatternQuery,
  createSearchPatternQuery,
  findDefaultPatternsField,
  highlightLogUsingPattern,
  isValidFiniteNumber,
  regexExcludeSearchPatternQuery,
  regexUpdateSearchPatternQuery,
} from './utils';
import { setPatternsField } from '../../../application/utils/state_management/slices/tab/tab_slice';
import * as queryActions from '../../../application/utils/state_management/actions/query_actions';

jest.mock('@osd/ui-shared-deps/theme', () => ({
  euiThemeVars: {
    ouiColorVis13: '#40D',
  },
}));

jest.mock('../../../application/utils/state_management/slices/tab/tab_slice', () => ({
  setPatternsField: jest
    .fn()
    .mockImplementation((field) => ({ type: 'mock/setPatternsField', payload: field })),
}));

// Mock the defaultPrepareQueryString function
jest.mock('../../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn().mockReturnValue('default-query'),
}));

// Mock for store.getState()
const mockGetState = jest.fn();

describe('utils', () => {
  describe('isValidFiniteNumber', () => {
    // Test valid numbers
    it('should return true for valid positive numbers', () => {
      expect(isValidFiniteNumber(42)).toBe(true);
      expect(isValidFiniteNumber(0.5)).toBe(true);
      expect(isValidFiniteNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should return true for valid negative numbers', () => {
      expect(isValidFiniteNumber(-42)).toBe(true);
      expect(isValidFiniteNumber(-0.5)).toBe(true);
      expect(isValidFiniteNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isValidFiniteNumber(0)).toBe(true);
    });

    // Test invalid numbers
    it('should return false for NaN', () => {
      expect(isValidFiniteNumber(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidFiniteNumber(Infinity)).toBe(false);
      expect(isValidFiniteNumber(-Infinity)).toBe(false);
    });

    // Scientific notation tests
    it('should handle positive scientific notation correctly', () => {
      expect(isValidFiniteNumber(1e5)).toBe(true);
      expect(isValidFiniteNumber(1.23e5)).toBe(true);
      expect(isValidFiniteNumber(1e5)).toBe(true);
    });

    it('should handle negative scientific notation correctly', () => {
      expect(isValidFiniteNumber(1e-5)).toBe(true);
      expect(isValidFiniteNumber(1.23e-5)).toBe(true);
      expect(isValidFiniteNumber(-1.23e-5)).toBe(true);
    });
  });

  describe('pattern query builders', () => {
    const queryBase = 'source = my_index';
    const patternsField = 'message';
    const patternString = 'Error in <*>';

    describe('regexUpdateSearchPatternQuery', () => {
      it('should build a regex include pattern query', () => {
        expect(regexUpdateSearchPatternQuery(queryBase, patternsField, patternString)).toBe(
          'source = my_index | patterns `message` | where patterns_field = "Error in <*>"'
        );
      });

      it('should escape double quotes in patternString', () => {
        expect(regexUpdateSearchPatternQuery(queryBase, patternsField, 'say "hello"')).toBe(
          'source = my_index | patterns `message` | where patterns_field = "say \\"hello\\""'
        );
      });
    });

    describe('brainUpdateSearchPatternQuery', () => {
      it('should build a brain include pattern query', () => {
        expect(brainUpdateSearchPatternQuery(queryBase, patternsField, patternString)).toBe(
          'source = my_index | patterns `message` method=brain mode=label | where patterns_field = "Error in <*>"'
        );
      });

      it('should escape double quotes in patternString', () => {
        expect(brainUpdateSearchPatternQuery(queryBase, patternsField, 'say "hello"')).toBe(
          'source = my_index | patterns `message` method=brain mode=label | where patterns_field = "say \\"hello\\""'
        );
      });
    });

    describe('regexExcludeSearchPatternQuery', () => {
      it('should build a regex exclude pattern query', () => {
        expect(regexExcludeSearchPatternQuery(queryBase, patternsField, patternString)).toBe(
          'source = my_index | patterns `message` | where patterns_field != "Error in <*>"'
        );
      });

      it('should escape double quotes in patternString', () => {
        expect(regexExcludeSearchPatternQuery(queryBase, patternsField, 'say "hello"')).toBe(
          'source = my_index | patterns `message` | where patterns_field != "say \\"hello\\""'
        );
      });
    });

    describe('brainExcludeSearchPatternQuery', () => {
      it('should build a brain exclude pattern query', () => {
        expect(brainExcludeSearchPatternQuery(queryBase, patternsField, patternString)).toBe(
          'source = my_index | patterns `message` method=brain mode=label | where patterns_field != "Error in <*>"'
        );
      });

      it('should escape double quotes in patternString', () => {
        expect(brainExcludeSearchPatternQuery(queryBase, patternsField, 'say "hello"')).toBe(
          'source = my_index | patterns `message` method=brain mode=label | where patterns_field != "say \\"hello\\""'
        );
      });
    });
  });

  describe('createSearchPatternQuery', () => {
    const patternsField = 'message';
    const patternString = 'Error <*>';

    it('should use raw query.query (no prepareQueryForLanguage) with brain method', () => {
      const query = { query: 'my raw query', language: 'PPL' };
      const result = createSearchPatternQuery(query, patternsField, false, patternString);
      expect(result).toBe(
        'my raw query | patterns `message` method=brain mode=label | where patterns_field = "Error <*>"'
      );
    });

    it('should use raw query.query with regex method', () => {
      const query = { query: 'my raw query', language: 'PPL' };
      const result = createSearchPatternQuery(query, patternsField, true, patternString);
      expect(result).toBe('my raw query | patterns `message` | where patterns_field = "Error <*>"');
    });

    it('should handle non-string query.query by defaulting to empty string', () => {
      const query = { query: 123, language: 'PPL' } as any;
      const result = createSearchPatternQuery(query, patternsField, false, patternString);
      expect(result).toContain(
        ' | patterns `message` method=brain mode=label | where patterns_field = "Error <*>"'
      );
      expect(result.startsWith(' |')).toBe(true);
    });
  });

  describe('createExcludeSearchPatternQuery', () => {
    const patternsField = 'message';
    const patternString = 'Error <*>';

    it('should use raw query.query with brain method and != operator', () => {
      const query = { query: 'my raw query', language: 'PPL' };
      const result = createExcludeSearchPatternQuery(query, patternsField, false, patternString);
      expect(result).toBe(
        'my raw query | patterns `message` method=brain mode=label | where patterns_field != "Error <*>"'
      );
    });

    it('should use raw query.query with regex method and != operator', () => {
      const query = { query: 'my raw query', language: 'PPL' };
      const result = createExcludeSearchPatternQuery(query, patternsField, true, patternString);
      expect(result).toBe(
        'my raw query | patterns `message` | where patterns_field != "Error <*>"'
      );
    });
  });

  describe('highlightLogUsingPattern - with V2', () => {
    const renderHighlight = (log: string, pattern: string) => {
      const result = highlightLogUsingPattern(log, pattern, false);
      const { container } = render(React.createElement(React.Fragment, null, result));
      return container;
    };

    it('dynamic element inside', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '[Log] <*> GET/<*> 172.198.1.1'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(2);
      expect(spans[0].textContent).toBe('Gecko');
      expect(spans[1].textContent).toBe('something');
    });

    it('dynamic element in front', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '<*> <*> GET/<*> 172.198.1.1'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[0].textContent).toBe('[Log]');
      expect(spans[1].textContent).toBe('Gecko');
      expect(spans[2].textContent).toBe('something');
    });

    it('dynamic element in front with special delim', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '<*MSG*> <*> GET/<*> 172.198.1.1'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[0].textContent).toBe('[Log]');
    });

    it('dynamic element at the end', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '[Log] <*> GET/<*> 172.198.<*>'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[2].textContent).toBe('1.1');
    });

    it('dynamic element at the end with special delim', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '[Log] <*> GET/<*> <*IP*>'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[2].textContent).toBe('172.198.1.1');
    });

    it('dynamic elements at the front and back', () => {
      const container = renderHighlight(
        '223.87.60.27 - - [2018-07-22T00:39:02.912Z] "GET /opensearch/opensearch-1.0.0.deb_1 HTTP/1.1" 200 6219 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1"',
        '<*IP*> - - [<*DATETIME*>] "GET <*> HTTP/<*><*>" 200 <*> "-" "Mozilla/<*><*> (<*>; Linux <*>_<*>; rv:<*><*><*>) Gecko/<*> Firefox/<*><*><*>"'
      );
      expect(container.textContent).toBe(
        '223.87.60.27 - - [2018-07-22T00:39:02.912Z] "GET /opensearch/opensearch-1.0.0.deb_1 HTTP/1.1" 200 6219 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1"'
      );
      const spans = container.querySelectorAll('span[style]');
      expect(spans[0].textContent).toBe('223.87.60.27');
      expect(spans[1].textContent).toBe('2018-07-22T00:39:02.912Z');
    });
  });

  describe('highlightLogUsingPattern - with Calcite', () => {
    const renderHighlight = (log: string, pattern: string) => {
      const result = highlightLogUsingPattern(log, pattern, false);
      const { container } = render(React.createElement(React.Fragment, null, result));
      return container;
    };

    it('dynamic element inside', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '[Log] <token1> GET/<token2> 172.198.1.1'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(2);
      expect(spans[0].textContent).toBe('Gecko');
      expect(spans[1].textContent).toBe('something');
    });

    it('dynamic element in front', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '<token1> <token2> GET/<token3> 172.198.1.1'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[0].textContent).toBe('[Log]');
    });

    it('dynamic element in front with special delim', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '<token1> <token2> GET/<token3> 172.198.1.1'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
    });

    it('dynamic element at the end', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '[Log] <token1> GET/<token2> 172.198.<token3>'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[2].textContent).toBe('1.1');
    });

    it('dynamic element at the end with special delim', () => {
      const container = renderHighlight(
        '[Log] Gecko GET/something 172.198.1.1',
        '[Log] <token1> GET/<token2> <token3>'
      );
      expect(container.textContent).toBe('[Log] Gecko GET/something 172.198.1.1');
      const spans = container.querySelectorAll('span[style]');
      expect(spans).toHaveLength(3);
      expect(spans[2].textContent).toBe('172.198.1.1');
    });

    it('dynamic elements at the front and back', () => {
      const container = renderHighlight(
        '223.87.60.27 - - [2018-07-22T00:39:02.912Z] "GET /opensearch/opensearch-1.0.0.deb_1 HTTP/1.1" 200 6219 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1"',
        '<token1> - - [<token2>] "GET <token3> HTTP/<token4><token5>" 200 <token6> "-" "Mozilla/<token7><token8> (<token9>; Linux <token10>_<token11>; rv:<token12><token13><token14>) Gecko/<token15> Firefox/<token16><token17><token18>"'
      );
      expect(container.textContent).toBe(
        '223.87.60.27 - - [2018-07-22T00:39:02.912Z] "GET /opensearch/opensearch-1.0.0.deb_1 HTTP/1.1" 200 6219 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1"'
      );
      const spans = container.querySelectorAll('span[style]');
      expect(spans[0].textContent).toBe('223.87.60.27');
      expect(spans[1].textContent).toBe('2018-07-22T00:39:02.912Z');
    });
  });

  describe('findDefaultPatternsField', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockGetState.mockReset();
    });

    it('should throw error when state is not provided', () => {
      mockGetState.mockReturnValue(undefined);
      const services = {
        store: {
          getState: mockGetState,
          dispatch: jest.fn(),
        },
      } as any;
      expect(() => findDefaultPatternsField(services)).toThrow('State is unexpectedly empty');
      expect(setPatternsField).not.toHaveBeenCalled();
    });

    it('should throw error when services.store is not provided', () => {
      const services = {
        tabRegistry: { getTab: jest.fn() },
      } as any;
      expect(() => findDefaultPatternsField(services)).toThrow('Store is unexpectedly empty');
      expect(setPatternsField).not.toHaveBeenCalled();
    });

    it('should throw error when logs tab is not found', () => {
      const state = {
        query: { language: 'PPL' },
        results: {},
      } as any;
      mockGetState.mockReturnValue(state);
      const services = {
        store: { dispatch: jest.fn(), getState: mockGetState },
        tabRegistry: { getTab: jest.fn().mockReturnValue(null) },
      } as any;

      expect(() => findDefaultPatternsField(services)).toThrow(
        'Logs tab is unexpectedly uninitialized'
      );
      expect(setPatternsField).not.toHaveBeenCalled();
      expect(services.tabRegistry.getTab).toHaveBeenCalledWith('logs');
    });

    it('should throw error when there are no results', () => {
      const state = {
        query: { language: 'PPL' },
        results: {},
      } as any;
      mockGetState.mockReturnValue(state);
      const services = {
        store: { dispatch: jest.fn(), getState: mockGetState },
        tabRegistry: { getTab: jest.fn().mockReturnValue({ id: 'logs' }) },
      } as any;

      expect(() => findDefaultPatternsField(services)).toThrow('Cannot access hits from logs tab');
      expect(setPatternsField).not.toHaveBeenCalled();
      expect(queryActions.defaultPrepareQueryString).toHaveBeenCalledWith(state.query);
    });

    it('should throw error when there are no hits', () => {
      const state = {
        query: { language: 'PPL' },
        results: {
          'default-query': {
            fieldSchema: [
              { name: 'field1', type: 'string' },
              { name: 'field2', type: 'string' },
            ],
            hits: { hits: [] },
          },
        },
      } as any;
      mockGetState.mockReturnValue(state);
      const services = {
        store: { dispatch: jest.fn(), getState: mockGetState },
        tabRegistry: { getTab: jest.fn().mockReturnValue({ id: 'logs' }) },
      } as any;

      expect(() => findDefaultPatternsField(services)).toThrow('Cannot access hits from logs tab');
      expect(setPatternsField).not.toHaveBeenCalled();
      expect(queryActions.defaultPrepareQueryString).toHaveBeenCalledWith(state.query);
    });

    it('should find the field with the longest string value and dispatch action', () => {
      const state = {
        query: { language: 'PPL' },
        results: {
          'default-query': {
            fieldSchema: [
              { name: 'field1', type: 'string' },
              { name: 'field2', type: 'string' },
              { name: 'field3', type: 'number' }, // Should be ignored as it's not a string
            ],
            hits: {
              hits: [
                {
                  _source: {
                    field1: 'short value',
                    field2: 'this is a longer value that should be selected',
                    field3: 123, // Should be ignored as it's not a string field
                    field4: 'ignored because not in fieldSchema',
                  },
                },
              ],
            },
          },
        },
      } as any;
      mockGetState.mockReturnValue(state);
      const services = {
        store: { dispatch: jest.fn(), getState: mockGetState },
        tabRegistry: { getTab: jest.fn().mockReturnValue({ id: 'logs' }) },
      } as any;

      const result = findDefaultPatternsField(services);
      expect(result).toBe('field2');
      expect(setPatternsField).toHaveBeenCalledWith('field2');
      expect(services.store.dispatch).toHaveBeenCalled();
      expect(queryActions.defaultPrepareQueryString).toHaveBeenCalledWith(state.query);
    });

    it('should handle non-string values in _source correctly', () => {
      const state = {
        query: { language: 'PPL' },
        results: {
          'default-query': {
            fieldSchema: [
              { name: 'field1', type: 'string' },
              { name: 'field2', type: 'string' },
            ],
            hits: {
              hits: [
                {
                  _source: {
                    field1: 'valid string',
                    field2: null, // Non-string value
                  },
                },
              ],
            },
          },
        },
      } as any;
      mockGetState.mockReturnValue(state);
      const services = {
        store: { dispatch: jest.fn(), getState: mockGetState },
        tabRegistry: { getTab: jest.fn().mockReturnValue({ id: 'logs' }) },
      } as any;

      const result = findDefaultPatternsField(services);
      expect(result).toBe('field1');
      expect(setPatternsField).toHaveBeenCalledWith('field1');
      expect(queryActions.defaultPrepareQueryString).toHaveBeenCalledWith(state.query);
    });
  });
});
