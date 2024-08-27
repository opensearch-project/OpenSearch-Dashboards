/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_USE_CASES } from '../common/constants';

export const createMockedRegisteredUseCases = () =>
  [
    WORKSPACE_USE_CASES.observability,
    WORKSPACE_USE_CASES['security-analytics'],
    WORKSPACE_USE_CASES.essentials,
    WORKSPACE_USE_CASES.search,
  ].map((item) => ({
    ...item,
    features: item.features.map((id) => ({ id })),
  }));

export const createMockedRegisteredUseCases$ = () =>
  new BehaviorSubject(createMockedRegisteredUseCases());
