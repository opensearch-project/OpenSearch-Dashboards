/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedHit extends Span {
  sort?: any[];
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  children: Span[];
  [key: string]: any;
}

export interface SpanTableProps {
  hiddenColumns: string[];
  openFlyout: (spanId: string) => void;
  DSL?: any;
  setTotal?: (total: number) => void;
  availableWidth?: number;
  payloadData: string;
  filters: Array<{
    field: string;
    value: any;
  }>;
  selectedSpanId?: string;
  colorMap?: Record<string, string>;
  servicesInOrder?: string[];
  setIsServiceLegendOpen?: (isOpen: boolean) => void;
  isServiceLegendOpen?: boolean;
}

export interface SpanSearchParams {
  from: number;
  size: number;
  sortingColumns: Array<{
    [id: string]: 'asc' | 'desc';
  }>;
}
