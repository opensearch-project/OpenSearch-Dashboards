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

import { i18n } from '@osd/i18n';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { SavedObjectsClientCommon } from '../..';
import { createIndexPatternCache } from '.';
import { IndexPattern } from './index_pattern';
import {
  createEnsureDefaultIndexPattern,
  EnsureDefaultIndexPattern,
} from './ensure_default_index_pattern';
import {
  OnNotification,
  OnError,
  OnUnsupportedTimePattern,
  UiSettingsCommon,
  IIndexPatternsApiClient,
  GetFieldsOptions,
  IndexPatternSpec,
  IndexPatternAttributes,
  FieldSpec,
  FieldFormatMap,
  IndexPatternFieldMap,
} from '../types';
import { FieldFormatsStartCommon } from '../../field_formats';
import { UI_SETTINGS, SavedObject } from '../../../common';
import { SavedObjectNotFound } from '../../../../opensearch_dashboards_utils/common';
import { IndexPatternMissingIndices } from '../lib';
import { findByTitle, getIndexPatternTitle } from '../utils';
import { DuplicateIndexPatternError, MissingIndexPatternError } from '../errors';

const indexPatternCache = createIndexPatternCache();
const MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS = 3;
const savedObjectType = 'index-pattern';

export interface IndexPatternSavedObjectAttrs {
  title: string;
  displayName?: string;
}

interface IndexPatternsServiceDeps {
  uiSettings: UiSettingsCommon;
  savedObjectsClient: SavedObjectsClientCommon;
  apiClient: IIndexPatternsApiClient;
  fieldFormats: FieldFormatsStartCommon;
  onNotification: OnNotification;
  onError: OnError;
  onRedirectNoIndexPattern?: () => void;
  onUnsupportedTimePattern: OnUnsupportedTimePattern;
  canUpdateUiSetting?: boolean;
}

const DEFAULT_AUTO_REFRESH_INTERVAL_MS = 300000;

export class IndexPatternsService {
  private config: UiSettingsCommon;
  private savedObjectsClient: SavedObjectsClientCommon;
  private savedObjectsCache?: Array<SavedObject<IndexPatternSavedObjectAttrs>> | null;
  private apiClient: IIndexPatternsApiClient;
  private fieldFormats: FieldFormatsStartCommon;
  private onNotification: OnNotification;
  private onError: OnError;
  private onUnsupportedTimePattern: OnUnsupportedTimePattern;
  private lastFieldsRefresh = new Map<string, number>();
  private notifiedNewFields = new Set<string>();
  private refreshInFlight = new Map<string, Promise<void>>();
  ensureDefaultIndexPattern: EnsureDefaultIndexPattern;

