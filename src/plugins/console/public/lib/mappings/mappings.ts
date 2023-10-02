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
import { HttpResponse, HttpSetup } from 'opensearch-dashboards/public';
import * as opensearch from '../opensearch/opensearch';
import { Settings } from '../../services';

export interface Field {
  name: string;
  type: string;
}

interface FieldMapping {
  enabled?: boolean;
  path?: string;
  properties?: Properties;
  type?: string;
  index_name?: string;
  fields?: Record<string, FieldMapping>;
  index?: string;
}

type Properties = Record<string, FieldMapping>;

interface IndexMapping {
  [index: string]: {
    [mapping: string]: FieldMapping | Properties;
  };
}

interface IndexMappingOld {
  [index: string]: {
    mappings: {
      properties: Properties;
    };
  };
}

interface Aliases {
  [aliasName: string]: Record<string, unknown>;
}

interface IndexAliases {
  [indexName: string]: {
    aliases: Aliases;
  };
}

type IndicesOrAliases = string | string[] | null;

// NOTE: If this value ever changes to be a few seconds or less, it might introduce flakiness
// due to timing issues in our app.js tests.
const POLL_INTERVAL = 60000;
let pollTimeoutId: NodeJS.Timeout | null;

let perIndexTypes: { [index: string]: { [type: string]: Field[] } } = {};
let perAliasIndices: { [alias: string]: string[] } = {};
let templates: string[] = [];

export function expandAliases(
  indicesOrAliases: IndicesOrAliases | undefined
): IndicesOrAliases | undefined {
  // takes a list of indices or aliases or a string which may be either and returns a list of indices
  // returns a list for multiple values or a string for a single.

  if (!indicesOrAliases) {
    return indicesOrAliases;
  }

  if (typeof indicesOrAliases === 'string') {
    indicesOrAliases = [indicesOrAliases];
  }

  const mappedIndicesOrAliases = indicesOrAliases.map((iOrA) => {
    if (perAliasIndices[iOrA]) {
      return perAliasIndices[iOrA];
    }
    return [iOrA];
  });
  let ret: string[] = ([] as string[]).concat(...mappedIndicesOrAliases);
  ret.sort();
  ret = ret.reduce<string[]>((result, value, index, array) => {
    const last = array[index - 1];
    if (last !== value) {
      result.push(value);
    }
    return result;
  }, []);

  return ret.length > 1 ? ret : ret[0];
}

export function getTemplates() {
  return [...templates];
}

export function getFields(indices?: IndicesOrAliases, types?: IndicesOrAliases): Field[] {
  // get fields for indices and types. Both can be a list, a string or null (meaning all).
  let ret: Array<Field | Field[]> = [];
  indices = expandAliases(indices);

  if (typeof indices === 'string') {
    const typeDict = perIndexTypes[indices];
    if (!typeDict) {
      return [];
    }

    if (typeof types === 'string') {
      const f = typeDict[types];
      ret = f ? f : [];
    } else {
      // filter what we need
      Object.entries(typeDict).forEach(([type, fields]) => {
        if (!types || types.length === 0 || types.includes(type)) {
          ret.push(fields);
        }
      });
    }
  } else {
    // multi index mode.
    Object.keys(perIndexTypes).forEach((index) => {
      if (!indices || indices.length === 0 || indices.includes(index)) {
        ret.push(getFields(index, types));
      }
    });
  }

  return _.uniqBy(_.flatten(ret), (f: Field) => f.name + ':' + f.type);
}

export function getTypes(indices?: IndicesOrAliases) {
  let ret: string[] = [];
  indices = expandAliases(indices);
  if (typeof indices === 'string') {
    const typeDict = perIndexTypes[indices];
    if (!typeDict) {
      return [];
    }

    // filter what we need
    if (Array.isArray(typeDict)) {
      typeDict.forEach((type) => {
        ret.push(type);
      });
    } else if (typeof typeDict === 'object') {
      Object.keys(typeDict).forEach((type) => {
        ret.push(type);
      });
    }
  } else {
    // multi index mode.
    Object.keys(perIndexTypes).forEach((index) => {
      if (!indices || indices.includes(index)) {
        ret.push(...getTypes(index));
      }
    });
    ret = ([] as string[]).concat.apply([], ret);
  }

  return _.uniq(ret);
}

