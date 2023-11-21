/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FieldDetails {
  buckets: Bucket[];
  error: string;
  exists: number;
  total: number;
}

export interface FieldValueCounts extends Partial<FieldDetails> {
  missing?: number;
}

export interface Bucket {
  count: number;
  display: string;
  percent: number;
  value: string;
}
