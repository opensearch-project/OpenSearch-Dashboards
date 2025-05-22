/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationType } from '../../view_components/utils/use_visualization_types';

export interface DiscoverVisColumn {
  id: number;
  name: string;
  schema: DiscoverVisFieldType;
  column: string;
}

export type DiscoverVisFieldType = 'numerical' | 'categorical' | 'date' | 'unknown';

export interface VisualizationRule {
  name: string;
  matches: (
    numericalColumns: DiscoverVisColumn[],
    categoricalColumns: DiscoverVisColumn[],
    dateColumns: DiscoverVisColumn[]
  ) => boolean;
  createConfig: () => VisualizationType;
}
