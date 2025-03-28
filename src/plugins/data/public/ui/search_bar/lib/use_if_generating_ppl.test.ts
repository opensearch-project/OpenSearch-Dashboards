/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { renderHook } from '@testing-library/react-hooks';
import { BehaviorSubject } from 'rxjs';
import { useIfGeneratingppl } from './use_if_generating_ppl';

describe('useIfGeneratingppl', () => {
  let isGeneratingppl$: BehaviorSubject<boolean>;

  beforeEach(() => {
    isGeneratingppl$ = new BehaviorSubject<boolean>(false);
  });

  afterEach(() => {
    isGeneratingppl$.complete();
  });

  it('should initialize with the initial value from BehaviorSubject', () => {
    const { result } = renderHook(() => useIfGeneratingppl({ isGeneratingppl$ }));
    expect(result.current).toBe(false);
  });

  it('should update state when BehaviorSubject emits new value', () => {
    const { result } = renderHook(() => useIfGeneratingppl({ isGeneratingppl$ }));
    expect(result.current).toBe(false);
    isGeneratingppl$.next(true);
    expect(result.current).toBe(true);
  });

  it('should handle multiple emissions from BehaviorSubject', () => {
    const { result } = renderHook(() => useIfGeneratingppl({ isGeneratingppl$ }));
    isGeneratingppl$.next(true);
    expect(result.current).toBe(true);
    isGeneratingppl$.next(false);
    expect(result.current).toBe(false);
    isGeneratingppl$.next(true);
    expect(result.current).toBe(true);
  });
});
