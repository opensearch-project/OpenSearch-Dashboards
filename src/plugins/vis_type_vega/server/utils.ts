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

// Maximum number of nodes to visit during spec traversal. Prevents CPU abuse from
// adversarially large specs. hjson.parse already materializes the full spec in memory,
// so this bounds traversal time rather than memory. If exceeded, the spec is rejected
// as too complex rather than silently dropping data source references.
const MAX_TRAVERSAL_NODES = 10000;

export const extractDataSourceNamesInVegaSpec = (spec: string) => {
  const names = new Set<string>();
  const stack: unknown[] = [parse(spec, { keepWsc: true })];
  let visited = 0;

  while (stack.length > 0) {
    if (++visited > MAX_TRAVERSAL_NODES) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `Vega spec has too many data objects (exceeds limit of ${MAX_TRAVERSAL_NODES})`
      );
    }

    const node = stack.pop();
    if (node === null || typeof node !== 'object') continue;

    const name = getDataSourceNameFromObject(node);
    if (name) names.add(name);

    // Arrays yield their elements; objects yield their values
    stack.push(...Object.values(node as Record<string, unknown>));
  }

  return names;
};

const getDataSourceNameFromObject = (node: unknown): string | undefined => {
  if (node === null || typeof node !== 'object') return undefined;
  const url = (node as Record<string, unknown>).url;
  if (url === null || typeof url !== 'object') return undefined;
  const urlObj = url as Record<string, unknown>;
  return 'index' in urlObj && 'data_source_name' in urlObj
    ? (urlObj.data_source_name as string)
    : undefined;
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
