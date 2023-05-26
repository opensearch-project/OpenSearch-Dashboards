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
import { Token, Position, Range } from '../../types';
import { Description } from './body_completer';
import { SharedComponent } from './components/shared_component';

export interface UrlObjectComponent {
  list: string[];
  type: string;
  allow_non_valid?: boolean;
  multiValued?: boolean;
}

export type UrlComponent = UrlObjectComponent | SharedComponent | string[];

export interface Endpoint {
  paramsAutocomplete?: {
    getTopLevelComponents: (method?: string | null) => unknown;
  };
  patterns: string[];
  bodyAutocompleteRootComponents?: SharedComponent[];
  id: string;
  documentation?: string;
  data_autocomplete_rules: Description;
  methods: string[];
  indices_mode?: string;
  priority?: number;
  template?: string;
  url_params?: Record<string, unknown>;
  url_components?: Record<string, UrlComponent>;
}

export interface AutoCompleteContext {
  autoCompleteType: string;
  // autoCompleteSet: string[] | Term[] | null;
  autoCompleteSet: Term[] | null;
  createdWithToken?: Token;
  updatedForToken?: Token;
  replacingToken?: boolean;
  rangeToReplace?: Range;
  textBoxPosition?: Position;
  prefixToAdd?: string;
  suffixToAdd?: string;
  method: string;
  token?: Token;
  otherTokenValues?: string[];
  urlTokenPath?: string[];
  endpoint?: Endpoint | string | null;
  bodyTokenPath?: string[];
  requestStartRow: number;
  endpointComponentResolver: (endpoint: string) => SharedComponent[];
  globalComponentResolver: (term: string, throwOnMissing?: boolean) => SharedComponent[];
  addTemplate?: boolean;
  indices?: string | string[];
  types?: string | string[];
  [key: string]: unknown;
}

export interface Template {
  __raw?: boolean;
  value?: string;
}

export interface TermObject {
  name?: string;
  meta?: string;
  template?: Template;
  value?: string;
  insertValue?: string;
  score?: number;
  context?: AutoCompleteContext;
  snippet?: string;
}

export type Term = string | TermObject;
