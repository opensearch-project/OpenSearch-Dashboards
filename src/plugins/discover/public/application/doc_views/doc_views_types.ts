/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { ComponentType } from 'react';
import { SearchResponse } from 'elasticsearch';
import { IndexPattern } from '../../../../data/public';

export type OpenSearchSearchHit<T = unknown> = SearchResponse<T>['hits']['hits'][number];

export interface FieldMapping {
  filterable?: boolean;
  scripted?: boolean;
  rowCount?: number;
  type: string;
  name: string;
}

export type DocViewFilterFn = (
  mapping: FieldMapping | string | undefined,
  value: unknown,
  mode: '+' | '-'
) => void;

export interface DocViewRenderProps {
  columns?: string[];
  filter?: DocViewFilterFn;
  hit: OpenSearchSearchHit;
  indexPattern: IndexPattern;
  onAddColumn?: (columnName: string) => void;
  onRemoveColumn?: (columnName: string) => void;
}
export type DocViewerComponent = ComponentType<DocViewRenderProps>;
export type DocViewRenderFn = (
  domeNode: HTMLDivElement,
  renderProps: DocViewRenderProps
) => () => void;

export interface DocViewInput {
  component?: DocViewerComponent;
  order: number;
  render?: DocViewRenderFn;
  shouldShow?: (hit: OpenSearchSearchHit) => boolean;
  title: string;
}

export interface DocView extends DocViewInput {
  shouldShow: (hit: OpenSearchSearchHit) => boolean;
}

export type DocViewInputFn = () => DocViewInput;
