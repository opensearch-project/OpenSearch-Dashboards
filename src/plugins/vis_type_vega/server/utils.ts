/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from 'hjson';
import { SavedObjectsClientContract } from 'src/core/server';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';

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
    throw new Error(
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
  const dataField = parsedSpec.data;
  const dataSourceNameSet = new Set<string>();

  if (dataField instanceof Array) {
    dataField.forEach((dataObject) => {
      const dataSourceName = getDataSourceNameFromObject(dataObject);
      if (!!dataSourceName) {
        dataSourceNameSet.add(dataSourceName);
      }
    });
  } else if (dataField instanceof Object) {
    const dataSourceName = getDataSourceNameFromObject(dataField);
    if (!!dataSourceName) {
      dataSourceNameSet.add(dataSourceName);
    }
  } else {
    throw new Error(`"data" field should be an object or an array of objects`);
  }

  return dataSourceNameSet;
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
