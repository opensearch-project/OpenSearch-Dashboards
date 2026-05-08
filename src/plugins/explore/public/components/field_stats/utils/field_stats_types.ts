/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExploreServices } from '../../../types';

export interface FieldStatsItem {
  name: string;
  type: string;
  docCount: number;
  distinctCount: number;
  docPercentage?: number;
  errorMessage?: string;
}

export interface SectionError {
  errorMessage: string;
}

export interface FieldDetails {
  topValues?: TopValue[] | SectionError;
  rareValues?: TopValue[] | SectionError;
  numericSummary?: NumericSummary | SectionError;
  dateRange?: DateRange | SectionError;
  examples?: ExampleValue[] | SectionError;
  errorMessage?: string;
}

export interface TopValue {
  value: string | number;
  count?: number;
}

export interface RareValue {
  value: string | number;
  count?: number;
}

export interface NumericSummary {
  min: number;
  median: number;
  avg: number;
  max: number;
}

export interface DateRange {
  earliest: string | null;
  latest: string | null;
}

export interface ExampleValue {
  value: string | number | boolean | object;
}

/**
 * Map of field names to their detailed statistics
 */
export type FieldDetailsMap = Record<string, FieldDetails>;

/**
 * Dataset type used in field stats fetching
 */
export interface Dataset {
  id?: string;
  type: string;
  title: string;
  fields?: {
    getAll: () => IndexPatternField[];
  };
  metaFields?: string[];
}

/**
 * Index pattern field structure
 */
export interface IndexPatternField {
  name: string;
  type: string;
  scripted?: boolean;
  subType?: {
    multi?: {
      parent?: string;
    };
  };
}

/**
 * Configuration for a detail section that can be displayed in expanded rows
 * @template T The type of data this section displays
 */
export interface DetailSectionConfig<T = any> {
  /** Unique identifier for this section */
  id: string;
  /** Section title */
  title: string;
  /** Field types this section applies to (e.g., ['string', 'keyword']) */
  applicableToTypes: string[];
  /** Function to fetch data for this section */
  fetchData: (fieldName: string, dataset: Dataset, services: ExploreServices) => Promise<T>;
  /** React component to render this section */
  component: React.ComponentType<{ data: T; field: FieldStatsItem }>;
}
