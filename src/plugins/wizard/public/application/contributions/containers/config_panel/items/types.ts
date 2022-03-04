/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SelectContribution, InputContribution } from '../../common/items';

/**
 * Types for contributions that relate to the config panel
 */

export enum ITEM_TYPES {
  DROPBOX = 'dropbox',
  TITLE = 'title',
}

export const ItemTypes = {
  ...ITEM_TYPES,
};

export type FieldContributions = SelectContribution | InputContribution;
export type MainItemContribution = TitleItemContribution | DroppableBoxContribution;
export type SecondaryItemContribution = TitleItemContribution | FieldContributions;

export interface TitleItemContribution {
  type: ITEM_TYPES.TITLE;
  title: string;
}

export interface DroppableBoxContribution {
  type: ITEM_TYPES.DROPBOX;
  id: string;
  label: string;
  limit?: number;
  items: SecondaryItemContribution[];
}
