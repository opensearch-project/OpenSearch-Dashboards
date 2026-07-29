/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Detector } from './types';
import { headWithoutSortDetector } from './rules/head_without_sort';
import { divisionByZeroDetector } from './rules/division_by_zero';
import { unsupportedWindowFunctionDetector } from './rules/unsupported_window_function';
import { multisearchMinSubsearchDetector } from './rules/multisearch_min_subsearch';
import { disabledJoinTypeDetector } from './rules/disabled_join_type';
import { dedupConsecutiveUnsupportedDetector } from './rules/dedup_consecutive_unsupported';
import { unionMinDatasetsDetector } from './rules/union_min_datasets';
import { replaceWildcardAsymmetryDetector } from './rules/replace_wildcard_asymmetry';
import { fieldValidationDetector } from './rules/field_validation';
import { aggOnTextDetector } from './rules/agg_on_text';
import { flatObjectSubfieldDetector } from './rules/flat_object_subfield';
import { typeMismatchNumericDetector } from './rules/type_mismatch_numeric';

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
  registerDetector('unsupported-window-function-in-eventstats', unsupportedWindowFunctionDetector);
  registerDetector('multisearch-min-subsearch', multisearchMinSubsearchDetector);
  registerDetector('disabled-join-type', disabledJoinTypeDetector);
  registerDetector('dedup-consecutive-unsupported', dedupConsecutiveUnsupportedDetector);
  registerDetector('union-min-datasets', unionMinDatasetsDetector);
  registerDetector('replace-wildcard-asymmetry', replaceWildcardAsymmetryDetector);
  registerDetector('field-validation', fieldValidationDetector);
  registerDetector('agg-on-text', aggOnTextDetector);
  registerDetector('flat-object-subfield', flatObjectSubfieldDetector);
  registerDetector('type-mismatch-numeric', typeMismatchNumericDetector);
}

registerBuiltInDetectors();
