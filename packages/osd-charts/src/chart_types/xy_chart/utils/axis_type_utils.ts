/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Position } from '../../../utils/common';
import { CompleteBoundedDomain, LowerBoundedDomain, UpperBoundedDomain, DomainRange } from './specs';

/** @internal */
export function isLowerBound(domain: Partial<CompleteBoundedDomain>): domain is LowerBoundedDomain {
  return domain.min != null;
}

/** @internal */
export function isUpperBound(domain: Partial<CompleteBoundedDomain>): domain is UpperBoundedDomain {
  return domain.max != null;
}

/** @internal */
export function isCompleteBound(domain: Partial<CompleteBoundedDomain>): domain is CompleteBoundedDomain {
  return domain.max != null && domain.min != null;
}

/** @internal */
export function isBounded(domain: Partial<CompleteBoundedDomain>): domain is DomainRange {
  return domain.max != null || domain.min != null;
}

/** @internal */
export function isVerticalAxis(axisPosition: Position): axisPosition is Extract<Position, 'left' | 'right'> {
  return axisPosition === Position.Left || axisPosition === Position.Right;
}

/** @internal */
export function isHorizontalAxis(axisPosition: Position): axisPosition is Extract<Position, 'top' | 'bottom'> {
  return axisPosition === Position.Top || axisPosition === Position.Bottom;
}

/** @internal */
export function isVerticalGrid(axisPosition: Position) {
  return isHorizontalAxis(axisPosition);
}

/** @internal */
export function isHorizontalGrid(axisPosition: Position) {
  return isVerticalAxis(axisPosition);
}
