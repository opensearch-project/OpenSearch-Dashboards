/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { Subject } from 'rxjs';
import { useObservableValue } from './use_observable_value';

describe('useObservableValue', () => {
  it('should return its initial value if not emit', () => {
    const observableFunction = new Subject();
    const initialValue = () => {};
    const { result } = renderHook(() => useObservableValue(observableFunction, initialValue));

    expect(result.current).toBe(initialValue);
  });
  it('should return emit value', () => {
    const observableFunction = new Subject();
    const initialValue = () => {};
    const { result } = renderHook(() => useObservableValue(observableFunction, initialValue));

    const emitValue = () => {};
    observableFunction.next(emitValue);
    expect(result.current).toBe(emitValue);
  });
});
