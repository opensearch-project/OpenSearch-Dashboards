/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FieldDetails {
  error: string;
  exists: number;
  total: boolean;
  buckets: Bucket[];
  columns: string[];
}

export interface Bucket {
  display: string;
  value: string;
  percent: number;
  count: number;
}
