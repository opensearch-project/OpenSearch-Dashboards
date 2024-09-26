/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useRef } from 'react';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import useObservable from 'react-use/lib/useObservable';

/**
 * A custom hook for subscribing to an Observable that is a function.
 *
 * The `useObservable` hook from the `react-use` library doesn't support subscribing to an Observable
 * that is a function. This hook addresses that limitation by converting the function Observable
 * into a plain object Observable and then subscribing to its values using `useObservable` from `react-use`.
 *
 */
export const useObservableValue = <T>(observableValue$: Observable<T>, initialValue?: T) => {
  const initialValueRef = useRef(initialValue ? { value: initialValue } : undefined);
  const observable$ = useMemo(() => observableValue$.pipe(map((value) => ({ value }))), [
    observableValue$,
  ]);
  const observableValue = useObservable(observable$, initialValueRef.current);

  return observableValue?.value;
};
