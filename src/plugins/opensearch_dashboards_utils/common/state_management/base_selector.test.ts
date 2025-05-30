/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { TestSelectors } from './mocks/mock_selector';
import { MockStateAdapter } from './mocks/mock_state_adapter';

describe('BaseSelectors', () => {
  let changeHandlerMock: jest.Mock;

  beforeEach(() => {
    changeHandlerMock = jest.fn();
    // Mock requestAnimationFrame and cancelAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
      cb();
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('with BehaviorSubject', () => {
    let subject: BehaviorSubject<{ counter: number }>;
    let selectors: TestSelectors;

    beforeEach(() => {
      subject = new BehaviorSubject<{ counter: number }>({ counter: 42 });
      selectors = new TestSelectors(subject);
    });

    afterEach(() => {
      selectors.destroy();
    });

    it('should return the current state', () => {
      expect(selectors.getState()).toEqual({ counter: 42 });
    });

    it('should emit changes when state changes', () => {
      const unsubscribe = selectors.subscribe(changeHandlerMock);
      subject.next({ counter: 43 });
      expect(changeHandlerMock).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('should unsubscribe listeners', () => {
      const unsubscribe = selectors.subscribe(changeHandlerMock);
      unsubscribe();
      subject.next({ counter: 44 });
      expect(changeHandlerMock).not.toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      selectors.subscribe(changeHandlerMock);
      selectors.destroy();
      subject.next({ counter: 45 });
      expect(changeHandlerMock).not.toHaveBeenCalled();
    });
  });

  describe('with StateAdapter', () => {
    let adapter: MockStateAdapter;
    let selectors: TestSelectors;

    beforeEach(() => {
      adapter = new MockStateAdapter({ counter: 42 });
      selectors = new TestSelectors(adapter);
    });

    afterEach(() => {
      selectors.destroy();
    });

    it('should return the current state', () => {
      expect(selectors.getState()).toEqual({ counter: 42 });
    });

    it('should emit changes when state changes', () => {
      const unsubscribe = selectors.subscribe(changeHandlerMock);
      adapter.setState((state) => ({ counter: 43 }));
      expect(changeHandlerMock).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('should unsubscribe listeners', () => {
      const unsubscribe = selectors.subscribe(changeHandlerMock);
      unsubscribe();
      adapter.setState((state) => ({ counter: 44 }));
      expect(changeHandlerMock).not.toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      selectors.subscribe(changeHandlerMock);
      selectors.destroy();
      adapter.setState((state) => ({ counter: 45 }));
      expect(changeHandlerMock).not.toHaveBeenCalled();
    });
  });
});
