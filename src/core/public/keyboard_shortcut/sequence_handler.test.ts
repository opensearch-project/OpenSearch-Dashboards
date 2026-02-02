/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SequenceHandler } from './sequence_handler';
import { ShortcutDefinition } from './types';

describe('SequenceHandler', () => {
  let sequenceHandler: SequenceHandler;
  let mockExecute: jest.Mock;
  let mockExecute2: jest.Mock;
  let shortcutsMap: Map<string, ShortcutDefinition[]>;

  beforeEach(() => {
    sequenceHandler = new SequenceHandler();
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
      const handler = new SequenceHandler();
      expect(handler).toBeInstanceOf(SequenceHandler);
    });

    it('should initialize with custom timeout', () => {
      const handler = new SequenceHandler(500);
      expect(handler).toBeInstanceOf(SequenceHandler);
    });
  });

  describe('normalizeKeyString', () => {
    it('should normalize valid sequence strings', () => {
      expect(sequenceHandler.normalizeKeyString('G D')).toBe('g d');
      expect(sequenceHandler.normalizeKeyString('g v')).toBe('g v');
      expect(sequenceHandler.normalizeKeyString('  g   d  ')).toBe('g d');
    });

    it('should throw error for invalid sequence format', () => {
      expect(() => sequenceHandler.normalizeKeyString('g')).toThrow(
        'Invalid sequence: "g". Must be exactly two space-separated single keys.'
      );

      expect(() => sequenceHandler.normalizeKeyString('g d f')).toThrow(
        'Invalid sequence: "g d f". Must be exactly two space-separated single keys.'
      );

      expect(() => sequenceHandler.normalizeKeyString('')).toThrow(
        'Invalid sequence: "". Must be exactly two space-separated single keys.'
      );
    });

    it('should throw error for invalid sequence prefix', () => {
      expect(() => sequenceHandler.normalizeKeyString('h d')).toThrow(
        'Invalid sequence prefix: "h". Allowed prefixes: g'
      );

      expect(() => sequenceHandler.normalizeKeyString('x y')).toThrow(
        'Invalid sequence prefix: "x". Allowed prefixes: g'
      );
    });

    it('should throw error for invalid second key', () => {
      expect(() => sequenceHandler.normalizeKeyString('g 1')).toThrow(
        'Invalid sequence second key: "1". Must be a single letter (a-z).'
      );

      expect(() => sequenceHandler.normalizeKeyString('g dd')).toThrow(
        'Invalid sequence second key: "dd". Must be a single letter (a-z).'
      );

      expect(() => sequenceHandler.normalizeKeyString('g +')).toThrow(
        'Invalid sequence second key: "+". Must be a single letter (a-z).'
      );
    });
  });

  describe('processFirstKey', () => {
    it('should start sequence timer for first key', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');

      expect(sequenceHandler.isInSequence()).toBe(true);
      jest.useRealTimers();
    });

    it('should handle any key as potential first key', () => {
      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      sequenceHandler.processFirstKey('h');
      expect(sequenceHandler.isInSequence()).toBe(true);

      sequenceHandler.processFirstKey('1');
      expect(sequenceHandler.isInSequence()).toBe(true);
    });

    it('should replace previous first key when called multiple times', () => {
      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      sequenceHandler.processFirstKey('h');
      expect(sequenceHandler.isInSequence()).toBe(true);

      const result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('h d');
    });
  });

  describe('processSecondKey', () => {
    it('should return sequence key for valid sequence', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('d');

      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should return sequence key regardless of whether shortcuts are registered', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('d');

      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should start new sequence if second key is valid sequence prefix', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('g');

      expect(result).toBe('g g');
      expect(sequenceHandler.isInSequence()).toBe(true);
    });

    it('should reset sequence after processing second key with non-prefix key', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('x');

      expect(result).toBe('g x');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should reset sequence state after processing second key', () => {
      sequenceHandler.processFirstKey('g');
      const result1 = sequenceHandler.processSecondKey('d');
      expect(result1).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);

      sequenceHandler.processFirstKey('g');
      const result2 = sequenceHandler.processSecondKey('v');
      expect(result2).toBe('g v');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should return sequence key when no first key is set', () => {
      const result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('null d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });
  });

  describe('isInSequence', () => {
    it('should return false initially', () => {
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should return true after processFirstKey', () => {
      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);
    });

    it('should return false after successful sequence completion', () => {
      sequenceHandler.processFirstKey('g');
      sequenceHandler.processSecondKey('d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should return false after sequence timeout', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      jest.advanceTimersByTime(1100);
      expect(sequenceHandler.isInSequence()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Sequence Timeout', () => {
    it('should reset sequence after timeout', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      jest.advanceTimersByTime(1100);
      expect(sequenceHandler.isInSequence()).toBe(false);

      const result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('null d');

      jest.useRealTimers();
    });

    it('should use custom timeout value', () => {
      jest.useFakeTimers();

      const customHandler = new SequenceHandler(500);
      customHandler.processFirstKey('g');

      jest.advanceTimersByTime(400);
      const result1 = customHandler.processSecondKey('d');
      expect(result1).toBe('g d');

      customHandler.processFirstKey('g');
      jest.advanceTimersByTime(600);
      expect(customHandler.isInSequence()).toBe(false);
      const result2 = customHandler.processSecondKey('d');
      expect(result2).toBe('null d');

      jest.useRealTimers();
    });

    it('should clear timer on successful sequence match', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      sequenceHandler.processSecondKey('d');

      jest.advanceTimersByTime(1100);
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('v');
      expect(result).toBe('g v');

      jest.useRealTimers();
    });

    it('should clear timer when starting new sequence', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      sequenceHandler.processFirstKey('h');
      expect(sequenceHandler.isInSequence()).toBe(true);

      jest.advanceTimersByTime(500);
      expect(sequenceHandler.isInSequence()).toBe(true);

      jest.advanceTimersByTime(600);
      expect(sequenceHandler.isInSequence()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shortcuts map', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('d');

      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should handle shortcuts with empty arrays', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('d');

      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should handle rapid key sequences', () => {
      sequenceHandler.processFirstKey('g');
      const result1 = sequenceHandler.processSecondKey('d');
      expect(result1).toBe('g d');

      sequenceHandler.processFirstKey('g');
      const result2 = sequenceHandler.processSecondKey('v');
      expect(result2).toBe('g v');
    });

    it('should handle sequence interruption by new sequence prefix', () => {
      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      const result = sequenceHandler.processSecondKey('g');
      expect(result).toBe('g g');
      expect(sequenceHandler.isInSequence()).toBe(true);
    });

    it('should handle sequence interruption by non-prefix key', () => {
      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      const result = sequenceHandler.processSecondKey('h');
      expect(result).toBe('g h');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should handle undefined shortcuts gracefully', () => {
      sequenceHandler.processFirstKey('g');
      const result = sequenceHandler.processSecondKey('z');

      expect(result).toBe('g z');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });
  });

  describe('Timer Management', () => {
    it('should clear existing timer when starting new sequence', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      sequenceHandler.processFirstKey('h');
      expect(sequenceHandler.isInSequence()).toBe(true);

      jest.advanceTimersByTime(1100);
      expect(sequenceHandler.isInSequence()).toBe(false);

      expect(() => sequenceHandler.processSecondKey('x')).not.toThrow();

      jest.useRealTimers();
    });

    it('should handle multiple timer clears gracefully', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      sequenceHandler.processSecondKey('d');

      expect(() => {
        sequenceHandler.processFirstKey('g');
        sequenceHandler.processSecondKey('v');
      }).not.toThrow();

      jest.useRealTimers();
    });

    it('should not throw when clearing timer multiple times', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');

      sequenceHandler.processSecondKey('d');

      jest.advanceTimersByTime(1100);

      expect(() => {
        sequenceHandler.processFirstKey('g');
      }).not.toThrow();

      jest.useRealTimers();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle alternating sequences correctly', () => {
      sequenceHandler.processFirstKey('g');
      let result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);

      sequenceHandler.processFirstKey('g');
      result = sequenceHandler.processSecondKey('v');
      expect(result).toBe('g v');
      expect(sequenceHandler.isInSequence()).toBe(false);

      sequenceHandler.processFirstKey('g');
      result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should handle mixed valid and invalid sequences', () => {
      sequenceHandler.processFirstKey('g');
      let result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);

      sequenceHandler.processFirstKey('g');
      result = sequenceHandler.processSecondKey('z');
      expect(result).toBe('g z');
      expect(sequenceHandler.isInSequence()).toBe(false);

      sequenceHandler.processFirstKey('g');
      result = sequenceHandler.processSecondKey('v');
      expect(result).toBe('g v');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should handle chained sequence prefixes', () => {
      sequenceHandler.processFirstKey('g');

      let result = sequenceHandler.processSecondKey('g');
      expect(result).toBe('g g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      // To get "g d", need to explicitly start new sequence
      sequenceHandler.processFirstKey('g');
      result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('g d');
      expect(sequenceHandler.isInSequence()).toBe(false);
    });

    it('should handle timeout during complex sequences', () => {
      jest.useFakeTimers();

      sequenceHandler.processFirstKey('g');
      expect(sequenceHandler.isInSequence()).toBe(true);

      jest.advanceTimersByTime(1100);
      expect(sequenceHandler.isInSequence()).toBe(false);

      let result = sequenceHandler.processSecondKey('d');
      expect(result).toBe('null d');

      sequenceHandler.processFirstKey('g');
      result = sequenceHandler.processSecondKey('v');
      expect(result).toBe('g v');

      jest.useRealTimers();
    });
  });
});
