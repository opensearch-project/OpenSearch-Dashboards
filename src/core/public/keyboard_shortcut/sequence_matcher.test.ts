/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SequenceMatcher } from './sequence_matcher';
import { ShortcutDefinition } from './types';

describe('SequenceMatcher', () => {
  let sequenceMatcher: SequenceMatcher;
  let mockExecute: jest.Mock;
  let mockExecute2: jest.Mock;
  let shortcutsMap: Map<string, ShortcutDefinition[]>;

  beforeEach(() => {
    sequenceMatcher = new SequenceMatcher();
    mockExecute = jest.fn();
    mockExecute2 = jest.fn();
    shortcutsMap = new Map();

    const shortcut1: ShortcutDefinition = {
      id: 'go-discover',
      pluginId: 'discover',
      name: 'Go to Discover',
      category: 'navigation',
      keys: 'g d',
      execute: mockExecute,
    };

    const shortcut2: ShortcutDefinition = {
      id: 'go-visualize',
      pluginId: 'visualize',
      name: 'Go to Visualize',
      category: 'navigation',
      keys: 'g v',
      execute: mockExecute2,
    };

    shortcutsMap.set('g d', [shortcut1]);
    shortcutsMap.set('g v', [shortcut2]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    it('should initialize with default timeout of 1000ms', () => {
      const matcher = new SequenceMatcher();
      expect(matcher).toBeInstanceOf(SequenceMatcher);
    });

    it('should initialize with custom timeout', () => {
      const matcher = new SequenceMatcher(500);
      expect(matcher).toBeInstanceOf(SequenceMatcher);
    });
  });

  describe('normalizeKeyString', () => {
    it('should normalize valid sequence strings', () => {
      expect(sequenceMatcher.normalizeKeyString('G D')).toBe('g d');
      expect(sequenceMatcher.normalizeKeyString('g v')).toBe('g v');
      expect(sequenceMatcher.normalizeKeyString('  g   d  ')).toBe('g d');
    });

    it('should throw error for invalid sequence format', () => {
      expect(() => sequenceMatcher.normalizeKeyString('g')).toThrow(
        'Invalid sequence: "g". Must be exactly two space-separated single keys.'
      );

      expect(() => sequenceMatcher.normalizeKeyString('g d f')).toThrow(
        'Invalid sequence: "g d f". Must be exactly two space-separated single keys.'
      );

      expect(() => sequenceMatcher.normalizeKeyString('')).toThrow(
        'Invalid sequence: "". Must be exactly two space-separated single keys.'
      );
    });

    it('should throw error for invalid sequence prefix', () => {
      expect(() => sequenceMatcher.normalizeKeyString('h d')).toThrow(
        'Invalid sequence prefix: "h". Allowed prefixes: g'
      );

      expect(() => sequenceMatcher.normalizeKeyString('x y')).toThrow(
        'Invalid sequence prefix: "x". Allowed prefixes: g'
      );
    });

    it('should throw error for invalid second key', () => {
      expect(() => sequenceMatcher.normalizeKeyString('g 1')).toThrow(
        'Invalid sequence second key: "1". Must be a single letter (a-z).'
      );

      expect(() => sequenceMatcher.normalizeKeyString('g dd')).toThrow(
        'Invalid sequence second key: "dd". Must be a single letter (a-z).'
      );

      expect(() => sequenceMatcher.normalizeKeyString('g +')).toThrow(
        'Invalid sequence second key: "+". Must be a single letter (a-z).'
      );
    });
  });

  describe('processKey - First Key', () => {
    it('should start sequence timer for first key', () => {
      jest.useFakeTimers();
      const result = sequenceMatcher.processKey('g', shortcutsMap);

      expect(result).toBeNull();
      jest.useRealTimers();
    });

    it('should handle any key as potential first key', () => {
      const result1 = sequenceMatcher.processKey('g', shortcutsMap);
      expect(result1).toBeNull();

      const result2 = sequenceMatcher.processKey('h', shortcutsMap);
      expect(result2).toBeNull();

      const result3 = sequenceMatcher.processKey('1', shortcutsMap);
      expect(result3).toBeNull();
    });
  });

  describe('processKey - Second Key (Sequence Match)', () => {
    it('should return matching shortcuts for valid sequence', () => {
      sequenceMatcher.processKey('g', shortcutsMap);

      const result = sequenceMatcher.processKey('d', shortcutsMap);

      expect(result).toEqual([shortcutsMap.get('g d')![0]]);
    });

    it('should return multiple shortcuts if registered for same sequence', () => {
      const shortcut3: ShortcutDefinition = {
        id: 'go-discover-alt',
        pluginId: 'discover',
        name: 'Alt Go to Discover',
        category: 'navigation',
        keys: 'g d',
        execute: jest.fn(),
      };

      shortcutsMap.set('g d', [shortcutsMap.get('g d')![0], shortcut3]);

      sequenceMatcher.processKey('g', shortcutsMap);
      const result = sequenceMatcher.processKey('d', shortcutsMap);

      expect(result).toHaveLength(2);
      expect(result).toEqual(shortcutsMap.get('g d'));
    });

    it('should start new sequence after failed match', () => {
      sequenceMatcher.processKey('g', shortcutsMap);

      const result1 = sequenceMatcher.processKey('x', shortcutsMap);
      expect(result1).toBeNull();

      const result2 = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result2).toBeNull();
    });

    it('should reset sequence state after match', () => {
      sequenceMatcher.processKey('g', shortcutsMap);
      const result1 = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result1).toEqual([shortcutsMap.get('g d')![0]]);

      sequenceMatcher.processKey('g', shortcutsMap);
      const result2 = sequenceMatcher.processKey('v', shortcutsMap);
      expect(result2).toEqual([shortcutsMap.get('g v')![0]]);
    });
  });

  describe('Sequence Timeout', () => {
    it('should reset sequence after timeout', () => {
      jest.useFakeTimers();

      sequenceMatcher.processKey('g', shortcutsMap);

      jest.advanceTimersByTime(1100);

      const result = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should use custom timeout value', () => {
      jest.useFakeTimers();

      const customMatcher = new SequenceMatcher(500);
      customMatcher.processKey('g', shortcutsMap);

      jest.advanceTimersByTime(400);
      const result1 = customMatcher.processKey('d', shortcutsMap);
      expect(result1).toEqual([shortcutsMap.get('g d')![0]]);

      customMatcher.processKey('g', shortcutsMap);
      jest.advanceTimersByTime(600);
      const result2 = customMatcher.processKey('d', shortcutsMap);
      expect(result2).toBeNull();

      jest.useRealTimers();
    });

    it('should clear timer on successful sequence match', () => {
      jest.useFakeTimers();

      sequenceMatcher.processKey('g', shortcutsMap);
      sequenceMatcher.processKey('d', shortcutsMap);

      jest.advanceTimersByTime(1100);
      sequenceMatcher.processKey('g', shortcutsMap);
      const result = sequenceMatcher.processKey('v', shortcutsMap);
      expect(result).toEqual([shortcutsMap.get('g v')![0]]);

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shortcuts map', () => {
      const emptyMap = new Map<string, ShortcutDefinition[]>();

      sequenceMatcher.processKey('g', emptyMap);
      const result = sequenceMatcher.processKey('d', emptyMap);

      expect(result).toBeNull();
    });

    it('should handle shortcuts with empty arrays', () => {
      shortcutsMap.set('g d', []);

      sequenceMatcher.processKey('g', shortcutsMap);
      const result = sequenceMatcher.processKey('d', shortcutsMap);

      expect(result).toBeNull();
    });

    it('should handle rapid key sequences', () => {
      sequenceMatcher.processKey('g', shortcutsMap);
      const result1 = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result1).toEqual([shortcutsMap.get('g d')![0]]);

      sequenceMatcher.processKey('g', shortcutsMap);
      const result2 = sequenceMatcher.processKey('v', shortcutsMap);
      expect(result2).toEqual([shortcutsMap.get('g v')![0]]);
    });

    it('should handle sequence interruption by new sequence', () => {
      jest.useFakeTimers();

      sequenceMatcher.processKey('g', shortcutsMap);

      sequenceMatcher.processKey('h', shortcutsMap);

      const result = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Timer Management', () => {
    it('should clear existing timer when starting new sequence', () => {
      jest.useFakeTimers();

      sequenceMatcher.processKey('g', shortcutsMap);

      sequenceMatcher.processKey('h', shortcutsMap);
      jest.advanceTimersByTime(1100);

      expect(() => sequenceMatcher.processKey('x', shortcutsMap)).not.toThrow();

      jest.useRealTimers();
    });

    it('should handle multiple timer clears gracefully', () => {
      jest.useFakeTimers();

      sequenceMatcher.processKey('g', shortcutsMap);
      sequenceMatcher.processKey('d', shortcutsMap);

      expect(() => {
        sequenceMatcher.processKey('g', shortcutsMap);
        sequenceMatcher.processKey('v', shortcutsMap);
      }).not.toThrow();

      jest.useRealTimers();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle alternating sequences correctly', () => {
      sequenceMatcher.processKey('g', shortcutsMap);
      let result = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result).toEqual([shortcutsMap.get('g d')![0]]);

      sequenceMatcher.processKey('g', shortcutsMap);
      result = sequenceMatcher.processKey('v', shortcutsMap);
      expect(result).toEqual([shortcutsMap.get('g v')![0]]);

      sequenceMatcher.processKey('g', shortcutsMap);
      result = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result).toEqual([shortcutsMap.get('g d')![0]]);
    });

    it('should handle mixed valid and invalid sequences', () => {
      sequenceMatcher.processKey('g', shortcutsMap);
      let result = sequenceMatcher.processKey('d', shortcutsMap);
      expect(result).toEqual([shortcutsMap.get('g d')![0]]);

      sequenceMatcher.processKey('g', shortcutsMap);
      result = sequenceMatcher.processKey('z', shortcutsMap);
      expect(result).toBeNull();
      sequenceMatcher.processKey('g', shortcutsMap);
      result = sequenceMatcher.processKey('v', shortcutsMap);
      expect(result).toEqual([shortcutsMap.get('g v')![0]]);
    });
  });
});
