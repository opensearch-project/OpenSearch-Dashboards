/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFieldType } from '../../../../../../../../data/common';

// ResultStatus enum for explore plugin
// This replaces the use_search hook since logic moved to middleware
export enum ResultStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading',
  READY = 'ready',
  NO_RESULTS = 'none',
  ERROR = 'error',
}

// SearchData interface for compatibility
export interface SearchData {
  rows: any[];
  totalHits?: number;
  bucketInterval?: any;
  chartData?: any;
  status: ResultStatus;
  fieldCounts?: Record<string, number>;
  queryStatus?: {
    body: {
      error: {
        message: {
          error: string;
        };
      };
    };
  };
}
