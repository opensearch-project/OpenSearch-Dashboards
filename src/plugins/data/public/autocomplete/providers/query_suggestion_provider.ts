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

import { monaco } from '@osd/monaco';
import { IFieldType, IndexPattern } from '../../../common/index_patterns';
import { IDataPluginServices } from '../../types';

export enum QuerySuggestionTypes {
  Field = 'field',
  Value = 'value',
  Operator = 'operator',
  Conjunction = 'conjunction',
  RecentSearch = 'recentSearch',
}

export type QuerySuggestionGetFn = (
  args: QuerySuggestionGetFnArgs
) => Promise<QuerySuggestion[]> | undefined;

/** @public **/
export interface QuerySuggestionGetFnArgs {
  language: string;
  indexPattern: IndexPattern | undefined;
  query: string;
  selectionStart: number;
  selectionEnd: number;
  signal?: AbortSignal;
  boolFilter?: any;
  position?: monaco.Position;
  services?: IDataPluginServices;
}

/** @public **/
export interface QuerySuggestionBasic {
  type: QuerySuggestionTypes;
  description?: string | JSX.Element;
  end: number;
  start: number;
  text: string;
  cursorIndex?: number;
}

/** @public **/
export interface QuerySuggestionField extends QuerySuggestionBasic {
  type: QuerySuggestionTypes.Field;
  field: IFieldType;
}

export interface MonacoCompatibleQuerySuggestion
  extends Pick<QuerySuggestionBasic, 'description' | 'cursorIndex'> {
  type: monaco.languages.CompletionItemKind;
  text: string;
  detail: string;
  insertText?: string;
  insertTextRules?: monaco.languages.CompletionItemInsertTextRule;
  replacePosition?: monaco.Range;
  sortText?: string;
}

/** @public **/
export type QuerySuggestion =
  | QuerySuggestionBasic
  | QuerySuggestionField
  | MonacoCompatibleQuerySuggestion;
