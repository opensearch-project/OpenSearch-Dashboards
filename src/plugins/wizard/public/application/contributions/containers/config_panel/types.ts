/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONTAINER_ID = 'config-panel';

export interface TitleItemContribution {
  type: 'title';
  title: string;
}

export interface DroppableBoxContribution {
  type: 'droppable_box';
  id: string;
  label: string;
  limit?: number;
}

export type ItemContribution = TitleItemContribution | DroppableBoxContribution;
