/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationType } from './utils/use_visualization_types';

export interface ExploreVisColumn {
  id: number;
  name: string;
  schema: ExploreVisFieldType;
  column: string;
}

export type ExploreVisFieldType = 'numerical' | 'categorical' | 'date' | 'unknown';

export interface VisualizationRule {
  name: string;
  matches: (
    numericalColumns: ExploreVisColumn[],
    categoricalColumns: ExploreVisColumn[],
    dateColumns: ExploreVisColumn[]
  ) => boolean;
  createConfig: () => VisualizationType;
}
