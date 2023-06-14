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

import { SharedComponent } from './index';
import { ConstantComponent } from './constant_component';
import { CoreEditor } from '../../../types';
import { AutoCompleteContext, Term } from '../types';
/**
 * @param constants list of components that represent constant keys
 * @param patternsAndWildCards list of components that represent patterns and should be matched only if
 * there is no constant matches
 */
export class ObjectComponent extends SharedComponent {
  constants: ConstantComponent[];
  patternsAndWildCards: SharedComponent[];

  constructor(
    name: string,
    constants: ConstantComponent[],
    patternsAndWildCards: SharedComponent[]
  ) {
    super(name);
    this.constants = constants;
    this.patternsAndWildCards = patternsAndWildCards;
  }
  getTerms(context: AutoCompleteContext, editor: CoreEditor) {
    const options: Term[] = [];
    this.constants.forEach((component) => {
      options.push(...component.getTerms(context, editor));
    });
    this.patternsAndWildCards.forEach((component) => {
      const option = component.getTerms(context, editor);
      if (option) {
        options.push(...option);
      }
    });
    return options;
  }

  match(token: string, context: AutoCompleteContext, editor: CoreEditor) {
    const result: {
      next: SharedComponent[];
    } = {
      next: [],
    };
    this.constants.forEach((component) => {
      const componentResult = component.match(token, context, editor);
      if (componentResult && componentResult.next) {
        result.next.push(...componentResult.next);
      }
    });

    // try to link to GLOBAL rules
    const globalRules = context.globalComponentResolver(token, false);
    if (globalRules) {
      result.next.push.apply(result.next, globalRules);
    }

    if (result.next.length) {
      return result;
    }
    this.patternsAndWildCards.forEach((component) => {
      const componentResult = component.match(token, context, editor);
      if (componentResult && componentResult.next) {
        result.next.push(...componentResult.next);
      }
    });

    return result;
  }
}