  constructor({
    uiSettings,
    savedObjectsClient,
    apiClient,
    fieldFormats,
    onNotification,
    onError,
    onUnsupportedTimePattern,
    onRedirectNoIndexPattern = () => {},
    canUpdateUiSetting,
  }: IndexPatternsServiceDeps) {
    this.apiClient = apiClient;
    this.config = uiSettings;
    this.savedObjectsClient = savedObjectsClient;
    this.fieldFormats = fieldFormats;
    this.onNotification = onNotification;
    this.onError = onError;
    this.onUnsupportedTimePattern = onUnsupportedTimePattern;
    this.ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      canUpdateUiSetting,
      savedObjectsClient
    );
  }

  /**
   * Refresh cache of index pattern ids and titles
   */
  private async refreshSavedObjectsCache() {
    this.savedObjectsCache = await this.savedObjectsClient.find<IndexPatternSavedObjectAttrs>({
      type: 'index-pattern',
      fields: ['title', 'displayName'],
      perPage: 10000,
    });

    this.savedObjectsCache = await Promise.all(
      this.savedObjectsCache.map(async (obj) => {
        // TODO: This behaviour will cause the index pattern title to be resolved differently depending on how its fetched since the get method in this service will not append the datasource title
        if (obj.type === 'index-pattern') {
          const result = { ...obj };
          result.attributes.title = await getIndexPatternTitle(
            obj.attributes.title,
            // @ts-expect-error TS2345 TODO(ts-error): fixme
            obj.references,
            this.getDataSource
          );
          return result;
        } else {
          return obj;
        }
      })
    );
  }

  getDataSource = async (id: string) => {
    return await this.savedObjectsClient.get<DataSourceAttributes>('data-source', id);
  };

  /**
   * Finds a data source by its title.
   *
   * @param title - The title of the data source to find.
   * @param size - The number of results to return. Defaults to 10.
   * @returns The first matching data source or undefined if not found.
   */
  findDataSourceByTitle = async (title: string, size: number = 10) => {
    const savedObjectsResponse = await this.savedObjectsClient.find<DataSourceAttributes>({
      type: 'data-source',
      fields: ['title'],
      search: title,
      searchFields: ['title'],
      perPage: size,
    });

    return savedObjectsResponse[0] || undefined;
  };

  /**
   * Get list of index pattern ids
   * @param refresh Force refresh of index pattern list
   */
  getIds = async (refresh: boolean = false) => {
    if (!this.savedObjectsCache || refresh) {
      await this.refreshSavedObjectsCache();
    }
    if (!this.savedObjectsCache) {
      return [];
    }
    return this.savedObjectsCache.map((obj) => obj?.id);
  };

  /**
   * Get list of index pattern titles
   * @param refresh Force refresh of index pattern list
   */
  getTitles = async (refresh: boolean = false): Promise<string[]> => {
    if (!this.savedObjectsCache || refresh) {
      await this.refreshSavedObjectsCache();
    }
    if (!this.savedObjectsCache) {
      return [];
    }
    return this.savedObjectsCache.map((obj) => obj?.attributes?.title);
  };

  /**
   * Get list of index pattern ids with titles
   * @param refresh Force refresh of index pattern list
   */
  getIdsWithTitle = async (
    refresh: boolean = false
  ): Promise<Array<{ id: string; title: string }>> => {
    if (!this.savedObjectsCache || refresh) {
      await this.refreshSavedObjectsCache();
    }
    if (!this.savedObjectsCache) {
      return [];
    }
    return this.savedObjectsCache.map((obj) => ({
      id: obj?.id,
      title: obj?.attributes?.title,
    }));
  };

  /**
   * Clear index pattern list cache
   * @param id optionally clear a single id
   */
  clearCache = (id?: string, clearSavedObjectsCache: boolean = true) => {
    if (clearSavedObjectsCache) {
      this.savedObjectsCache = null;
    }
    if (id) {
      indexPatternCache.clear(id);
    } else {
      indexPatternCache.clearAll();
    }
  };

  getCache = async () => {
    if (!this.savedObjectsCache) {
      await this.refreshSavedObjectsCache();
    }
    return this.savedObjectsCache;
  };

  saveToCache = (id: string, indexPattern: IndexPattern) => {
    indexPatternCache.set(id, indexPattern);
  };

  /**
   * Get default index pattern
   */
  getDefault = async () => {
    const defaultIndexPatternId = await this.config.get('defaultIndex');
    if (defaultIndexPatternId) {
      return await this.get(defaultIndexPatternId);
    }

    return null;
  };

  /**
   * Optionally set default index pattern, unless force = true
   * @param id
   * @param force
   */
  setDefault = async (id: string, force = false) => {
    if (force || !this.config.get('defaultIndex')) {
      await this.config.set('defaultIndex', id);
    }
  };

  /**
   * Get field list by providing { pattern }
   * @param options
   */
  getFieldsForWildcard = async (options: GetFieldsOptions = {}) => {
    const metaFields = await this.config.get(UI_SETTINGS.META_FIELDS);
    return this.apiClient.getFieldsForWildcard({
      pattern: options.pattern,
      metaFields,
      type: options.type,
      params: options.params || {},
      dataSourceId: options.dataSourceId,
    });
  };

  /**
   * Get field list by providing an index patttern (or spec)
   * @param options
   */
  getFieldsForIndexPattern = async (
    indexPattern: IndexPattern | IndexPatternSpec,
    options: GetFieldsOptions = {}
  ) =>
    this.getFieldsForWildcard({
      pattern: indexPattern.title as string,
      ...options,
      type: indexPattern.type,
      params: indexPattern.typeMeta && indexPattern.typeMeta.params,
      dataSourceId: indexPattern.dataSourceRef?.id,
    });

  /**
   * Refresh field list for a given index pattern
   * @param indexPattern
   */
  refreshFields = async (indexPattern: IndexPattern, skipType = false) => {
    try {
      const indexPatternCopy = skipType
        ? ({ ...indexPattern, type: undefined } as IndexPattern)
        : indexPattern;

      const fields = await this.getFieldsForIndexPattern(indexPatternCopy);
      const scripted = indexPattern.getScriptedFields().map((field) => field.spec);
      indexPattern.fields.replaceAll([...fields, ...scripted]);
    } catch (err) {
      if (err instanceof IndexPatternMissingIndices) {
        this.onNotification({ title: (err as any).message, color: 'danger', iconType: 'alert' });
      }

      this.onError(err, {
        title: i18n.translate('data.indexPatterns.fetchFieldErrorTitle', {
          defaultMessage: 'Error fetching fields for index pattern {title} (ID: {id})',
          values: { id: indexPattern.id, title: indexPattern.title },
        }),
      });
    }
  };

  /**
   * Refreshes a field list from a spec before an index pattern instance is created
   * @param fields
   * @param id
   * @param title
   * @param options
   */
  /**
   * Applies a set of formats to a set of fields
   * @param fieldSpecs
   * @param fieldFormatMap
   */
  private addFormatsToFields = (fieldSpecs: FieldSpec[], fieldFormatMap: FieldFormatMap) => {
    Object.entries(fieldFormatMap).forEach(([fieldName, value]) => {
      const field = fieldSpecs.find((fld: FieldSpec) => fld.name === fieldName);
      if (field) {
        field.format = value;
      }
    });
  };

  /**
   * Converts field array to map
   * @param fields
   */
  fieldArrayToMap = (fields: FieldSpec[]) =>
    fields.reduce<IndexPatternFieldMap>((collector, field) => {
      collector[field.name] = field;
      return collector;
    }, {});

  /**
   * Converts index pattern saved object to index pattern spec
   * @param savedObject
   */

  savedObjectToSpec = (savedObject: SavedObject<IndexPatternAttributes>): IndexPatternSpec => {
    const {
      id,
      version,
      attributes: {
        title,
        displayName,
        description,
        signalType,
        timeFieldName,
        intervalName,
        fields,
        sourceFilters,
        fieldFormatMap,
        typeMeta,
        type,
        schemaMappings,
      },
      references,
    } = savedObject;

    const parsedSourceFilters = sourceFilters ? JSON.parse(sourceFilters) : undefined;
    const parsedTypeMeta = typeMeta ? JSON.parse(typeMeta) : undefined;
    const parsedFieldFormatMap = fieldFormatMap ? JSON.parse(fieldFormatMap) : {};
    const parsedFields: FieldSpec[] = Array.isArray(fields)
      ? fields
      : fields
      ? JSON.parse(fields)
      : [];
    const parsedSchemaMappings = schemaMappings ? JSON.parse(schemaMappings) : undefined;
    const dataSourceRef = Array.isArray(references) ? references[0] : undefined;

    this.addFormatsToFields(parsedFields, parsedFieldFormatMap);
    return {
      id,
      version,
      title,
      displayName,
      description,
      signalType,
      intervalName,
      timeFieldName,
      sourceFilters: parsedSourceFilters,
      fields: this.fieldArrayToMap(parsedFields),
      typeMeta: parsedTypeMeta,
      type,
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      dataSourceRef,
      schemaMappings: parsedSchemaMappings,
    };
  };

  /**
   * Best-effort background refresh of an index pattern's field list, modelled on Kibana's
   * implicit refresh: refetch mappings if the configured TTL has elapsed, persist any diff,
   * and optionally notify the user about brand-new fields. Errors are swallowed because this
   * runs detached from the caller — a regression would only delay surfacing new fields, never
   * break the UI flow that triggered get().
   */
  private maybeRefreshFieldsInBackground = (indexPattern: IndexPattern): Promise<void> => {
    const id = indexPattern.id;
    if (!id || !indexPattern.title) return Promise.resolve();

    const existing = this.refreshInFlight.get(id);
    if (existing) return existing;

    // Claim the slot synchronously, before any awaits, so two concurrent callers cannot
    // both pass the existence check and create separate refreshes. doFieldsRefresh
    // performs the TTL gate and field reload behind that slot.
    const work = this.doFieldsRefresh(indexPattern, id);
    this.refreshInFlight.set(id, work);
    work.finally(() => {
      if (this.refreshInFlight.get(id) === work) {
        this.refreshInFlight.delete(id);
      }
    });
    return work;
  };

  private doFieldsRefresh = async (indexPattern: IndexPattern, id: string): Promise<void> => {
    let autoRefresh: boolean;
    let intervalMs: number;
    let notify: boolean;
    try {
      autoRefresh = (await this.config.get(UI_SETTINGS.INDEXPATTERN_AUTO_REFRESH_FIELDS)) ?? true;
      intervalMs =
        (await this.config.get(UI_SETTINGS.INDEXPATTERN_AUTO_REFRESH_FIELDS_INTERVAL_MS)) ??
        DEFAULT_AUTO_REFRESH_INTERVAL_MS;
      notify = (await this.config.get(UI_SETTINGS.INDEXPATTERN_NOTIFY_ON_NEW_FIELDS)) ?? true;
    } catch (e) {
      return;
    }
    if (!autoRefresh) return;

    const last = this.lastFieldsRefresh.get(id);
    if (last !== undefined && Date.now() - last < intervalMs) return;

    // Stamp the start time before any awaits. If the actual refresh takes longer than
    // intervalMs, a duplicate caller cannot slip past the TTL check before we record
    // completion. The dedup map already coalesces calls that overlap a live work
    // promise; this stamp covers the gap right after the slot is freed.
    this.lastFieldsRefresh.set(id, Date.now());

    const previousFieldNames = new Set(indexPattern.fields.getAll().map((f) => f.name));
    const scripted = indexPattern.getScriptedFields().map((field) => field.spec);

    try {
      const newFields = await this.getFieldsForIndexPattern(indexPattern);
      indexPattern.fields.replaceAll([...newFields, ...scripted]);
    } catch (e) {
      // Silent best-effort: the manual "Refresh field list" button stays available for
      // surfacing actionable errors. Do not toast here.
      return;
    }

    const currentFieldNames = new Set(indexPattern.fields.getAll().map((f) => f.name));
    const addedFields: string[] = [];
    currentFieldNames.forEach((name) => {
      if (!previousFieldNames.has(name)) addedFields.push(name);
    });
    const hasRemovedField = [...previousFieldNames].some((name) => !currentFieldNames.has(name));
    const hasDiff = addedFields.length > 0 || hasRemovedField;

    if (hasDiff) {
      // Coalesce concurrent writers: if another client already persisted a field list
      // that is a superset of ours, adopt their state and skip the write. We only fall
      // back to writing ourselves when we still have something new to contribute.
      let needsWrite = true;
      try {
        const latest = await this.savedObjectsClient.get<IndexPatternAttributes>(
          savedObjectType,
          id
        );
        if (latest?.version && latest.version !== indexPattern.version) {
          const updatedSpec = this.savedObjectToSpec(latest);
          const updatedFieldsByName = updatedSpec.fields ?? {};
          // The persisted superset must cover every local field by name AND type. A type
          // change (e.g. text -> keyword) means the cluster schema shifted in a way the
          // peer write did not capture, so we still need to persist our refreshed view.
          const allLocalCovered = indexPattern.fields.getAll().every((local) => {
            const remote = updatedFieldsByName[local.name];
            return remote !== undefined && remote.type === local.type;
          });
          if (allLocalCovered) {
            const updatedFieldsList = Object.values(updatedFieldsByName) as FieldSpec[];
            indexPattern.fields.replaceAll([...updatedFieldsList, ...scripted]);
            indexPattern.version = latest.version;
            needsWrite = false;
          }
        }
      } catch (e) {
        // Best-effort coalescer: if the freshness check fails we fall through to the
        // normal write path, where updateSavedObject's existing 409 retry+merge logic
        // is the next line of defense.
      }

      if (needsWrite) {
        try {
          await this.updateSavedObject(indexPattern, 0, true);
        } catch (e) {
          // Persistence failure is non-fatal: in-memory fields are already updated, so
          // the session benefits even if the saved object stayed behind.
        }
      }
    }

    if (addedFields.length > 0 && notify && !this.notifiedNewFields.has(id)) {
      this.notifiedNewFields.add(id);
      this.onNotification({
        title: i18n.translate('data.indexPatterns.newFieldsDetectedTitle', {
          defaultMessage:
            '{count, plural, one {# new field} other {# new fields}} detected in {indexPatternTitle}',
          values: { count: addedFields.length, indexPatternTitle: indexPattern.title },
        }),
        color: 'primary',
        iconType: 'iInCircle',
      });
    }

    // Re-stamp on successful completion so the TTL window starts from the moment the
    // refresh finished rather than the moment it started.
    this.lastFieldsRefresh.set(id, Date.now());
  };

  /**
   * Get an index pattern by id. Cache optimized
   * @param id
   * @param onlyCheckCache - Only check cache for index pattern if it doesn't exist it will not error out
   */

  get = async (id: string, onlyCheckCache: boolean = false): Promise<IndexPattern> => {
    const cache = indexPatternCache.get(id);

    if (cache || onlyCheckCache) {
      if (cache) {
        // Stale-while-revalidate: schedule a background field refresh without awaiting.
        void this.maybeRefreshFieldsInBackground(cache);
      }
      return cache;
    }

    const savedObject = await this.savedObjectsClient.get<IndexPatternAttributes>(
      savedObjectType,
      id
    );

    if (!savedObject.version) {
      throw new SavedObjectNotFound(
        savedObjectType,
        id,
        'management/opensearch-dashboards/indexPatterns'
      );
    }

    const spec = this.savedObjectToSpec(savedObject);
    const parsedFieldFormats: FieldFormatMap = savedObject.attributes.fieldFormatMap
      ? JSON.parse(savedObject.attributes.fieldFormatMap)
      : {};

    Object.entries(parsedFieldFormats).forEach(([fieldName, value]) => {
      const field = spec.fields?.[fieldName];
      if (field) {
        field.format = value;
      }
    });

    const indexPattern = await this.create(spec, true);
    indexPatternCache.set(id, indexPattern);

    if (indexPattern.isUnsupportedTimePattern()) {
      this.onUnsupportedTimePattern({
        id: indexPattern.id as string,
        title: indexPattern.title,
        index: indexPattern.getIndex(),
      });
    }

    indexPattern.resetOriginalSavedObjectBody();
    // Stale-while-revalidate: a freshly-loaded pattern still pulls fields from the persisted
    // saved object, so trigger a background refresh on first access too.
    void this.maybeRefreshFieldsInBackground(indexPattern);
    return indexPattern;
  };

  /**
   * Get an index pattern by title if cached
   * @param id
   */
  getByTitle = (title: string, ignoreErrors: boolean = false): IndexPattern => {
    const indexPattern = indexPatternCache.getByTitle(title);
    if (!indexPattern && !ignoreErrors) {
      throw new MissingIndexPatternError(`Missing index pattern: ${title}`);
    }
    return indexPattern;
  };

  migrate(indexPattern: IndexPattern, newTitle: string) {
    return this.savedObjectsClient
      .update<IndexPatternAttributes>(
        savedObjectType,
        indexPattern.id!,
        {
          title: newTitle,
          intervalName: null,
        },
        {
          version: indexPattern.version,
        }
      )
      .then(({ attributes: { title, intervalName } }) => {
        indexPattern.title = title;
        indexPattern.intervalName = intervalName;
      })
      .then(() => this);
  }

  /**
   * Create a new index pattern instance
   * @param spec
   * @param skipFetchFields
   */
  async create(spec: IndexPatternSpec, skipFetchFields = false): Promise<IndexPattern> {
    const shortDotsEnable = await this.config.get(UI_SETTINGS.SHORT_DOTS_ENABLE);
    const metaFields = await this.config.get(UI_SETTINGS.META_FIELDS);

    const indexPattern = new IndexPattern({
      spec,
      savedObjectsClient: this.savedObjectsClient,
      fieldFormats: this.fieldFormats,
      shortDotsEnable,
      metaFields,
    });

    if (!skipFetchFields) {
      await this.refreshFields(indexPattern);
    }

    return indexPattern;
  }

  find = async (search: string, size: number = 10): Promise<IndexPattern[]> => {
    const savedObjects = await this.savedObjectsClient.find<IndexPatternSavedObjectAttrs>({
      type: 'index-pattern',
      fields: ['title'],
      search,
      searchFields: ['title'],
      perPage: size,
    });
    const getIndexPatternPromises = savedObjects.map(async (savedObject) => {
      return await this.get(savedObject.id);
    });
    return await Promise.all(getIndexPatternPromises);
  };

  /**
   * Create a new index pattern and save it right away
   * @param spec
   * @param override Overwrite if existing index pattern exists
   * @param skipFetchFields
   */

  async createAndSave(spec: IndexPatternSpec, override = false, skipFetchFields = false) {
    const indexPattern = await this.create(spec, skipFetchFields);
    await this.createSavedObject(indexPattern, override);
    await this.setDefault(indexPattern.id as string);
    return indexPattern;
  }

  /**
   * Save a new index pattern
   * @param indexPattern
   * @param override Overwrite if existing index pattern exists
   */

  async createSavedObject(indexPattern: IndexPattern, override = false) {
    const dupe = await findByTitle(
      this.savedObjectsClient,
      indexPattern.title,
      indexPattern.dataSourceRef?.id
    );
    if (dupe) {
      if (override) {
        await this.delete(dupe.id);
      } else {
        throw new DuplicateIndexPatternError(`Duplicate index pattern: ${indexPattern.title}`);
      }
    }

    const body = indexPattern.getAsSavedObjectBody();
    const references = indexPattern.getSaveObjectReference();

    const response = await this.savedObjectsClient.create(savedObjectType, body, {
      id: indexPattern.id,
      references,
    });
    indexPattern.id = response.id;
    indexPatternCache.set(indexPattern.id, indexPattern);
    return indexPattern;
  }

  /**
   * Save existing index pattern. Will attempt to merge differences if there are conflicts
   * @param indexPattern
   * @param saveAttempts
   */

  async updateSavedObject(
    indexPattern: IndexPattern,
    saveAttempts: number = 0,
    ignoreErrors: boolean = false
  ): Promise<void | Error> {
    if (!indexPattern.id) return;

    // get the list of attributes
    const body = indexPattern.getAsSavedObjectBody();
    const originalBody = indexPattern.getOriginalSavedObjectBody();

    // get changed keys
    const originalChangedKeys: string[] = [];
    Object.entries(body).forEach(([key, value]) => {
      if (value !== (originalBody as any)[key]) {
        originalChangedKeys.push(key);
      }
    });

    return this.savedObjectsClient
      .update(savedObjectType, indexPattern.id, body, { version: indexPattern.version })
      .then((resp) => {
        indexPattern.id = resp.id;
        indexPattern.version = resp.version;
      })
      .catch(async (err) => {
        if (err?.res?.status === 409 && saveAttempts++ < MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS) {
          const samePattern = await this.get(indexPattern.id as string);
          // What keys changed from now and what the server returned
          const updatedBody = samePattern.getAsSavedObjectBody();

          // Build a list of changed keys from the server response
          // and ensure we ignore the key if the server response
          // is the same as the original response (since that is expected
          // if we made a change in that key)

          const serverChangedKeys: string[] = [];
          Object.entries(updatedBody).forEach(([key, value]) => {
            if (value !== (body as any)[key] && value !== (originalBody as any)[key]) {
              serverChangedKeys.push(key);
            }
          });

          let unresolvedCollision = false;
          for (const originalKey of originalChangedKeys) {
            for (const serverKey of serverChangedKeys) {
              if (originalKey === serverKey) {
                unresolvedCollision = true;
                break;
              }
            }
          }

          if (unresolvedCollision) {
            if (ignoreErrors) {
              return;
            }
            const title = i18n.translate('data.indexPatterns.unableWriteLabel', {
              defaultMessage:
                'Unable to write index pattern! Refresh the page to get the most up to date changes for this index pattern.',
            });

            this.onNotification({ title, color: 'danger' });
            throw err;
          }

          // Set the updated response on this object
          serverChangedKeys.forEach((key) => {
            (indexPattern as any)[key] = (samePattern as any)[key];
          });
          indexPattern.version = samePattern.version;

          // Clear cache
          indexPatternCache.clear(indexPattern.id!);

          // Try the save again
          return this.updateSavedObject(indexPattern, saveAttempts, ignoreErrors);
        }
        throw err;
      });
  }

  /**
   * Deletes an index pattern from .kibana index
   * @param indexPatternId: Id of OpenSearch Dashboards Index Pattern to delete
   */
  async delete(indexPatternId: string) {
    indexPatternCache.clear(indexPatternId);
    return this.savedObjectsClient.delete('index-pattern', indexPatternId);
  }

  isLongNumeralsSupported() {
    return this.config.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS);
  }
}

export type IndexPatternsContract = PublicMethodsOf<IndexPatternsService>;
