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
import { AutoCompleteContext, Template, Term } from './types';
import { CoreEditor } from '../../types';
import { PartialAutoCompleteContext } from './components/autocomplete_component';
import { SharedComponent } from './components';

export function wrapComponentWithDefaults(
  component: SharedComponent,
  defaults: { template: Template }
) {
  const originalGetTerms = component.getTerms;
  component.getTerms = function (context, editor) {
    let result = originalGetTerms.call(component, context, editor);
    if (!result) {
      return result;
    }
    result = result.map((term) => {
      if (typeof term !== 'object') {
        term = { name: term };
      }
      return { ...defaults, ...term };
    });
    return result;
  };
  return component;
}

const tracer = function (...args: unknown[]) {
  if ((window as any).engine_trace) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

function passThroughContext(
  context: AutoCompleteContext | PartialAutoCompleteContext,
  extensionList?: PartialAutoCompleteContext[]
) {
  const result = Object.create(context) as AutoCompleteContext;
  if (extensionList) {
    Object.assign(result, ...extensionList);
  }
  return result;
}

export class WalkingState {
  name?: string;
  parentName: string;
  components: SharedComponent[];
  contextExtensionList: PartialAutoCompleteContext[];
  depth: number;
  priority: number | undefined;

  constructor(
    parentName: string,
    components: SharedComponent[],
    contextExtensionList: PartialAutoCompleteContext[],
    depth = 0,
    priority?: number
  ) {
    this.parentName = parentName;
    this.components = components;
    this.contextExtensionList = contextExtensionList;
    this.depth = depth;
    this.priority = priority;
  }
}

export function walkTokenPath(
  tokenPath: Array<string | string[]>,
  walkingStates: WalkingState[],
  context: AutoCompleteContext | PartialAutoCompleteContext,
  editor: CoreEditor | null
): WalkingState[] {
  if (!tokenPath || tokenPath.length === 0) {
    return walkingStates;
  }
  const token = tokenPath[0];
  const nextWalkingStates: WalkingState[] = [];

  tracer('starting token evaluation [' + token + ']');

  walkingStates.forEach((ws) => {
    const contextForState = passThroughContext(context, ws.contextExtensionList);
    ws.components.forEach((component) => {
      tracer('evaluating [' + token + '] with [' + component.name + ']', component);
      const result = component.match(token, contextForState, editor);
      if (result && Object.keys(result).length !== 0) {
        tracer('matched [' + token + '] with:', result);
        let next;
        let extensionList: PartialAutoCompleteContext[];
        if (result.next && !Array.isArray(result.next)) {
          next = [result.next];
        } else {
          next = result.next;
        }
        if (result.context_values) {
          extensionList = [];
          extensionList = [...extensionList, ...ws.contextExtensionList];
          extensionList.push(result.context_values);
        } else {
          extensionList = ws.contextExtensionList;
        }

        let priority = ws.priority;
        if (typeof result.priority === 'number') {
          if (typeof priority === 'number') {
            priority = Math.min(priority, result.priority);
          } else {
            priority = result.priority;
          }
        }

        nextWalkingStates.push(
          new WalkingState(component.name, next, extensionList, ws.depth + 1, priority)
        );
      }
    });
  });

  if (nextWalkingStates.length === 0) {
    // no where to go, still return context variables returned so far..
    return walkingStates.map((ws) => new WalkingState(ws.name ?? '', [], ws.contextExtensionList));
  }

  return walkTokenPath(tokenPath.slice(1), nextWalkingStates, context, editor);
}

export function populateContext(
  tokenPath: Array<string | string[]>,
  context: AutoCompleteContext | PartialAutoCompleteContext,
  editor: CoreEditor | null,
  includeAutoComplete: boolean,
  components: SharedComponent[]
) {
  let walkStates = walkTokenPath(
    tokenPath,
    [new WalkingState('ROOT', components, [])],
    context,
    editor
  );
  if (includeAutoComplete) {
    let autoCompleteSet: Term[] = [];
    walkStates.forEach((ws) => {
      const contextForState = passThroughContext(context, ws.contextExtensionList);
      ws.components.forEach((component) => {
        const terms = component.getTerms(contextForState, editor);
        if (terms) {
          terms.forEach((term) => {
            if (typeof term !== 'object') {
              term = { name: term };
            }
            autoCompleteSet.push(term);
          });
        }
      });
    });
    autoCompleteSet = [...new Set(autoCompleteSet)];
    context.autoCompleteSet = autoCompleteSet;
  }

  // apply what values were set so far to context, selecting the deepest on which sets the context
  if (walkStates.length !== 0) {
    let wsToUse;
    walkStates = _.sortBy(walkStates, function (ws) {
      return _.isNumber(ws.priority) ? ws.priority : Number.MAX_VALUE;
    });
    wsToUse = _.find(walkStates, function (ws) {
      return _.isEmpty(ws.components);
    });

    if (!wsToUse && walkStates.length > 1 && !includeAutoComplete) {
      // eslint-disable-next-line no-console
      console.info(
        "more then one context active for current path, but autocomplete isn't requested",
        walkStates
      );
    }

    if (!wsToUse) {
      wsToUse = walkStates[0];
    }

    _.each(wsToUse.contextExtensionList, function (extension) {
      _.assign(context, extension);
    });
  }
}
