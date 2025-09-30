/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantContextStoreImpl } from './assistant_context_store';
import { AssistantContextOptions } from '../types';

describe('AssistantContextStoreImpl', () => {
  let store: AssistantContextStoreImpl;

  beforeEach(() => {
    store = new AssistantContextStoreImpl();
  });

  afterEach(() => {
    store.clearAll();
  });

  describe('addContext', () => {
    it('should add context without ID when no ID provided', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      store.addContext(options);
      const contexts = store.getAllContexts();

      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toMatchObject({
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      });
      expect(contexts[0].id).toBeUndefined();
    });

    it('should add context with provided ID', () => {
      const options: AssistantContextOptions = {
        id: 'custom-id',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
        categories: ['custom'],
      };

      store.addContext(options);
      const contexts = store.getAllContexts();

      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toEqual({
        id: 'custom-id',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
        categories: ['custom'],
      });
    });

    it('should replace existing context with same ID', () => {
      const options1: AssistantContextOptions = {
        id: 'same-id',
        description: 'First context',
        value: { first: 'data' },
        label: 'First Label',
      };

      const options2: AssistantContextOptions = {
        id: 'same-id',
        description: 'Second context',
        value: { second: 'data' },
        label: 'Second Label',
      };

      store.addContext(options1);
      store.addContext(options2);
      const contexts = store.getAllContexts();

      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toMatchObject({
        id: 'same-id',
        description: 'Second context',
        value: { second: 'data' },
        label: 'Second Label',
      });
    });

    it('should use default categories when none provided', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      store.addContext(options);
      const contexts = store.getContextsByCategory('default');

      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toMatchObject({
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      });
    });

    it('should notify subscribers when context is added', () => {
      const subscriber = jest.fn();
      store.subscribe(subscriber);

      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      store.addContext(options);

      expect(subscriber).toHaveBeenCalledWith([
        expect.objectContaining({
          description: 'Test context',
          value: { test: 'data' },
          label: 'Test Label',
        }),
      ]);
    });
  });

  describe('removeContextById', () => {
    it('should remove context by ID', () => {
      const options: AssistantContextOptions = {
        id: 'test-id',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      store.addContext(options);
      expect(store.getAllContexts()).toHaveLength(1);

      store.removeContextById('test-id');
      expect(store.getAllContexts()).toHaveLength(0);
    });

    it('should not throw when removing non-existent ID', () => {
      expect(() => store.removeContextById('non-existent')).not.toThrow();
    });

    it('should notify subscribers when context is removed', () => {
      const subscriber = jest.fn();
      const options: AssistantContextOptions = {
        id: 'test-id',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      store.addContext(options);
      store.subscribe(subscriber);
      subscriber.mockClear(); // Clear the initial subscription call

      store.removeContextById('test-id');

      expect(subscriber).toHaveBeenCalledWith([]);
    });
  });

  describe('getContextsByCategory', () => {
    beforeEach(() => {
      store.addContext({
        id: 'context-1',
        description: 'Context 1',
        value: { data: 1 },
        label: 'Label 1',
        categories: ['category-a', 'category-b'],
      });

      store.addContext({
        id: 'context-2',
        description: 'Context 2',
        value: { data: 2 },
        label: 'Label 2',
        categories: ['category-b', 'category-c'],
      });

      store.addContext({
        id: 'context-3',
        description: 'Context 3',
        value: { data: 3 },
        label: 'Label 3',
        categories: ['category-c'],
      });
    });

    it('should return contexts matching the specified category', () => {
      const categoryAContexts = store.getContextsByCategory('category-a');
      expect(categoryAContexts).toHaveLength(1);
      expect(categoryAContexts[0].id).toBe('context-1');

      const categoryBContexts = store.getContextsByCategory('category-b');
      expect(categoryBContexts).toHaveLength(2);
      expect(categoryBContexts.map((c) => c.id)).toEqual(['context-1', 'context-2']);

      const categoryCContexts = store.getContextsByCategory('category-c');
      expect(categoryCContexts).toHaveLength(2);
      expect(categoryCContexts.map((c) => c.id)).toEqual(['context-2', 'context-3']);
    });

    it('should return empty array for non-existent category', () => {
      const contexts = store.getContextsByCategory('non-existent');
      expect(contexts).toEqual([]);
    });
  });

  describe('clearCategory', () => {
    beforeEach(() => {
      store.addContext({
        id: 'context-1',
        description: 'Context 1',
        value: { data: 1 },
        label: 'Label 1',
        categories: ['category-a'],
      });

      store.addContext({
        id: 'context-2',
        description: 'Context 2',
        value: { data: 2 },
        label: 'Label 2',
        categories: ['category-b'],
      });

      store.addContext({
        id: 'context-3',
        description: 'Context 3',
        value: { data: 3 },
        label: 'Label 3',
        categories: ['category-a', 'category-b'],
      });
    });

    it('should remove all contexts in the specified category', () => {
      store.clearCategory('category-a');
      const remainingContexts = store.getAllContexts();

      expect(remainingContexts).toHaveLength(2); // context-2 and context-3 (which has both categories)
      expect(remainingContexts.some((c) => c.id === 'context-2')).toBe(true);
    });

    it('should not affect contexts in other categories', () => {
      store.clearCategory('category-a');
      const categoryBContexts = store.getContextsByCategory('category-b');

      expect(categoryBContexts).toHaveLength(2); // context-2 and context-3
      expect(categoryBContexts.some((c) => c.id === 'context-2')).toBe(true);
      expect(categoryBContexts.some((c) => c.id === 'context-3')).toBe(true);
    });

    it('should notify subscribers when category is cleared', () => {
      const subscriber = jest.fn();
      store.subscribe(subscriber);
      subscriber.mockClear(); // Clear initial call

      store.clearCategory('category-a');

      expect(subscriber).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'context-2' }),
          expect.objectContaining({ id: 'context-3' }),
        ])
      );
    });
  });

  describe('clearAll', () => {
    it('should remove all contexts', () => {
      store.addContext({
        description: 'Context 1',
        value: { data: 1 },
        label: 'Label 1',
      });

      store.addContext({
        description: 'Context 2',
        value: { data: 2 },
        label: 'Label 2',
      });

      expect(store.getAllContexts()).toHaveLength(2);

      store.clearAll();
      expect(store.getAllContexts()).toHaveLength(0);
    });

    it('should notify subscribers when all contexts are cleared', () => {
      const subscriber = jest.fn();
      store.addContext({
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      });

      store.subscribe(subscriber);
      subscriber.mockClear();

      store.clearAll();

      expect(subscriber).toHaveBeenCalledWith([]);
    });
  });

  describe('subscribe', () => {
    it('should call subscriber immediately with current contexts', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      store.addContext(options);

      const subscriber = jest.fn();
      store.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith([
        expect.objectContaining({
          description: 'Test context',
          value: { test: 'data' },
          label: 'Test Label',
        }),
      ]);
    });

    it('should return unsubscribe function', () => {
      const subscriber = jest.fn();
      const unsubscribe = store.subscribe(subscriber);

      expect(typeof unsubscribe).toBe('function');

      // Add context to trigger notification
      store.addContext({
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      });

      expect(subscriber).toHaveBeenCalledTimes(2); // Initial + update

      unsubscribe();
      subscriber.mockClear();

      store.addContext({
        description: 'Another context',
        value: { test: 'data2' },
        label: 'Test Label 2',
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('getBackendFormattedContexts', () => {
    beforeEach(() => {
      store.addContext({
        id: 'context-1',
        description: 'Context 1 description',
        value: { data: 'value1' },
        label: 'Context 1 Label',
        categories: ['backend', 'api'],
      });

      store.addContext({
        id: 'context-2',
        description: 'Context 2 description',
        value: { data: 'value2' },
        label: 'Context 2 Label',
        categories: ['frontend', 'ui'],
      });

      store.addContext({
        id: 'context-3',
        description: 'Context 3 description',
        value: { data: 'value3' },
        label: 'Context 3 Label',
        categories: ['backend', 'database'],
      });
    });

    it('should return all contexts in backend format when no category specified', () => {
      const formatted = store.getBackendFormattedContexts();

      expect(formatted).toHaveLength(3);
      expect(formatted).toEqual(
        expect.arrayContaining([
          {
            description: 'Context 1 description',
            value: { data: 'value1' },
          },
          {
            description: 'Context 2 description',
            value: { data: 'value2' },
          },
          {
            description: 'Context 3 description',
            value: { data: 'value3' },
          },
        ])
      );
    });

    it('should return filtered contexts in backend format when category specified', () => {
      const formatted = store.getBackendFormattedContexts('backend');

      expect(formatted).toHaveLength(2);
      expect(formatted).toEqual([
        {
          description: 'Context 1 description',
          value: { data: 'value1' },
        },
        {
          description: 'Context 3 description',
          value: { data: 'value3' },
        },
      ]);
    });

    it('should return empty array for non-existent category', () => {
      const formatted = store.getBackendFormattedContexts('non-existent');
      expect(formatted).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle contexts with undefined values', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: undefined,
        label: 'Test Label',
      };

      expect(() => store.addContext(options)).not.toThrow();
      const contexts = store.getAllContexts();
      expect(contexts[0].value).toBeUndefined();
    });

    it('should handle contexts with null values', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: null,
        label: 'Test Label',
      };

      expect(() => store.addContext(options)).not.toThrow();
      const contexts = store.getAllContexts();
      expect(contexts[0].value).toBeNull();
    });

    it('should handle empty categories array', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
        categories: [],
      };

      store.addContext(options);
      const contexts = store.getContextsByCategory('');

      expect(contexts).toHaveLength(0); // Empty categories array means no category, so no contexts in any category
    });

    it('should handle multiple subscribers', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      store.subscribe(subscriber1);
      store.subscribe(subscriber2);

      store.addContext({
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      });

      expect(subscriber1).toHaveBeenCalledTimes(2); // Initial + update
      expect(subscriber2).toHaveBeenCalledTimes(2); // Initial + update
    });
  });
});
