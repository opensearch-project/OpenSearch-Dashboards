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

import { SavedObjectsClientContract, SavedObjectsFindOptions } from 'opensearch-dashboards/public';
import { SavedObject } from '../types';
import { StringUtils } from './helpers/string_utils';

/**
 * The SavedObjectLoader class provides some convenience functions
 * to load and save one kind of saved objects (specified in the constructor).
 *
 * It is based on the SavedObjectClient which implements loading and saving
 * in an abstract, type-agnostic way. If possible, use SavedObjectClient directly
 * to avoid pulling in extra functionality which isn't used.
 */
export class SavedObjectLoader {
  private readonly Class: (id: string) => SavedObject;
  public type: string;
  public lowercaseType: string;
  public loaderProperties: Record<string, string>;

  constructor(
    SavedObjectClass: any,
    private readonly savedObjectsClient: SavedObjectsClientContract
  ) {
    this.type = SavedObjectClass.type;
    this.Class = SavedObjectClass;
    this.lowercaseType = this.type.toLowerCase();

    this.loaderProperties = {
      name: `${this.lowercaseType}s`,
      noun: StringUtils.upperFirst(this.type),
      nouns: `${this.lowercaseType}s`,
    };
  }

  /**
   * Retrieve a saved object by id or create new one.
   * Returns a promise that completes when the object finishes
   * initializing.
   * @param opts
   * @returns {Promise<SavedObject>}
   */
  async get(opts?: Record<string, unknown> | string) {
    // can accept object as argument in accordance to SavedVis class
    // see src/plugins/saved_objects/public/saved_object/saved_object_loader.ts
    // @ts-ignore
    const obj = new this.Class(opts);
    return obj.init();
  }

  urlFor(id: string) {
    return `#/${this.lowercaseType}/${encodeURIComponent(id)}`;
  }

  async delete(ids: string | string[]) {
    const idsUsed = !Array.isArray(ids) ? [ids] : ids;

    const deletions = idsUsed.map((id) => {
      // @ts-ignore
      const savedObject = new this.Class(id);
      return savedObject.delete();
    });
    await Promise.all(deletions);
  }

  /**
   * Updates source to contain an id and url field, and returns the updated
   * source object.
   * @param source
   * @param id
   * @returns {source} The modified source object, with an id and url field.
   */
  mapHitSource(source: Record<string, unknown>, id: string) {
    source.id = id;
    source.url = this.urlFor(id);
    return source;
  }

  /**
   * Updates hit.attributes to contain an updated_at, id and url field, and returns the updated
   * attributes object.
   * @param hit
   * @returns {hit.attributes} The modified hit.attributes object, with an updated_at, id and url field.
   */
  mapSavedObjectApiHits(hit: {
    attributes: Record<string, unknown>;
    id: string;
    updated_at?: string;
  }) {
    hit.attributes.updated_at = hit?.updated_at ?? hit.attributes._updatedAt;
    return this.mapHitSource(hit.attributes, hit.id);
  }

  /**
   * TODO: Rather than use a hardcoded limit, implement pagination. See
   * https://github.com/elastic/kibana/issues/8044 for reference.
   *
   * @param search
   * @param size
   * @param fields
   * @param hasReference Optional field to specify a reference
   * @param searchFields Optional field to specify the search fields in the query
   * @returns {Promise}
   */
  findAll(
    search: string = '',
    size: number = 100,
    fields?: string[],
    hasReference?: SavedObjectsFindOptions['hasReference'],
    searchFields: string[] = ['title^3', 'description']
  ) {
    return this.savedObjectsClient
      .find<Record<string, unknown>>({
        type: this.lowercaseType,
        search: search ? `${search}*` : undefined,
        perPage: size,
        page: 1,
        searchFields,
        defaultSearchOperator: 'AND',
        fields,
        hasReference,
      } as SavedObjectsFindOptions)
      .then((resp) => {
        return {
          total: resp.total,
          hits: resp.savedObjects.map((savedObject) => this.mapSavedObjectApiHits(savedObject)),
        };
      });
  }

  find(search: string = '', size: number = 100) {
    return this.findAll(search, size).then((resp) => {
      return {
        total: resp.total,
        hits: resp.hits.filter((savedObject) => !savedObject.error),
      };
    });
  }
}
