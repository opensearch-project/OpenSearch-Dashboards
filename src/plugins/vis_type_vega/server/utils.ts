/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from 'hjson';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { SavedObjectsClientContract, SavedObjectsErrorHelpers } from '../../../core/server';

export interface FindDataSourceByTitleQueryProps {
  dataSourceName: string;
  savedObjectsClient: SavedObjectsClientContract;
}

export const findDataSourceIdbyName = async (props: FindDataSourceByTitleQueryProps) => {
  const { dataSourceName } = props;
  const dataSources = await dataSourceFindQuery(props);

  // In the case that data_source_name is a prefix of another name, match exact data_source_name
  const possibleDataSourceObjects = dataSources.saved_objects.filter(
    (obj) => obj.attributes.title === dataSourceName
  );

  if (possibleDataSourceObjects.length !== 1) {
    throw SavedObjectsErrorHelpers.createBadRequestError(
      `Expected exactly 1 result for data_source_name "${dataSourceName}" but got ${possibleDataSourceObjects.length} results`
    );
  }

  return possibleDataSourceObjects.pop()?.id;
};

export const extractVegaSpecFromAttributes = (attributes: unknown) => {
  if (isVegaVisualization(attributes)) {
    // @ts-expect-error
    const visStateObject = JSON.parse(attributes?.visState);
    return visStateObject.params.spec;
  }

  return undefined;
};

export const extractDataSourceNamesInVegaSpec = (spec: string) => {
  const parsedSpec = parse(spec, { keepWsc: true });
  const dataSourceNameSet = new Set<string>();

  const dataObjects = collectDataObjects(parsedSpec);
  for (const dataObject of dataObjects) {
    const dataSourceName = getDataSourceNameFromObject(dataObject);
    if (dataSourceName) {
      dataSourceNameSet.add(dataSourceName);
    }
  }

  return dataSourceNameSet;
};

const MAX_TRAVERSAL_NODES = 10000;

const collectDataObjects = (root: Record<string, any>): Array<Record<string, any>> => {
  const results: Array<Record<string, any>> = [];
  const stack: Array<Record<string, any>> = [root];
  let visited = 0;

  while (stack.length > 0) {
    if (++visited > MAX_TRAVERSAL_NODES) {
      break;
    }

    const node = stack.pop();
    if (!node || typeof node !== 'object') {
      continue;
    }

    // Collect data field (object or array)
    if (node.data) {
      if (Array.isArray(node.data)) {
        results.push(...node.data);
      } else if (typeof node.data === 'object') {
        results.push(node.data);
      }
    }

    // Traverse Vega-Lite composition fields
    for (const key of ['layer', 'hconcat', 'vconcat', 'concat']) {
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          stack.push(child);
        }
      }
    }

    // Traverse facet/repeat inner spec
    if (node.spec && typeof node.spec === 'object') {
      stack.push(node.spec);
    }
  }

  return results;
};

const getDataSourceNameFromObject = (dataObject: any) => {
  if (
    dataObject.hasOwnProperty('url') &&
    dataObject.url.hasOwnProperty('index') &&
    dataObject.url.hasOwnProperty('data_source_name')
  ) {
    return dataObject.url.data_source_name;
  }

  return undefined;
};

const isVegaVisualization = (attributes: unknown) => {
  // @ts-expect-error
  const visState = attributes?.visState;
  if (!!visState) {
    const visStateObject = JSON.parse(visState);
    return !!visStateObject.type && visStateObject.type === 'vega';
  }
  return false;
};

const dataSourceFindQuery = async (props: FindDataSourceByTitleQueryProps) => {
  const { savedObjectsClient, dataSourceName } = props;
  return await savedObjectsClient.find<DataSourceAttributes>({
    type: 'data-source',
    perPage: 10,
    search: `"${dataSourceName}"`,
    searchFields: ['title'],
    fields: ['id', 'title'],
  });
};
