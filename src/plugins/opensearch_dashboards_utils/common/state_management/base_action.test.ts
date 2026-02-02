/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { TestActions } from './mocks/mock_actions';
import { MockStateAdapter } from './mocks/mock_state_adapter';

describe('BaseActions', () => {
  describe('with BehaviorSubject', () => {
    let subject: BehaviorSubject<{ counter: number }>;
    let actions: TestActions;

    beforeEach(() => {
      subject = new BehaviorSubject<{ counter: number }>({ counter: 0 });
      actions = new TestActions(subject);
    });

    it('should update state through BehaviorSubject', () => {
      actions.increment();
      expect(subject.getValue()).toEqual({ counter: 1 });

      actions.increment();
      expect(subject.getValue()).toEqual({ counter: 2 });

      actions.decrement();
      expect(subject.getValue()).toEqual({ counter: 1 });

      actions.reset();
      expect(subject.getValue()).toEqual({ counter: 0 });
    });
  });

  describe('with StateAdapter', () => {
    let adapter: MockStateAdapter;
    let actions: TestActions;
    let stateChangeListener: jest.Mock;

    beforeEach(() => {
      adapter = new MockStateAdapter({ counter: 0 });
      actions = new TestActions(adapter);
      stateChangeListener = jest.fn();
      adapter.subscribe(stateChangeListener);
    });

    it('should update state through StateAdapter', () => {
      actions.increment();
      expect(adapter.getState()).toEqual({ counter: 1 });
      expect(stateChangeListener).toHaveBeenCalledWith({ counter: 1 });

      actions.increment();
      expect(adapter.getState()).toEqual({ counter: 2 });
      expect(stateChangeListener).toHaveBeenCalledWith({ counter: 2 });

      actions.decrement();
      expect(adapter.getState()).toEqual({ counter: 1 });
      expect(stateChangeListener).toHaveBeenCalledWith({ counter: 1 });

      actions.reset();
      expect(adapter.getState()).toEqual({ counter: 0 });
      expect(stateChangeListener).toHaveBeenCalledWith({ counter: 0 });
    });
  });
});
