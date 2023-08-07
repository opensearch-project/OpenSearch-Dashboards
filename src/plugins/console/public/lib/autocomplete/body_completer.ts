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

// eslint-disable-next-line max-classes-per-file
import _ from 'lodash';
import { WalkingState, walkTokenPath, wrapComponentWithDefaults } from './engine';
import {
  ConstantComponent,
  SharedComponent,
  ObjectComponent,
  ConditionalProxy,
  GlobalOnlyComponent,
} from './components';
import { ParametrizedComponentFactories } from './types';
import { AutoCompleteContext, Template, Term } from './types';
import { CoreEditor, Token } from '../../types';
import { MatchResult } from './components/autocomplete_component';

export class CompilingContext {
  parametrizedComponentFactories?: ParametrizedComponentFactories;
  endpointId: string;

  constructor(endpointId: string, parametrizedComponentFactories?: ParametrizedComponentFactories) {
    this.parametrizedComponentFactories = parametrizedComponentFactories;
    this.endpointId = endpointId;
  }
}

export type Description = Record<string, any> | string | Description[];

type LinkType = string | ((context: AutoCompleteContext, editor: CoreEditor) => any);

/**
 * An object to resolve scope links (syntax endpoint.path1.path2)
 * @param link the link either string (endpoint.path1.path2, or .path1.path2) or a function (context,editor)
 * which returns a description to be compiled
 * @constructor
 * @param compilingContext
 *
 *
 * For this to work we expect the context to include a method context.endpointComponentResolver(endpoint)
 * which should return the top level components for the given endpoint
 */

function resolvePathToComponents(
  tokenPath: string[],
  context: AutoCompleteContext,
  editor: CoreEditor,
  components: SharedComponent[]
) {
  const walkStates = walkTokenPath(
    tokenPath,
    [new WalkingState('ROOT', components, [])],
    context,
    editor
  );
  const result: SharedComponent[] = ([] as SharedComponent[]).concat.apply(
    [],
    _.map(walkStates, 'components')
  );
  return result;
}

class ScopeResolver extends SharedComponent {
  link: LinkType;
  compilingContext: CompilingContext;
  constructor(link: LinkType, compilingContext: CompilingContext) {
    super('__scope_link');
    if (_.isString(link) && link[0] === '.') {
      // relative link, inject current endpoint
      if (link === '.') {
        link = compilingContext.endpointId;
      } else {
        link = compilingContext.endpointId + link;
      }
    }
    this.link = link;
    this.compilingContext = compilingContext;
  }

