/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react-hooks';

import { chromeServiceMock } from '../../../../../../core/public/mocks';
import { useChromeVisibility } from './use_chrome_visibility';

describe('useChromeVisibility', () => {
  const chromeMock = chromeServiceMock.createStartContract();

  test('should set up a subscription for chrome visibility', () => {
    const { result } = renderHook(() => useChromeVisibility({ chrome: chromeMock }));

    expect(chromeMock.getIsVisible$).toHaveBeenCalled();
    expect(result.current).toEqual(false);
  });

  test('should change chrome visibility to true if change was emitted', () => {
    const { result } = renderHook(() => useChromeVisibility({ chrome: chromeMock }));
    const behaviorSubj = chromeMock.getIsVisible$.mock.results[0].value;
    act(() => {
      behaviorSubj.next(true);
    });

    expect(result.current).toEqual(true);
  });

  test('should destroy a subscription', () => {
    const { unmount } = renderHook(() => useChromeVisibility({ chrome: chromeMock }));
    const behaviorSubj = chromeMock.getIsVisible$.mock.results[0].value;
    const subscription = behaviorSubj.observers[0];
    subscription.unsubscribe = jest.fn();

    unmount();

    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
