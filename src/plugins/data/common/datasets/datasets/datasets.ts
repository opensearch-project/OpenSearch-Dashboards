/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { SavedObjectsClientCommon } from '../..';
import { createDatasetCache } from '.';
import { Dataset } from './dataset';
import { createEnsureDefaultDataset, EnsureDefaultDataset } from './ensure_default_dataset';
import {
  DatasetOnNotification as OnNotification,
  DatasetOnError as OnError,
  DatasetOnUnsupportedTimePattern as OnUnsupportedTimePattern,
  DatasetUiSettingsCommon as UiSettingsCommon,
  IDatasetsApiClient,
  DatasetGetFieldsOptions as GetFieldsOptions,
  DatasetSpec,
  DatasetAttributes,
  DatasetFieldSpec as FieldSpec,
  DatasetFieldFormatMap as FieldFormatMap,
  DatasetFieldMap,
} from '../types';
import { FieldFormatsStartCommon } from '../../field_formats';
import { UI_SETTINGS, SavedObject } from '../../../common';
import { SavedObjectNotFound } from '../../../../opensearch_dashboards_utils/common';
import { DatasetMissingData } from '../lib';
import { findByTitle, getDatasetTitle } from '../utils';
import { DuplicateDatasetError, MissingDatasetError } from '../errors';

const datasetCache = createDatasetCache();
const MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS = 3;
const savedObjectType = 'dataset';

export interface DatasetSavedObjectAttrs {
  title: string;
  displayName?: string;
}

interface DatasetsServiceDeps {
  uiSettings: UiSettingsCommon;
  savedObjectsClient: SavedObjectsClientCommon;
  apiClient: IDatasetsApiClient;
  fieldFormats: FieldFormatsStartCommon;
  onNotification: OnNotification;
  onError: OnError;
  onRedirectNoDataset?: () => void;
  onUnsupportedTimePattern: OnUnsupportedTimePattern;
  canUpdateUiSetting?: boolean;
}

export class DatasetsService {
  private config: UiSettingsCommon;
  private savedObjectsClient: SavedObjectsClientCommon;
  private savedObjectsCache?: Array<SavedObject<DatasetSavedObjectAttrs>> | null;
  private apiClient: IDatasetsApiClient;
  private fieldFormats: FieldFormatsStartCommon;
  private onNotification: OnNotification;
  private onError: OnError;
  private onUnsupportedTimePattern: OnUnsupportedTimePattern;
  ensureDefaultDataset: EnsureDefaultDataset;

  constructor({
    uiSettings,
    savedObjectsClient,
    apiClient,
    fieldFormats,
    onNotification,
    onError,
    onUnsupportedTimePattern,
    onRedirectNoDataset = () => {},
    canUpdateUiSetting,
  }: DatasetsServiceDeps) {
    this.apiClient = apiClient;
    this.config = uiSettings;
    this.savedObjectsClient = savedObjectsClient;
    this.fieldFormats = fieldFormats;
    this.onNotification = onNotification;
    this.onError = onError;
    this.onUnsupportedTimePattern = onUnsupportedTimePattern;
    this.ensureDefaultDataset = createEnsureDefaultDataset(
      uiSettings,
      onRedirectNoDataset,
      canUpdateUiSetting,
      savedObjectsClient
    );
  }

