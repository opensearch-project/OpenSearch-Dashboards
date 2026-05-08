/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MatchedItem {
  name: string;
  tags: Tag[];
  item: {
    name: string;
    backing_indices?: string[];
    timestamp_field?: string;
    indices?: string[];
    aliases?: string[];
    attributes?: ResolveIndexResponseItemIndexAttrs[];
    data_stream?: string;
  };
}

export interface ResolveIndexResponse {
  indices?: ResolveIndexResponseItemIndex[];
  aliases?: ResolveIndexResponseItemAlias[];
  data_streams?: ResolveIndexResponseItemDataStream[];
}

export interface ResolveIndexResponseItem {
  name: string;
}

export interface ResolveIndexResponseItemDataStream extends ResolveIndexResponseItem {
  backing_indices: string[];
  timestamp_field: string;
}

export interface ResolveIndexResponseItemAlias extends ResolveIndexResponseItem {
  indices: string[];
}

export interface ResolveIndexResponseItemIndex extends ResolveIndexResponseItem {
  aliases?: string[];
  attributes?: ResolveIndexResponseItemIndexAttrs[];
  data_stream?: string;
}

export enum ResolveIndexResponseItemIndexAttrs {
  OPEN = 'open',
  CLOSED = 'closed',
  HIDDEN = 'hidden',
  FROZEN = 'frozen',
}

export interface Tag {
  name: string;
  key: string;
  color: string;
}

export interface StepInfo {
  totalStepNumber: number;
  currentStepNumber: number;
}

export interface DataSourceTableItem {
  id: string;
  type: string;
  title: string;
  sort: string;
  checked?: 'on' | 'off';
  label: string;
  datasourceversion: string;
  installedplugins: string[];
  engine: string;
  relatedDataSourceConnection?: DataSourceTableItem[];
  append?: any;
  prepend?: any;
  parentId?: string;
  disabled?: boolean;
}
