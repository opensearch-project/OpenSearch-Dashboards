/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Detector } from './types';
import { headWithoutSortDetector } from './rules/head_without_sort';
import { divisionByZeroDetector } from './rules/division_by_zero';

const registry = new Map<string, Detector>();

export function registerDetector(key: string, detector: Detector): void {
  registry.set(key, detector);
}

export function getDetector(key: string): Detector | undefined {
  return registry.get(key);
}

export function resetDetectorRegistry(): void {
  registry.clear();
  registerBuiltInDetectors();
}

export function registerBuiltInDetectors(): void {
  registerDetector('head-without-sort', headWithoutSortDetector);
  registerDetector('division-by-zero', divisionByZeroDetector);
}

registerBuiltInDetectors();
