/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import type { Cell } from '../chart_types/heatmap/layout/types/viewmodel_types';
import type { Position } from '../utils/common';
import type { GeometryValue } from '../utils/geometry';

export interface DebugStateAxis {
  id: string;
  position: Position;
  title?: string;
  labels: string[];
  values: any[];
  gridlines: {
    y: number;
    x: number;
  }[];
}

export interface DebugStateAxes {
  x: DebugStateAxis[];
  y: DebugStateAxis[];
}

export interface DebugStateLegendItem {
  key: string;
  name: string;
  color: string;
}

export interface DebugStateLegend {
  items: DebugStateLegendItem[];
}

interface DebugStateBase {
  key: string;
  name: string;
  color: string;
}

export type DebugStateValue = Pick<GeometryValue, 'x' | 'y' | 'mark'>;

interface DebugStateLineConfig {
  visible: boolean;
  path: string;
  points: DebugStateValue[];
  visiblePoints: boolean;
}

export interface DebugStateLine extends DebugStateBase, DebugStateLineConfig {}

export type DebugStateArea = Omit<DebugStateLine, 'points' | 'visiblePoints'> & {
  path: string;
  lines: {
    y0?: DebugStateLineConfig;
    y1: DebugStateLineConfig;
  };
};

export type DebugStateBar = DebugStateBase & {
  visible: boolean;
  bars: DebugStateValue[];
  labels: any[];
};

type CellDebug = Pick<Cell, 'value' | 'formatted' | 'x' | 'y'> & { fill: string };

type HeatmapDebugState = {
  cells: CellDebug[];
  selection: {
    area: { x: number; y: number; width: number; height: number } | null;
    data: { x: Array<string | number>; y: Array<string | number> } | null;
  };
};

/**
 * Describes _visible_ chart state for use in functional tests
 *
 * TODO: add other chart types to debug state
 */
export interface DebugState {
  legend?: DebugStateLegend;
  axes?: DebugStateAxes;
  areas?: DebugStateArea[];
  lines?: DebugStateLine[];
  bars?: DebugStateBar[];
  /** Heatmap chart debug state */
  heatmap?: HeatmapDebugState;
}
