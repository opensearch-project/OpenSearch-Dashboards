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

import { IIndexPattern } from 'src/plugins/data/public';
import { SavedObjectsClientContract } from 'src/core/public';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { IndexPatternManagementStart } from '../plugin';

export async function getIndexPatterns(
  savedObjectsClient: SavedObjectsClientContract,
  defaultIndex: string,
  indexPatternManagementStart: IndexPatternManagementStart
) {
  return (
    savedObjectsClient
      .find<IIndexPattern>({
        type: 'index-pattern',
        fields: ['title', 'type'],
        perPage: 10000,
      })
      .then((response) =>
        response.savedObjects
          .map((pattern) => {
            const id = pattern.id;
            const title = pattern.get('title');
            const references = pattern.references;
            const isDefault = defaultIndex === id;

            const tags = (indexPatternManagementStart as IndexPatternManagementStart).list.getIndexPatternTags(
              pattern,
              isDefault
            );
            const reference = Array.isArray(references) ? references[0] : undefined;
            const referenceId = reference?.id;

            return {
              id,
              title,
              default: isDefault,
              tags,
              referenceId,
              // the prepending of 0 at the default pattern takes care of prioritization
              // so the sorting will but the default index on top
              // or on bottom of a the table
              sort: `${isDefault ? '0' : '1'}${title}`,
            };
          })
          .sort((a, b) => {
            if (a.sort < b.sort) {
              return -1;
            } else if (a.sort > b.sort) {
              return 1;
            } else {
              return 0;
            }
          })
      ) || []
  );
}

export async function getDataSources(savedObjectsClient: SavedObjectsClientContract) {
  return (
    savedObjectsClient
      .find<DataSourceAttributes>({
        type: 'data-source',
        fields: ['title', 'type'],
        perPage: 10000,
      })
      .then((response) =>
        response.savedObjects
          .map((dataSource) => {
            const id = dataSource.id;
            const type = dataSource.type;
            const title = dataSource.get('title');

            return {
              id,
              title,
              type,
              label: title,
              sort: `${title}`,
            };
          })
          .sort((a, b) => a.sort.localeCompare(b.sort))
      ) || []
  );
}
