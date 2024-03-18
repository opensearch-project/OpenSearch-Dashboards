/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse, stringify } from 'hjson';
import { SavedObject, SavedObjectsClientContract } from '../types';

export interface UpdateDataSourceNameInVegaSpecProps {
  spec: string;
  newDataSourceName: string;
}

export const updateDataSourceNameInVegaSpec = (
  props: UpdateDataSourceNameInVegaSpecProps
): string => {
  const { spec } = props;

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
      });
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
  if (isVegaVisualization(savedObject)) {
    // @ts-expect-error
    const visStateObject = JSON.parse(savedObject.attributes?.visState);
    return visStateObject.params.spec;
  }

  return undefined;
};

const isVegaVisualization = (savedObject: SavedObject) => {
  // @ts-expect-error
  const visState = savedObject.attributes?.visState;
  if (!!visState) {
    const visStateObject = JSON.parse(visState);
    return !!visStateObject.type && visStateObject.type === 'vega';
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