export function getIndices(includeAliases?: boolean) {
  const ret: string[] = [];
  Object.keys(perIndexTypes).forEach((index) => {
    ret.push(index);
  });

  if (typeof includeAliases === 'undefined' ? true : includeAliases) {
    Object.keys(perAliasIndices).forEach((alias) => {
      ret.push(alias);
    });
  }
  return ret;
}

function getFieldNamesFromFieldMapping(fieldName: string, fieldMapping: FieldMapping) {
  if (fieldMapping.enabled === false) {
    return [];
  }
  let nestedFields;

  function applyPathSettings(nestedFieldNames: Field[]) {
    const pathType = fieldMapping.path || 'full';
    if (pathType === 'full') {
      return nestedFieldNames.map((f) => {
        f.name = fieldName + '.' + f.name;
        return f;
      });
    }
    return nestedFieldNames;
  }

  if (fieldMapping.properties) {
    // derived object type
    nestedFields = getFieldNamesFromProperties(fieldMapping.properties);
    return applyPathSettings(nestedFields);
  }

  const fieldType = fieldMapping.type;

  const ret: Field = { name: fieldName, type: fieldType as string };

  if (fieldMapping.index_name) {
    ret.name = fieldMapping.index_name;
  }

  if (fieldMapping.fields) {
    nestedFields = Object.entries(fieldMapping.fields).flatMap(
      ([nestedFieldName, nestedFieldMapping]) => {
        return getFieldNamesFromFieldMapping(nestedFieldName, nestedFieldMapping);
      }
    );
    nestedFields = applyPathSettings(nestedFields);
    nestedFields.unshift(ret);
    return nestedFields;
  }

  return [ret];
}

function getFieldNamesFromProperties(properties: Properties = {}): Field[] {
  const fieldList = Object.entries(properties).flatMap(([fieldName, fieldMapping]) => {
    return getFieldNamesFromFieldMapping(fieldName, fieldMapping);
  });

  // deduping
  return _.uniqBy(fieldList, function (f) {
    return f.name + ':' + f.type;
  });
}

function loadTemplates(templatesObject = {}) {
  templates = Object.keys(templatesObject);
}

export function loadMappings(mappings: IndexMapping | IndexMappingOld | '{}') {
  perIndexTypes = {};
  if (mappings === '{}') return;

  Object.entries(mappings).forEach(([index, indexMapping]) => {
    const normalizedIndexMappings: Record<string, Field[]> = {};

    // Migrate 1.0.0 mappings. This format has changed, so we need to extract the underlying mapping.
    if (indexMapping.mappings && Object.keys(indexMapping).length === 1) {
      indexMapping = indexMapping.mappings;
    }

    Object.entries(indexMapping).forEach(([typeName, typeMapping]) => {
      if (typeName === 'properties') {
        const fieldList = getFieldNamesFromProperties(typeMapping as Properties);
        normalizedIndexMappings[typeName] = fieldList;
      } else {
        normalizedIndexMappings[typeName] = [];
      }
    });
    perIndexTypes[index] = normalizedIndexMappings;
  });
}

export function loadAliases(aliases: IndexAliases) {
  perAliasIndices = {};
  Object.entries(aliases).forEach(([index, indexAliases]) => {
    // verify we have an index defined. useful when mapping loading is disabled
    perIndexTypes[index] = perIndexTypes[index] || {};

    Object.keys(indexAliases.aliases || {}).forEach((alias) => {
      if (alias === index) {
        return;
      } // alias which is identical to index means no index.
      let curAliases = perAliasIndices[alias];
      if (!curAliases) {
        curAliases = [];
        perAliasIndices[alias] = curAliases;
      }
      curAliases.push(index);
    });
  });

  perAliasIndices._all = getIndices(false);
}

export function clear() {
  perIndexTypes = {};
  perAliasIndices = {};
  templates = [];
}