  /**
   * Refresh cache of dataset ids and titles
   */
  private async refreshSavedObjectsCache() {
    this.savedObjectsCache = await this.savedObjectsClient.find<DatasetSavedObjectAttrs>({
      type: 'dataset',
      fields: ['title', 'name'],
      perPage: 10000,
    });

    this.savedObjectsCache = await Promise.all(
      this.savedObjectsCache.map(async (obj) => {
        // TODO: This behaviour will cause the dataset title to be resolved differently depending on how its fetched since the get method in this service will not append the datasource title
        if (obj.type === 'dataset') {
          const result = { ...obj };
          result.attributes.title = await getDatasetTitle(
            obj.attributes.title,
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
   * Get list of dataset ids
   * @param refresh Force refresh of dataset list
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
   * Get list of dataset titles
   * @param refresh Force refresh of dataset list
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
   * Get list of dataset ids with titles
   * @param refresh Force refresh of dataset list
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
   * Clear dataset list cache
   * @param id optionally clear a single id
   */
  clearCache = (id?: string, clearSavedObjectsCache: boolean = true) => {
    if (clearSavedObjectsCache) {
      this.savedObjectsCache = null;
    }
    if (id) {
      datasetCache.clear(id);
    } else {
      datasetCache.clearAll();
    }
  };

  getCache = async () => {
    if (!this.savedObjectsCache) {
      await this.refreshSavedObjectsCache();
    }
    return this.savedObjectsCache;
  };

  saveToCache = (id: string, dataset: Dataset) => {
    datasetCache.set(id, dataset);
  };

  /**
   * Get default dataset
   */
  getDefault = async () => {
    const defaultDatasetId = await this.config.get('defaultIndex');
    if (defaultDatasetId) {
      return await this.get(defaultDatasetId);
    }

    return null;
  };

  /**
   * Optionally set default dataset, unless force = true
   * @param id
   * @param force
   */
  setDefault = async (id: string, force = false) => {
    if (force || !this.config.get('defaultIndex')) {
      await this.config.set('defaultIndex', id);
    }
  };

  private isFieldRefreshRequired(specs?: DatasetFieldMap): boolean {
    if (!specs) {
      return true;
    }

    return Object.values(specs).every((spec) => {
      const hasFieldCaps = 'aggregatable' in spec && 'searchable' in spec;
      const hasDocValuesFlag = 'readFromDocValues' in spec;

      return !hasFieldCaps || !hasDocValuesFlag;
    });
  }

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
  getFieldsForDataset = async (dataset: Dataset | DatasetSpec, options: GetFieldsOptions = {}) =>
    this.getFieldsForWildcard({
      pattern: dataset.title as string,
      ...options,
      type: dataset.type,
      params: dataset.typeMeta && dataset.typeMeta.params,
      dataSourceId: dataset.dataSourceRef?.id,
    });

  /**
   * Refresh field list for a given dataset
   * @param dataset
   */
  refreshFields = async (dataset: Dataset, skipType = false) => {
    try {
      const datasetCopy = skipType ? ({ ...dataset, type: undefined } as Dataset) : dataset;

      const fields = await this.getFieldsForDataset(datasetCopy);
      const scripted = dataset.getScriptedFields().map((field) => field.spec);
      dataset.fields.replaceAll([...fields, ...scripted]);
    } catch (err) {
      if (err instanceof DatasetMissingData) {
        this.onNotification({ title: (err as any).message, color: 'danger', iconType: 'alert' });
      }

      this.onError(err, {
        title: i18n.translate('data.datasets.fetchFieldErrorTitle', {
          defaultMessage: 'Error fetching fields for dataset {title} (ID: {id})',
          values: { id: dataset.id, title: dataset.title },
        }),
      });
    }
  };

  /**
   * Refreshes a field list from a spec before an dataset instance is created
   * @param fields
   * @param id
   * @param title
   * @param options
   */
  private refreshFieldSpecMap = async (
    fields: DatasetFieldMap,
    id: string,
    title: string,
    options: GetFieldsOptions
  ) => {
    const scriptdFields = Object.values(fields).filter((field) => field.scripted);
    try {
      const newFields = await this.getFieldsForWildcard(options);
      return this.fieldArrayToMap([...newFields, ...scriptdFields]);
    } catch (err) {
      if (err instanceof DatasetMissingData) {
        this.onNotification({ title: (err as any).message, color: 'danger', iconType: 'alert' });
        return {};
      }

      this.onError(err, {
        title: i18n.translate('data.datasets.fetchFieldErrorTitle', {
          defaultMessage: 'Error fetching fields for dataset {title} (ID: {id})',
          values: { id, title },
        }),
      });
    }
    return fields;
  };

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
    fields.reduce<DatasetFieldMap>((collector, field) => {
      collector[field.name] = field;
      return collector;
    }, {});

  /**
   * Converts dataset saved object to dataset spec
   * @param savedObject
   */
  savedObjectToSpec = (savedObject: SavedObject<DatasetAttributes>): DatasetSpec => {
    const {
      id,
      version,
      attributes: {
        title,
        displayName,
        description,
        timeFieldName,
        intervalName,
        fields,
        sourceFilters,
        fieldFormatMap,
        typeMeta,
        type,
      },
      references,
    } = savedObject;

    const parsedSourceFilters = sourceFilters ? JSON.parse(sourceFilters) : undefined;
    const parsedTypeMeta = typeMeta ? JSON.parse(typeMeta) : undefined;
    const parsedFieldFormatMap = fieldFormatMap ? JSON.parse(fieldFormatMap) : {};
    const parsedFields: FieldSpec[] = fields ? JSON.parse(fields) : [];
    const dataSourceRef = Array.isArray(references) ? references[0] : undefined;

    this.addFormatsToFields(parsedFields, parsedFieldFormatMap);
    return {
      id,
      version,
      title,
      displayName,
      description,
      intervalName,
      timeFieldName,
      sourceFilters: parsedSourceFilters,
      fields: this.fieldArrayToMap(parsedFields),
      typeMeta: parsedTypeMeta,
      type,
      dataSourceRef,
    };
  };

  /**
   * Get an dataset by id. Cache optimized
   * @param id
   * @param onlyCheckCache - Only check cache for dataset if it doesn't exist it will not error out
   */
  get = async (id: string, onlyCheckCache: boolean = false): Promise<Dataset> => {
    const cache = datasetCache.get(id);

    if (cache || onlyCheckCache) {
      return cache;
    }

    const savedObject = await this.savedObjectsClient.get<DatasetAttributes>(savedObjectType, id);

    if (!savedObject.version) {
      throw new SavedObjectNotFound(
        savedObjectType,
        id,
        'management/opensearch-dashboards/datasets'
      );
    }

    const spec = this.savedObjectToSpec(savedObject);
    const { title, type, typeMeta, dataSourceRef } = spec;
    const parsedFieldFormats: FieldFormatMap = savedObject.attributes.fieldFormatMap
      ? JSON.parse(savedObject.attributes.fieldFormatMap)
      : {};

    const isFieldRefreshRequired = this.isFieldRefreshRequired(spec.fields);
    let isSaveRequired = isFieldRefreshRequired;
    try {
      spec.fields = isFieldRefreshRequired
        ? await this.refreshFieldSpecMap(spec.fields || {}, id, spec.title as string, {
            pattern: title,
            metaFields: await this.config.get(UI_SETTINGS.META_FIELDS),
            type,
            params: typeMeta && typeMeta.params,
            dataSourceId: dataSourceRef?.id,
          })
        : spec.fields;
    } catch (err) {
      isSaveRequired = false;
      if (err instanceof DatasetMissingData) {
        this.onNotification({
          title: (err as any).message,
          color: 'danger',
          iconType: 'alert',
        });
      } else {
        this.onError(err, {
          title: i18n.translate('data.datasets.fetchFieldErrorTitle', {
            defaultMessage: 'Error fetching fields for dataset {title} (ID: {id})',
            values: { id, title },
          }),
        });
      }
    }

    Object.entries(parsedFieldFormats).forEach(([fieldName, value]) => {
      const field = spec.fields?.[fieldName];
      if (field) {
        field.format = value;
      }
    });

    const dataset = await this.create(spec, true);
    datasetCache.set(id, dataset);
    if (isSaveRequired) {
      try {
        this.updateSavedObject(dataset);
      } catch (err) {
        this.onError(err, {
          title: i18n.translate('data.datasets.fetchFieldSaveErrorTitle', {
            defaultMessage: 'Error saving after fetching fields for dataset {title} (ID: {id})',
            values: {
              id: dataset.id,
              title: dataset.title,
            },
          }),
        });
      }
    }

    if (dataset.isUnsupportedTimePattern()) {
      this.onUnsupportedTimePattern({
        id: dataset.id as string,
        title: dataset.title,
        index: dataset.getIndex(),
      });
    }

    dataset.resetOriginalSavedObjectBody();
    return dataset;
  };

  /**
   * Get an dataset by title if cached
   * @param id
   */
  getByTitle = (title: string, ignoreErrors: boolean = false): Dataset => {
    const dataset = datasetCache.getByTitle(title);
    if (!dataset && !ignoreErrors) {
      throw new MissingDatasetError(`Missing dataset: ${title}`);
    }
    return dataset;
  };

  migrate(dataset: Dataset, newTitle: string) {
    return this.savedObjectsClient
      .update<DatasetAttributes>(
        savedObjectType,
        dataset.id!,
        {
          title: newTitle,
          intervalName: null,
        },
        {
          version: dataset.version,
        }
      )
      .then(({ attributes: { title, intervalName } }) => {
        dataset.title = title;
        dataset.intervalName = intervalName;
      })
      .then(() => this);
  }

  /**
   * Create a new dataset instance
   * @param spec
   * @param skipFetchFields
   */
  async create(spec: DatasetSpec, skipFetchFields = false): Promise<Dataset> {
    const shortDotsEnable = await this.config.get(UI_SETTINGS.SHORT_DOTS_ENABLE);
    const metaFields = await this.config.get(UI_SETTINGS.META_FIELDS);

    const dataset = new Dataset({
      spec,
      savedObjectsClient: this.savedObjectsClient,
      fieldFormats: this.fieldFormats,
      shortDotsEnable,
      metaFields,
    });

    if (!skipFetchFields) {
      await this.refreshFields(dataset);
    }

    return dataset;
  }

  find = async (search: string, size: number = 10): Promise<Dataset[]> => {
    const savedObjects = await this.savedObjectsClient.find<DatasetSavedObjectAttrs>({
      type: 'dataset',
      fields: ['title'],
      search,
      searchFields: ['title'],
      perPage: size,
    });
    const getDatasetPromises = savedObjects.map(async (savedObject) => {
      return await this.get(savedObject.id);
    });
    return await Promise.all(getDatasetPromises);
  };

  /**
   * Create a new dataset and save it right away
   * @param spec
   * @param override Overwrite if existing dataset exists
   * @param skipFetchFields
   */
  async createAndSave(spec: DatasetSpec, override = false, skipFetchFields = false) {
    const dataset = await this.create(spec, skipFetchFields);
    await this.createSavedObject(dataset, override);
    await this.setDefault(dataset.id as string);
    return dataset;
  }

  /**
   * Save a new dataset
   * @param dataset
   * @param override Overwrite if existing dataset exists
   */
  async createSavedObject(dataset: Dataset, override = false) {
    const dupe = await findByTitle(
      this.savedObjectsClient,
      dataset.title,
      dataset.dataSourceRef?.id
    );
    if (dupe) {
      if (override) {
        await this.delete(dupe.id);
      } else {
        throw new DuplicateDatasetError(`Duplicate dataset: ${dataset.title}`);
      }
    }

    const body = dataset.getAsSavedObjectBody();
    const references = dataset.getSaveObjectReference();

    const response = await this.savedObjectsClient.create(savedObjectType, body, {
      id: dataset.id,
      references,
    });
    dataset.id = response.id;
    datasetCache.set(dataset.id, dataset);
    return dataset;
  }

  /**
   * Save existing dataset. Will attempt to merge differences if there are conflicts
   * @param dataset
   * @param saveAttempts
   */
  async updateSavedObject(
    dataset: Dataset,
    saveAttempts: number = 0,
    ignoreErrors: boolean = false
  ): Promise<void | Error> {
    if (!dataset.id) return;

    // get the list of attributes
    const body = dataset.getAsSavedObjectBody();
    const originalBody = dataset.getOriginalSavedObjectBody();

    // get changed keys
    const originalChangedKeys: string[] = [];
    Object.entries(body).forEach(([key, value]) => {
      if (value !== (originalBody as any)[key]) {
        originalChangedKeys.push(key);
      }
    });

    return this.savedObjectsClient
      .update(savedObjectType, dataset.id, body, { version: dataset.version })
      .then((resp) => {
        dataset.id = resp.id;
        dataset.version = resp.version;
      })
      .catch(async (err) => {
        if (err?.res?.status === 409 && saveAttempts++ < MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS) {
          const samePattern = await this.get(dataset.id as string);
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
            const title = i18n.translate('data.datasets.unableWriteLabel', {
              defaultMessage:
                'Unable to write dataset! Refresh the page to get the most up to date changes for this dataset.',
            });

            this.onNotification({ title, color: 'danger' });
            throw err;
          }

          // Set the updated response on this object
          serverChangedKeys.forEach((key) => {
            (dataset as any)[key] = (samePattern as any)[key];
          });
          dataset.version = samePattern.version;

          // Clear cache
          datasetCache.clear(dataset.id!);

          // Try the save again
          return this.updateSavedObject(dataset, saveAttempts, ignoreErrors);
        }
        throw err;
      });
  }

  /**
   * Deletes an dataset from .kibana index
   * @param datasetId: Id of OpenSearch Dashboards Dataset to delete
   */
  async delete(datasetId: string) {
    datasetCache.clear(datasetId);
    return this.savedObjectsClient.delete('dataset', datasetId);
  }

  isLongNumeralsSupported() {
    return this.config.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS);
  }
}

export type DatasetsContract = PublicMethodsOf<DatasetsService>;
