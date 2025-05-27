/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { BehaviorSubjectAdapter, ReduxStoreAdapter } from './state_adapter';

describe('StateAdapter', () => {
  describe('BehaviorSubjectAdapter', () => {
    let subject: BehaviorSubject<{ count: number }>;
    let adapter: BehaviorSubjectAdapter<{ count: number }>;
    let listener: jest.Mock;

    beforeEach(() => {
      subject = new BehaviorSubject<{ count: number }>({ count: 0 });
      adapter = new BehaviorSubjectAdapter(subject);
      listener = jest.fn();
    });

    it('should get state from the BehaviorSubject', () => {
      expect(adapter.getState()).toEqual({ count: 0 });
    });

    it('should update state in the BehaviorSubject', () => {
      adapter.setState((state) => ({ count: state.count + 1 }));
      expect(subject.getValue()).toEqual({ count: 1 });
    });

    it('should notify subscribers when state changes', () => {
      const unsubscribe = adapter.subscribe(listener);
      adapter.setState((state) => ({ count: state.count + 1 }));
      expect(listener).toHaveBeenCalledWith({ count: 1 });
      unsubscribe();
    });
  });

  describe('ReduxStoreAdapter', () => {
    // Mock Redux store
    let mockStore: {
      getState: jest.Mock;
      dispatch: jest.Mock;
      subscribe: jest.Mock;
    };
    let mockSelector: jest.Mock;
    let mockActionCreator: jest.Mock;
    let adapter: ReduxStoreAdapter<{ count: number }, { counter: { count: number } }>;
    let storeSubscriberCallback: (() => void) | null;
    let listener: jest.Mock;

    beforeEach(() => {
      mockStore = {
        getState: jest.fn().mockReturnValue({ counter: { count: 0 } }),
        dispatch: jest.fn(),
        subscribe: jest.fn((cb) => {
          storeSubscriberCallback = cb;
          return () => {
            storeSubscriberCallback = null;
          };
        }),
      };

      mockSelector = jest.fn((state) => state.counter);
      mockActionCreator = jest.fn((updatedState) => ({
        type: 'UPDATE_STATE',
        payload: updatedState,
      }));

      adapter = new ReduxStoreAdapter(mockStore as any, mockSelector, mockActionCreator);

      listener = jest.fn();
    });

    it('should get state using the selector', () => {
      const state = adapter.getState();
      expect(mockSelector).toHaveBeenCalledWith({ counter: { count: 0 } });
      expect(state).toEqual({ count: 0 });
    });

    it('should notify subscribers when state changes', () => {
      // Set up the adapter with our listener
      const unsubscribe = adapter.subscribe(listener);

      // Mock state change in Redux store
      mockStore.getState.mockReturnValue({ counter: { count: 1 } });

      // Simulate Redux store notification
      if (storeSubscriberCallback) storeSubscriberCallback();

      expect(listener).toHaveBeenCalledWith({ count: 1 });
      unsubscribe();
    });

    it("should not notify subscribers if selected state doesn't change", () => {
      // Set up the adapter with our listener
      const unsubscribe = adapter.subscribe(listener);

      // Simulate Redux store notification without changing the relevant state
      if (storeSubscriberCallback) storeSubscriberCallback();

      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });
  });
});
