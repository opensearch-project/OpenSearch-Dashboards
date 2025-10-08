/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FieldStatsItem {
  name: string;
  type: string;
  docCount: number;
  distinctCount: number;
  docPercentage: number;
  error?: boolean;
}

export interface FieldDetails {
  topValues?: TopValue[];
  numericSummary?: NumericSummary;
  dateRange?: DateRange;
  error?: boolean;
}

export interface TopValue {
  value: string | number;
  count: number;
  percentage: number;
}

export interface NumericSummary {
  min: number;
  median: number;
  avg: number;
  max: number;
}

export interface DateRange {
  earliest: string;
  latest: string;
}
