/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
  autoCompleteSet: Term[] | null;
  createdWithToken?: Token | null;
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
