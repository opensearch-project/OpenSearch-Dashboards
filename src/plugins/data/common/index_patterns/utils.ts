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

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import type { IndexPatternSavedObjectAttrs } from './index_patterns';
import type { SavedObject, SavedObjectReference, SavedObjectsClientCommon } from '../types';

/**
 * Returns an object matching a given title
 *
 * @param client {SavedObjectsClientCommon}
 * @param title {string}
 * @param dataSourceId {string}{optional}
 * @returns {Promise<SavedObject|undefined>}
 */
export async function findByTitle(
  client: SavedObjectsClientCommon,
  title: string,
  dataSourceId?: string
) {
  if (title) {
    const savedObjects = (
      await client.find<IndexPatternSavedObjectAttrs>({
        type: 'index-pattern',
        perPage: 10,
        search: `"${title}"`,
        searchFields: ['title'],
        fields: ['title'],
      })
    ).filter((obj) => {
      return obj && obj.attributes && validateDataSourceReference(obj, dataSourceId);
    });

    return savedObjects.find((obj) => obj.attributes.title.toLowerCase() === title.toLowerCase());
  }
}

// This is used to validate datasource reference of index pattern
export const validateDataSourceReference = (
  indexPattern: SavedObject<IndexPatternSavedObjectAttrs>,
  dataSourceId?: string
) => {
  const references = indexPattern.references;
  if (dataSourceId) {
    return references.some((ref) => ref.id === dataSourceId && ref.type === 'data-source');
  } else {
    // No datasource id passed as input meaning we are getting index pattern from default cluster,
    // and it's supposed to be an empty array
    return references.length === 0;
  }
};

export const getIndexPatternTitle = async (
  indexPatternTitle: string,
  references: SavedObjectReference[],
  getDataSource: (id: string) => Promise<SavedObject<DataSourceAttributes>>
): Promise<string> => {
  const DATA_SOURCE_INDEX_PATTERN_DELIMITER = '.';
  let dataSourceTitle;
  const dataSourceReference = references.find((ref) => ref.type === 'data-source');

  // If an index-pattern references datasource, prepend data source name with index pattern name for display purpose
  if (dataSourceReference) {
    const dataSourceId = dataSourceReference.id;
    try {
      const {
        attributes: { title },
        error,
      } = await getDataSource(dataSourceId);
      dataSourceTitle = error ? dataSourceId : title;
    } catch (e) {
      // use datasource id as title when failing to fetch datasource
      dataSourceTitle = dataSourceId;
    }

    return dataSourceTitle.concat(DATA_SOURCE_INDEX_PATTERN_DELIMITER).concat(indexPatternTitle);
  } else {
    // if index pattern doesn't reference datasource, return as it is.
    return indexPatternTitle;
  }
};
