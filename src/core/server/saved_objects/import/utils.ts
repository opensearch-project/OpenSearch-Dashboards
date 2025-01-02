/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse, stringify } from 'hjson';
import { SavedObject, SavedObjectReference, SavedObjectsClientContract } from '../types';
import { VisualizationObject } from './types';

/**
 * Given a Vega spec, the new datasource (by name), and spacing, update the Vega spec to add the new datasource name to each local cluster query
 *
 * @param {string} spec - the stringified Vega spec (HJSON or JSON)
 * @param {string} newDataSourceName - the datasource name to append
 * @param {number} [spacing=2] - how large the indenting should be after updating the spec (should be set to > 0 for a readable spec)
 */
export interface UpdateDataSourceNameInVegaSpecProps {
  spec: string;
  newDataSourceName: string;
  spacing?: number;
}

/**
 * Given a visualization saved object and datasource id, return the updated visState and references if the visualization was a TSVB visualization
 * @param {VisualizationObject} object
 * @param {string} dataSourceId
 * @returns {{visState: string, references: SavedObjectReference[]}} - the updated stringified visState and references
 */
export const getUpdatedTSVBVisState = (
  object: VisualizationObject,
  dataSourceId: string
): { visState: string; references: SavedObjectReference[] } => {
  const visStateObject = JSON.parse(object.attributes.visState);

  if (visStateObject.type !== 'metrics') {
    return {
      visState: object.attributes.visState,
      references: object.references,
    };
  }

  const oldDataSourceId = visStateObject.params.data_source_id;
  const newReferences = object.references.filter((reference) => {
    return reference.id !== oldDataSourceId && reference.type === 'data-source';
  });

  visStateObject.params.data_source_id = dataSourceId;

  newReferences.push({
    id: dataSourceId,
    name: 'dataSource',
    type: 'data-source',
  });

  return {
    visState: JSON.stringify(visStateObject),
    references: newReferences,
  };
};

export const updateDataSourceNameInVegaSpec = (
  props: UpdateDataSourceNameInVegaSpecProps
): string => {
  const { spec, spacing } = props;
  const stringifiedSpacing = spacing || 2;

  let parsedSpec = parseJSONSpec(spec);
  const isJSONString = !!parsedSpec;
  if (!parsedSpec) {
    parsedSpec = parse(spec, { keepWsc: true });
  }

  const dataField = parsedSpec.data;

  if (dataField instanceof Array) {
    parsedSpec.data = dataField.map((dataObject) => {
      return updateDataSourceNameForDataObject(dataObject, props);
    });
  } else if (dataField instanceof Object) {
    parsedSpec.data = updateDataSourceNameForDataObject(dataField, props);
  } else {
    throw new Error(`"data" field should be an object or an array of objects`);
  }

  return isJSONString
    ? JSON.stringify(parsedSpec)
    : stringify(parsedSpec, {
        bracesSameLine: true,
        keepWsc: true,
        space: stringifiedSpacing,
      });
};

export const updateDataSourceNameInTimeline = (
  timelineExpression: string,
  dataSourceTitle: string
) => {
  const expressionRegex = /\.(opensearch|es|elasticsearch)\(([^)]*)\)/g;

  const replaceCallback = (match: string, funcName: string, args: string) => {
    if (!args.includes('data_source_name')) {
      let expressionArgs = args.trim();
      expressionArgs = `${expressionArgs}, data_source_name="${dataSourceTitle}"`;
      return `.${funcName}(${expressionArgs})`;
    }
    return match;
  };

  const modifiedExpression = timelineExpression.replace(expressionRegex, replaceCallback);
  return modifiedExpression;
};

export const getDataSourceTitleFromId = async (
  dataSourceId: string,
  savedObjectsClient: SavedObjectsClientContract
) => {
  return await savedObjectsClient.get('data-source', dataSourceId).then((response) => {
    // @ts-expect-error
    return response?.attributes?.title ?? undefined;
  });
};

export const extractVegaSpecFromSavedObject = (savedObject: SavedObject) => {
  if (confirmVisualizationType(savedObject, 'vega')) {
    // @ts-expect-error
    const visStateObject = JSON.parse(savedObject.attributes?.visState);
    return visStateObject.params.spec;
  }

  return undefined;
};

export const extractTimelineExpression = (savedObject: SavedObject) => {
  if (!confirmVisualizationType(savedObject, 'timelion')) {
    return undefined;
  }
  // @ts-expect-error
  const visStateString = savedObject.attributes?.visState;
  if (!visStateString) {
    return undefined;
  }

  const visStateObject = JSON.parse(visStateString);
  return visStateObject.params.expression;
};

const confirmVisualizationType = (savedObject: SavedObject, visualizationType: string) => {
  // @ts-expect-error
  const visState = savedObject.attributes?.visState;
  if (!!visState) {
    const visStateObject = JSON.parse(visState);
    return !!visStateObject.type && visStateObject.type === visualizationType;
  }
  return false;
};

const updateDataSourceNameForDataObject = (
  dataObject: any,
  props: UpdateDataSourceNameInVegaSpecProps
) => {
  const { newDataSourceName } = props;
  if (
    dataObject.hasOwnProperty('url') &&
    dataObject.url.hasOwnProperty('index') &&
    !dataObject.url.hasOwnProperty('data_source_name')
  ) {
    dataObject.url.data_source_name = newDataSourceName;
  }

  return dataObject;
};

const parseJSONSpec = (spec: string) => {
  try {
    const jsonSpec = JSON.parse(spec);

    if (jsonSpec && typeof jsonSpec === 'object') {
      return jsonSpec;
    }
  } catch (e) {
    return undefined;
  }

  return undefined;
};

export function findReferenceDataSourceForObject(
  savedObject: SavedObject,
  savedObjects: Map<string, SavedObject>,
  visited = new Set<string>()
): Set<string> {
  const dataSourceReferences = new Set<string>();

  const references = savedObject.references ?? [];
  visited.add(savedObject.id);

  // Traverse referenced objects recursively
  for (const reference of references) {
    // Add 'data-source' references directly associated with the object
    if (reference.type === 'data-source') {
      dataSourceReferences.add(reference.id);
    } else if (!visited.has(reference.id)) {
      const referenceObject = savedObjects.get(reference.id);
      if (referenceObject) {
        findReferenceDataSourceForObject(referenceObject, savedObjects, visited).forEach((ref) =>
          dataSourceReferences.add(ref)
        );
      }
    }
  }

  return dataSourceReferences;
}
