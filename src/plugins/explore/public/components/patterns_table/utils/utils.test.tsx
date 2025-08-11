/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findDefaultPatternsField, highlightLogUsingPattern, isValidFiniteNumber } from './utils';
import { setPatternsField } from '../../../application/utils/state_management/slices/tab/tab_slice';
import * as queryActions from '../../../application/utils/state_management/actions/query_actions';

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

  describe('highlightLogUsingPattern', () => {
    it('dynamic element inside', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '[Log] <*> GET/<*> 172.198.1.1'
        )
      ).toStrictEqual('[Log] <mark>Gecko</mark> GET/<mark>something</mark> 172.198.1.1');
    });

    it('dynamic element in front', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '<*> <*> GET/<*> 172.198.1.1'
        )
      ).toStrictEqual(
        '<mark>[Log]</mark> <mark>Gecko</mark> GET/<mark>something</mark> 172.198.1.1'
      );
    });

    it('dynamic element in front with special delim', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '<*MSG*> <*> GET/<*> 172.198.1.1'
        )
      ).toStrictEqual(
        '<mark>[Log]</mark> <mark>Gecko</mark> GET/<mark>something</mark> 172.198.1.1'
      );
    });

    it('dynamic element at the end', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '[Log] <*> GET/<*> 172.198.<*>'
        )
      ).toStrictEqual(
        '[Log] <mark>Gecko</mark> GET/<mark>something</mark> 172.198.<mark>1.1</mark>'
      );
    });

    it('dynamic element at the end with special delim', () => {
      expect(
        highlightLogUsingPattern(
          '[Log] Gecko GET/something 172.198.1.1',
          '[Log] <*> GET/<*> <*IP*>'
        )
      ).toStrictEqual(
        '[Log] <mark>Gecko</mark> GET/<mark>something</mark> <mark>172.198.1.1</mark>'
      );
    });

    it('dynamic elements at the front and back', () => {
      expect(
        highlightLogUsingPattern(
          '223.87.60.27 - - [2018-07-22T00:39:02.912Z] "GET /opensearch/opensearch-1.0.0.deb_1 HTTP/1.1" 200 6219 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1"',
          '<*IP*> - - [<*DATETIME*>] "GET <*> HTTP/<*><*>" 200 <*> "-" "Mozilla/<*><*> (<*>; Linux <*>_<*>; rv:<*><*><*>) Gecko/<*> Firefox/<*><*><*>"'
        )
      ).toStrictEqual(
        '<mark>223.87.60.27</mark> - - [<mark>2018-07-22T00:39:02.912Z</mark>] "GET <mark>/opensearch/opensearch-1.0.0.deb_1</mark> HTTP/<mark>1.1</mark>" 200 <mark>6219</mark> "-" "Mozilla/<mark>5.0</mark> (<mark>X11</mark>; Linux <mark>x86</mark>_<mark>64</mark>; rv:<mark>6.0a1</mark>) Gecko/<mark>20110421</mark> Firefox/<mark>6.0a1</mark>"'
      );
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

      expect(() => findDefaultPatternsField(services)).toThrow(
        'Unexpectedly cannot find a longest default patterns field'
      );
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

      expect(() => findDefaultPatternsField(services)).toThrow(
        'Unexpectedly cannot find a longest default patterns field'
      );
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