  resolveLinkToComponents(context: AutoCompleteContext, editor: CoreEditor): SharedComponent[] {
    if (_.isFunction(this.link)) {
      const desc = this.link(context, editor);
      return compileDescription(desc, this.compilingContext);
    }
    if (!_.isString(this.link)) {
      throw new Error('unsupported link format', this.link);
    }

    let path = this.link.replace(/\./g, '{').split(/(\{)/);
    const endpoint = path[0];
    let components: SharedComponent[];
    try {
      if (endpoint === 'GLOBAL') {
        // global rules need an extra indirection
        if (path.length < 3) {
          throw new Error('missing term in global link: ' + this.link);
        }
        const term = path[2];
        components = context.globalComponentResolver(term);
        path = path.slice(3);
      } else {
        path = path.slice(1);
        components = context.endpointComponentResolver(endpoint);
      }
    } catch (e) {
      throw new Error('failed to resolve link [' + this.link + ']: ' + e);
    }
    return resolvePathToComponents(path, context, editor, components);
  }

  getTerms(context: AutoCompleteContext, editor: CoreEditor) {
    const options: Term[] = [];
    const components = this.resolveLinkToComponents(context, editor);
    _.each(components, function (component) {
      const option = component.getTerms(context, editor);
      if (option) {
        options.push.apply(options, option);
      }
    });
    return options;
  }

  match(token: string | string[] | Token, context: AutoCompleteContext, editor: CoreEditor) {
    const result: MatchResult = {
      next: [],
    };
    const components = this.resolveLinkToComponents(context, editor);
    _.each(components, function (component) {
      const componentResult = component.match(token, context, editor);
      if (componentResult && componentResult.next) {
        result.next?.push.apply(result.next, componentResult.next);
      }
    });

    return result;
  }
}
function getTemplate(description: Description): Description | Template {
  if (Array.isArray(description)) {
    if (description.length === 1) {
      if (_.isObject(description[0])) {
        // shortcut to save typing
        const innerTemplate = getTemplate(description[0]);

        return innerTemplate != null ? [innerTemplate] : [];
      }
    }
    return [];
  } else if (_.isString(description)) {
    return description;
  } else if (description.__template) {
    if (description.__raw && _.isString(description.__template)) {
      return {
        // This is a special secret attribute that gets passed through to indicate that
        // the raw value should be passed through to the console without JSON.stringifying it
        // first.
        //
        // Primary use case is to allow __templates to contain extended JSON special values like
        // triple quotes.
        __raw: true,
        value: description.__template,
      };
    }
    return description.__template;
  } else if (description.__one_of) {
    return getTemplate(description.__one_of[0]);
  } else if (description.__any_of) {
    return [];
  } else if (description.__scope_link) {
    // assume an object for now.
    return {};
  } else if (_.isObject(description)) {
    return {};
  } else {
    return description;
  }
}

function getOptions(description: Record<string, any>) {
  const options: Term = {};
  const template = getTemplate(description) as Template;

  if (!_.isUndefined(template)) {
    options.template = template;
  }
  return options;
}

/**
 * @param description a json dict describing the endpoint
 * @param compilingContext
 */
function compileDescription(
  description: Description,
  compilingContext: CompilingContext
): SharedComponent[] {
  if (Array.isArray(description)) {
    return [compileList(description, compilingContext)];
  } else if (_.isObject(description)) {
    // test for objects list as arrays are also objects
    if (description.__scope_link) {
      return [new ScopeResolver(description.__scope_link, compilingContext)];
    }
    if (description.__any_of) {
      return [compileList(description.__any_of, compilingContext)];
    }
    if (description.__one_of) {
      return _.flatten(
        _.map(description.__one_of, function (d) {
          return compileDescription(d, compilingContext);
        })
      );
    }
    const obj = compileObject(description, compilingContext);
    if (description.__condition) {
      return [compileCondition(description.__condition, obj)];
    } else {
      return [obj];
    }
  } else if (_.isString(description) && /^\{.*\}$/.test(description)) {
    return [compileParametrizedValue(description, compilingContext)];
  } else {
    return [new ConstantComponent(description)];
  }
}

function compileParametrizedValue(
  value: string,
  compilingContext: CompilingContext,
  template?: Template
) {
  value = value.substr(1, value.length - 2).toLowerCase();
  const componentFactory = compilingContext.parametrizedComponentFactories?.getComponent(
    value,
    true
  );
  if (!componentFactory) {
    throw new Error("no factory found for '" + value + "'");
  }
  let component = componentFactory(value, null, !!template);
  if (!_.isUndefined(template)) {
    component = wrapComponentWithDefaults(component, { template });
  }
  return component;
}

function compileObject(objDescription: Record<string, any>, compilingContext: CompilingContext) {
  const objectC = new ConstantComponent('{');
  const constants: ConstantComponent[] = [];
  const patterns: SharedComponent[] = [];
  _.each(objDescription, function (desc, key) {
    if (key.indexOf('__') === 0) {
      // meta key
      return;
    }

    const options = getOptions(desc);
    let component: SharedComponent | ConstantComponent;
    if (/^\{.*\}$/.test(key)) {
      component = compileParametrizedValue(key, compilingContext, options.template);
      patterns.push(component);
    } else if (key === '*') {
      component = new SharedComponent(key);
      patterns.push(component);
    } else {
      options.name = key;
      component = new ConstantComponent(key, null, [options]);
      constants.push(component as ConstantComponent);
    }
    _.map(compileDescription(desc, compilingContext), function (subComponent) {
      component.addComponent(subComponent);
    });
  });
  objectC.addComponent(new ObjectComponent('inner', constants, patterns));
  return objectC;
}

function compileList(listRule: Description[], compilingContext: CompilingContext) {
  const listC = new ConstantComponent('[');
  _.each(listRule, function (desc) {
    _.each(compileDescription(desc, compilingContext), function (component) {
      listC.addComponent(component);
    });
  });
  return listC;
}

/** takes a compiled object and wraps in a {@link ConditionalProxy }*/
function compileCondition(description: Record<string, any>, compiledObject: ConstantComponent) {
  if (description.lines_regex) {
    return new ConditionalProxy(function (context, editor) {
      const lines = editor
        .getLines(context.requestStartRow, editor.getCurrentPosition().lineNumber)
        .join('\n');
      return new RegExp(description.lines_regex, 'm').test(lines);
    }, compiledObject);
  } else {
    throw new Error('unknown condition type - got: ' + JSON.stringify(description));
  }
}

// a list of component that match anything but give auto complete suggestions based on global API entries.
export function globalsOnlyAutocompleteComponents() {
  return [new GlobalOnlyComponent('__global__')];
}

/**
 * @param endpointId id of the endpoint being compiled.
 * @param description a json dict describing the endpoint
 * @param parametrizedComponentFactories an object containing factories for different types of autocomplete components.
 * It is used as a fallback for pattern keys (e.g., `{type}`, resolved without the `$s`)
 * and has the following structure:
 * {
 *   TYPE: (part, parent) => new SharedComponent(part, parent)
 * }
 */
export function compileBodyDescription(
  endpointId: string,
  description: Description,
  parametrizedComponentFactories?: ParametrizedComponentFactories
) {
  return compileDescription(
    description,
    new CompilingContext(endpointId, parametrizedComponentFactories)
  );
}
