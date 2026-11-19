/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Per-tab remembered OpenSearch data source (see the page: the URL `_a` wins when present). */
export const DATA_SOURCE_STORAGE_KEY = 'logsDrilldown.dataSource';
/**
 * Per-tab remembered source type and its scope, kept together (`{ sourceType, scope }`) so a scope
 * is never restored for another source.
 */
export const SOURCE_STORAGE_KEY = 'logsDrilldown.source';

/** A registered source's card: at most this many preview events. */
export const SOURCE_PREVIEW_SIZE = 10;
/** Cards running at once on a source that runs them as they scroll into view. */
export const AUTO_RUN_CONCURRENCY = 4;
/**
 * Cards running at once on a source whose queries wait for Run: more Run presses queue. Each run
 * can start more than one query (preview and histogram), and async backends cap concurrent queries.
 */
export const EXPLICIT_RUN_CONCURRENCY = 2;
/** Items per listing page asked of a registered source. */
export const SOURCE_LIST_PAGE_SIZE = 50;
/** At most this many items listed for one scope and search; past it, the page asks to narrow it. */
export const SOURCE_LIST_MAX_ITEMS = 1000;