function retrieveSettings(
  http: HttpSetup,
  settingsKey: string,
  settingsToRetrieve: any,
  dataSourceId: string
): Promise<HttpResponse<any>> | Promise<void> | Promise<{}> {
  const settingKeyToPathMap: { [settingsKey: string]: string } = {
    fields: '_mapping',
    indices: '_aliases',
    templates: '_template',
  };

  // Fetch autocomplete info if setting is set to true, and if user has made changes.
  if (settingsToRetrieve[settingsKey] === true) {
    return opensearch.send(http, 'GET', settingKeyToPathMap[settingsKey], null, dataSourceId);
  } else {
    if (settingsToRetrieve[settingsKey] === false) {
      // If the user doesn't want autocomplete suggestions, then clear any that exist
      return Promise.resolve({});
    } else {
      // If the user doesn't want autocomplete suggestions, then clear any that exist
      return Promise.resolve();
    }
  }
}

// Retrieve all selected settings by default.
// TODO: We should refactor this to be easier to consume. Ideally this function should retrieve
// whatever settings are specified, otherwise just use the saved settings. This requires changing
// the behavior to not *clear* whatever settings have been unselected, but it's hard to tell if
// this is possible without altering the autocomplete behavior. These are the scenarios we need to
// support:
//   1. Manual refresh. Specify what we want. Fetch specified, leave unspecified alone.
//   2. Changed selection and saved: Specify what we want. Fetch changed and selected, leave
//      unchanged alone (both selected and unselected).
//   3. Poll: Use saved. Fetch selected. Ignore unselected.

export function clearSubscriptions() {
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
  }
}

// Type guard function
function isHttpResponse<T>(object: any): object is HttpResponse<T> {
  return object && typeof object === 'object' && 'body' in object;
}

const retrieveMappings = async (http: HttpSetup, settingsToRetrieve: any, dataSourceId: string) => {
  const response = await retrieveSettings(http, 'fields', settingsToRetrieve, dataSourceId);

  if (isHttpResponse(response) && response.body) {
    const mappings = response.body;
    const maxMappingSize = Object.keys(mappings).length > 10 * 1024 * 1024;
    let mappingsResponse: IndexMapping | IndexMappingOld | '{}';
    if (maxMappingSize) {
      // eslint-disable-next-line no-console
      console.warn(
        `Mapping size is larger than 10MB (${
          Object.keys(mappings).length / 1024 / 1024
        } MB). Ignoring...`
      );
      mappingsResponse = '{}';
    } else {
      mappingsResponse = mappings as IndexMapping | IndexMappingOld;
    }
    loadMappings(mappingsResponse);
  }
};

const retrieveAliases = async (http: HttpSetup, settingsToRetrieve: any, dataSourceId: string) => {
  const response = await retrieveSettings(http, 'fields', settingsToRetrieve, dataSourceId);

  if (isHttpResponse(response) && response.body) {
    const aliases = response.body as IndexAliases;
    loadAliases(aliases);
  }
};

const retrieveTemplates = async (
  http: HttpSetup,
  settingsToRetrieve: any,
  dataSourceId: string
) => {
  const response = await retrieveSettings(http, 'fields', settingsToRetrieve, dataSourceId);

  if (isHttpResponse(response) && response.body) {
    const resTemplates = response.body;
    loadTemplates(resTemplates);
  }
};

/**
 *
 * @param settings Settings A way to retrieve the current settings
 * @param settingsToRetrieve any
 */
export function retrieveAutoCompleteInfo(
  http: HttpSetup,
  settings: Settings,
  settingsToRetrieve: any,
  dataSourceId: string
) {
  clearSubscriptions();

  Promise.allSettled([
    retrieveMappings(http, settingsToRetrieve, dataSourceId),
    retrieveAliases(http, settingsToRetrieve, dataSourceId),
    retrieveTemplates(http, settingsToRetrieve, dataSourceId),
  ]).then(() => {
    // Schedule next request.
    pollTimeoutId = setTimeout(() => {
      // This looks strange/inefficient, but it ensures correct behavior because we don't want to send
      // a scheduled request if the user turns off polling.
      if (settings.getPolling()) {
        retrieveAutoCompleteInfo(http, settings, settings.getAutocomplete(), dataSourceId);
      }
    }, POLL_INTERVAL);
  });
}
