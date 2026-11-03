/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern, Query, TimeRange } from '../../../data/public';
import { DocViewFilterFn, OpenSearchSearchHit } from '../types/doc_views_types';
import { NormalizedRow } from '../components/data_transformations/types';
import { VisData } from '../components/visualizations/visualization_builder.types';
import { RenderChartConfig, VisColumn } from '../components/visualizations/types';

export interface ExploreEmbeddableError {
  name: string;
  message: string;
}

export type ExploreEmbeddableContent =
  | {
      kind: 'logs';
      dataset: IndexPattern;
      sampleSize: number;
      rows: Array<OpenSearchSearchHit<Record<string, unknown>>>;
      hits: number;
    }
  | {
      kind: 'table';
      rows: NormalizedRow[];
      columns: VisColumn[];
      config: RenderChartConfig;
    }
  | {
      kind: 'chart';
      query: Partial<Pick<Query, 'language' | 'dataset'>>;
      data: VisData;
      config: RenderChartConfig;
      timeRange: TimeRange;
    };

export type ExploreEmbeddableState =
  | { status: 'error'; error: ExploreEmbeddableError }
  | { status: 'ready'; content: ExploreEmbeddableContent };

export interface ExploreEmbeddableViewProps {
  state: ExploreEmbeddableState;
  selectedColumns?: string[];
  hideTimeColumn: boolean;
  onAddColumn?: (column: string) => void;
  onRemoveColumn?: (column: string) => void;
  onFilter: DocViewFilterFn;
  onSelectTimeRange?: (range?: TimeRange) => void;
  crosshairGroup?: string;
}
