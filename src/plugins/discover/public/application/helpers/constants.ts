/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SessionStorage key for the last selected index pattern id on Discover root.
 * Used by the breadcrumb (to restore when returning from a saved search) and
 * by use_index_pattern (to persist the current pattern when on Discover root).
 */
export const LAST_INDEX_PATTERN_KEY = 'discover:lastIndexPatternId';
