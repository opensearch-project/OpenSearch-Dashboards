/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Segment {
  percent: number;
  color: string;
  label: string;
  offset: number;
}

export interface DonutProps {
  segments: Segment[];
  iconSize: number;
  diameter: number;
  isInverted?: boolean;
  fill: string;
  stroke: string;
}
