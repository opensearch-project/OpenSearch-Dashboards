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

import _ from 'lodash';
import { SharedComponent, UrlPatternMatcher } from '../autocomplete/components';
import { UrlParams } from '../autocomplete/url_params';
import {
  globalsOnlyAutocompleteComponents,
  compileBodyDescription,
} from '../autocomplete/body_completer';
import { Endpoint } from '../autocomplete/types';
import { ParametrizedComponentFactories } from '../autocomplete/types';

/**
 *
 * @param urlParametrizedComponentFactories a dictionary of factory functions
 * that will be used as fallback for parametrized path part (i.e., {indices} )
 * see UrlPatternMatcher
 * @constructor
 * @param bodyParametrizedComponentFactories same as urlParametrizedComponentFactories but used for body compilation
 */
export class Api {
  globalRules: Record<string, any>;
  endpoints: Record<string, Endpoint>;
  urlPatternMatcher: UrlPatternMatcher;
  globalBodyComponentFactories: ParametrizedComponentFactories | undefined;
  name: string;

  constructor(
    urlParametrizedComponentFactories?: ParametrizedComponentFactories,
    bodyParametrizedComponentFactories?: ParametrizedComponentFactories
  ) {
    this.globalRules = Object.create(null);
    this.endpoints = Object.create(null);
    this.urlPatternMatcher = new UrlPatternMatcher(urlParametrizedComponentFactories);
    this.globalBodyComponentFactories = bodyParametrizedComponentFactories;
    this.name = '';
  }

  addGlobalAutocompleteRules(parentNode: string, rules: Record<string, any>): void {
    this.globalRules[parentNode] = compileBodyDescription(
      'GLOBAL.' + parentNode,
      rules,
      this.globalBodyComponentFactories
    );
  }

  getGlobalAutocompleteComponents(term: string, throwOnMissing?: boolean) {
    const result: SharedComponent[] = this.globalRules[term];
    if (_.isUndefined(result) && (throwOnMissing || _.isUndefined(throwOnMissing))) {
      throw new Error("failed to resolve global components for  ['" + term + "']");
    }
    return result;
  }

  addEndpointDescription(endpoint: string, description: Record<string, any>) {
    const copiedDescription: Record<string, any> = {};
    _.assign(copiedDescription, description || {});
    _.defaults(copiedDescription, {
      id: endpoint,
      patterns: [endpoint],
      methods: ['GET'],
    });
    _.each(copiedDescription.patterns, (p) => {
      this.urlPatternMatcher.addEndpoint(p, copiedDescription as Endpoint);
    });

    copiedDescription.paramsAutocomplete = new UrlParams(copiedDescription.url_params);
    copiedDescription.bodyAutocompleteRootComponents = compileBodyDescription(
      copiedDescription.id,
      copiedDescription.data_autocomplete_rules,
      this.globalBodyComponentFactories
    );

    this.endpoints[endpoint] = copiedDescription as Endpoint;
  }

  getEndpointDescriptionByEndpoint(endpoint: string) {
    return this.endpoints[endpoint];
  }

  getTopLevelUrlCompleteComponents(method: string) {
    return this.urlPatternMatcher.getTopLevelComponents(method);
  }

  getUnmatchedEndpointComponents() {
    return globalsOnlyAutocompleteComponents();
  }

  clear(): void {
    this.endpoints = {};
    this.globalRules = {};
  }
}
