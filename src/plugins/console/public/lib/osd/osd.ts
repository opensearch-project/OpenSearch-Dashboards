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

import $ from 'jquery';
import _ from 'lodash';
import {
  TypeAutocompleteComponent,
  IdAutocompleteComponent,
  IndexAutocompleteComponent,
  FieldAutocompleteComponent,
  ListComponent,
  TemplateAutocompleteComponent,
  UsernameAutocompleteComponent,
} from '../autocomplete/components';

import { Api } from './api';
import {
  ComponentFactory,
  IdAutocompleteComponentFactory,
  ParametrizedComponentFactories,
} from '../autocomplete/types';

let ACTIVE_API = new Api();
const isNotAnIndexName = (name: string) => name[0] === '_' && name !== '_all';

const idAutocompleteComponentFactory: IdAutocompleteComponentFactory = (name, parent) => {
  return new IdAutocompleteComponent(name, parent);
};
const parametrizedComponentFactories: ParametrizedComponentFactories = {
  getComponent(name, parent, provideDefault) {
    if (this[name as keyof ParametrizedComponentFactories]) {
      return this[name as keyof ParametrizedComponentFactories] as ComponentFactory;
    } else if (provideDefault) {
      return idAutocompleteComponentFactory as ComponentFactory;
    }
  },
  index(name, parent) {
    if (isNotAnIndexName(name)) return;
    return new IndexAutocompleteComponent(name, parent, false);
  },
  indices(name, parent) {
    if (isNotAnIndexName(name)) return;
    return new IndexAutocompleteComponent(name, parent, true);
  },
  type(name, parent) {
    return new TypeAutocompleteComponent(name, parent, false);
  },
  types(name, parent) {
    return new TypeAutocompleteComponent(name, parent, true);
  },
  id(name, parent) {
    return idAutocompleteComponentFactory(name, parent);
  },
  transform_id(name, parent) {
    return idAutocompleteComponentFactory(name, parent);
  },
  username(name, parent) {
    return new UsernameAutocompleteComponent(name, parent);
  },
  user(name, parent) {
    return new UsernameAutocompleteComponent(name, parent);
  },
  template(name, parent) {
    return new TemplateAutocompleteComponent(name, parent);
  },
  task_id(name, parent) {
    return idAutocompleteComponentFactory(name, parent);
  },
  ids(name, parent) {
    return idAutocompleteComponentFactory(name, parent, true);
  },
  fields(name, parent) {
    return new FieldAutocompleteComponent(name, parent, true);
  },
  field(name, parent) {
    return new FieldAutocompleteComponent(name, parent, false);
  },
  nodes(name, parent) {
    return new ListComponent(
      name,
      [
        '_local',
        '_master',
        '_cluster_manager',
        'data:true',
        'data:false',
        'master:true',
        'cluster_manager:true',
        'master:false',
        'cluster_manager:false',
      ],
      parent
    );
  },
  node(name, parent) {
    return new ListComponent(name, [], parent, false);
  },
};

export function getUnmatchedEndpointComponents() {
  return ACTIVE_API.getUnmatchedEndpointComponents();
}

export function getEndpointDescriptionByEndpoint(endpoint: string) {
  return ACTIVE_API.getEndpointDescriptionByEndpoint(endpoint);
}

export function getEndpointBodyCompleteComponents(endpoint: string) {
  const desc = getEndpointDescriptionByEndpoint(endpoint);
  if (!desc) {
    throw new Error("failed to resolve endpoint ['" + endpoint + "']");
  }
  return desc.bodyAutocompleteRootComponents;
}

export function getTopLevelUrlCompleteComponents(method: string) {
  return ACTIVE_API.getTopLevelUrlCompleteComponents(method);
}

export function getGlobalAutocompleteComponents(term: string, throwOnMissing: boolean) {
  return ACTIVE_API.getGlobalAutocompleteComponents(term, throwOnMissing);
}

function loadApisFromJson(
  json: Record<string, any>,
  urlParametrizedComponentFactories?: ParametrizedComponentFactories,
  bodyParametrizedComponentFactories?: ParametrizedComponentFactories
) {
  urlParametrizedComponentFactories =
    urlParametrizedComponentFactories || parametrizedComponentFactories;
  bodyParametrizedComponentFactories =
    bodyParametrizedComponentFactories || urlParametrizedComponentFactories;
  const api = new Api(urlParametrizedComponentFactories, bodyParametrizedComponentFactories);
  const names: string[] = [];
  _.each(json, function (apiJson, name) {
    names.unshift(name);
    _.each(apiJson.globals || {}, function (globalJson, globalName) {
      api.addGlobalAutocompleteRules(globalName, globalJson);
    });
    _.each(apiJson.endpoints || {}, function (endpointJson, endpointName) {
      api.addEndpointDescription(endpointName, endpointJson);
    });
  });
  api.name = names.join(',');
  return api;
}

// TODO: clean up setting up of active API and use of jQuery.
// This function should be attached to a class that holds the current state, not setup
// when the file is required. Also, jQuery should not be used to make network requests
// like this, it looks like a minor security issue.
export function setActiveApi(api?: Api) {
  if (!api) {
    $.ajax({
      url: '../api/console/api_server',
      dataType: 'json', // disable automatic guessing
      headers: {
        'osd-xsrf': 'opensearch-dashboards',
      },
    }).then(
      function (data) {
        setActiveApi(loadApisFromJson(data));
      },
      function (jqXHR) {
        // eslint-disable-next-line no-console
        console.log("failed to load API '" + api + "': " + jqXHR.responseText);
      }
    );
    return;
  }

  ACTIVE_API = api;
}

setActiveApi();

export const _test = {
  loadApisFromJson,
};
