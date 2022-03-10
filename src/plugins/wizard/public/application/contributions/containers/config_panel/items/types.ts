/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternField } from 'src/plugins/data/common';
import { FieldIconProps } from '../../../../../../../opensearch_dashboards_react/public';
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

export type FieldContributions = SelectContribution<string> | InputContribution;
export type MainItemContribution = TitleItemContribution | DropboxContribution | FieldContributions;
export type SecondaryItemContribution = TitleItemContribution | FieldContributions;

export interface TitleItemContribution {
  type: ITEM_TYPES.TITLE;
  title: string;
}

export interface DropboxField {
  label: string;
  icon: FieldIconProps['type'];
  id: string;
}
export interface DropboxFieldState {
  [itemId: string]: any;
}
export interface DropboxState {
  fields: {
    [fieldName: string]: DropboxFieldState;
  };
  draft?: DropboxFieldState;
}

export interface DropboxContribution {
  type: ITEM_TYPES.DROPBOX;
  id: string;
  label: string;
  limit?: number;
  items: SecondaryItemContribution[];
  // Define how the IndexPatternField should be displayed on the dropbox
  display?: (indexField: IndexPatternField, state: DropboxState) => DropboxField;
  // Defines how the initial state of a field should be set when a field is dropped onto it
  onDrop?: (field: IndexPatternField) => DropboxFieldState;
  isDroppable?: (field: IndexPatternField) => boolean;
}
