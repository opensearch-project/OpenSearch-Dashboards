/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * How an index is classified for the logs Explore canvas. Only the time-based vs
 * no-time-field distinction changes behavior (it gates the histogram preview), so it is
 * the only classification that gets a colored badge; "remote"/"dataset" are shown as
 * subdued tokens instead.
 */
export enum IndexClassification {
  /** Not yet classified — no field fetch has run; the badge slot stays empty (no false spinner). */
  UNKNOWN = 'unknown',
  /** A field fetch for this index is currently in flight. */
  CLASSIFYING = 'classifying',
  /** Has a date field — logs; histogram preview is available. */
  TIME_BASED = 'time_based',
  /** No date field — non-log index; table-only preview. */
  NO_TIME_FIELD = 'no_time_field',
}

/** A browsable row in the left list. */
export interface BrowsableItem {
  /** Concrete index / alias / data_stream name, or dataset title. */
  name: string;
  /** Whether this row is an existing dataset (jump straight into Query) vs a raw index. */
  kind: 'index' | 'dataset';
  /** True for cross-cluster (remote) indices. */
  isRemote?: boolean;
  /** Index creation time (epoch ms), when available — used to sort newest-first. */
  createdAt?: number;
  /** Cumulative primary-shard doc count from `_cat/indices`. `0` ⇒ empty index (state 03);
   *  `undefined` ⇒ unknown (remote/closed index, or the cat.indices call was unavailable). */
  docsCount?: number;
  /** Cluster-health of the index from `_cat/indices` (`green`/`yellow`/`red`). `undefined` ⇒
   *  unknown (remote/closed index, or the cat.indices call was unavailable). */
  health?: 'green' | 'yellow' | 'red';
  /** For dataset rows: the dataset id to select. */
  datasetId?: string;
  /** For dataset rows: whether the dataset is time-based (carries a timeFieldName). */
  timeFieldName?: string;
}

/** Result of classifying a single index by fetching its fields. */
export interface ClassificationResult {
  classification: IndexClassification;
  /** The chosen time field (first date field), if any. */
  timeFieldName?: string;
  /** All date fields on the index, so the user can switch the auto-selected one. */
  dateFields?: string[];
  /** The detected severity/level field (e.g. severityText, level), if any — used to stack the
   *  histogram and color the log-line level tokens. */
  severityField?: string;
}
