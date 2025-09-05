/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { SavedObjectsClientCommon, Dataset, DEFAULT_DATA, UI_SETTINGS, SavedObject } from '../..';
import { DataView } from './data_view';
import { createEnsureDefaultDataView, EnsureDefaultDataView } from './ensure_default_data_view';
import { IndexPatternsService } from '../../index_patterns';
import {
  DataViewOnNotification,
  DataViewOnError,
  DataViewOnUnsupportedTimePattern,
  DataViewUiSettingsCommon,
  IDataViewsApiClient,
  DataViewGetFieldsOptions,
  DataViewSpec,
  DataViewAttributes,
  DataViewFieldSpec,
  DataViewFieldMap,
} from '../types';
import { FieldFormatMap, SignalType } from '../../index_patterns/types';
import { FieldFormatsStartCommon } from '../../field_formats';
import { SavedObjectNotFound } from '../../../../opensearch_dashboards_utils/common';
import { DataViewMissingIndices } from '../lib';
import { findByTitle, getDataViewTitle } from '../utils';
import { DuplicateDataViewError, MissingDataViewError } from '../errors';

const MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS = 3;
const savedObjectType = 'index-pattern';

export interface DataViewSavedObjectAttrs {
  title: string;
  displayName?: string;
}

interface DataViewsServiceDeps {
  patterns: IndexPatternsService;
  uiSettings: DataViewUiSettingsCommon;
  savedObjectsClient: SavedObjectsClientCommon;
  apiClient: IDataViewsApiClient;
  fieldFormats: FieldFormatsStartCommon;
  onNotification: DataViewOnNotification;
  onError: DataViewOnError;
  onRedirectNoDataView?: () => void;
  onUnsupportedTimePattern: DataViewOnUnsupportedTimePattern;
  canUpdateUiSetting?: boolean;
}

/**
 * @experimental This class is experimental and may change in future versions
 */
export class DataViewsService {
  private config: DataViewUiSettingsCommon;
  private savedObjectsClient: SavedObjectsClientCommon;
  private savedObjectsCache?: Array<SavedObject<DataViewSavedObjectAttrs>> | null;
  private apiClient: IDataViewsApiClient;
  private fieldFormats: FieldFormatsStartCommon;
  private onNotification: DataViewOnNotification;
  private onError: DataViewOnError;
  private onUnsupportedTimePattern: DataViewOnUnsupportedTimePattern;
  private patterns: IndexPatternsService;
  ensureDefaultDataView: EnsureDefaultDataView;

  constructor({
    patterns,
    uiSettings,
    savedObjectsClient,
    apiClient,
    fieldFormats,
    onNotification,
    onError,
    onUnsupportedTimePattern,
    onRedirectNoDataView = () => {},
    canUpdateUiSetting,
  }: DataViewsServiceDeps) {
    this.apiClient = apiClient;
    this.config = uiSettings;
    this.savedObjectsClient = savedObjectsClient;
    this.fieldFormats = fieldFormats;
    this.onNotification = onNotification;
    this.onError = onError;
    this.onUnsupportedTimePattern = onUnsupportedTimePattern;
    this.patterns = patterns;
    this.ensureDefaultDataView = createEnsureDefaultDataView(
      uiSettings,
      onRedirectNoDataView,
      canUpdateUiSetting,
      savedObjectsClient
    );
  }

  /**
   * Refresh cache of data view ids and titles
   */
  private async refreshSavedObjectsCache() {
    this.savedObjectsCache = await this.savedObjectsClient.find<DataViewSavedObjectAttrs>({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000,
    });

    this.savedObjectsCache = await Promise.all(
      this.savedObjectsCache.map(async (obj) => {
        // TODO: This behaviour will cause the data view title to be resolved differently depending on how its fetched since the get method in this service will not append the datasource title
        if (obj.type === 'index-pattern') {
          const result = { ...obj };
          result.attributes.title = await getDataViewTitle(
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
      fields: ['title', 'dataSourceEngineType'],
      search: title,
      searchFields: ['title'],
      perPage: size,
    });

    return savedObjectsResponse[0] || undefined;
  };

  /**
   * Get list of data view ids
   * @param refresh Force refresh of data view list
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
   * Get list of data view titles
   * @param refresh Force refresh of data view list
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
   * Get list of data view ids with titles
   * @param refresh Force refresh of data view list
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
   * Clear data view list cache
   * @param id optionally clear a single id
   */
  clearCache = (id?: string, clearSavedObjectsCache: boolean = true) => {
    if (clearSavedObjectsCache) {
      this.savedObjectsCache = null;
    }
    this.patterns.clearCache(id, clearSavedObjectsCache);
  };

  getCache = async () => {
    if (!this.savedObjectsCache) {
      await this.refreshSavedObjectsCache();
    }
    return this.savedObjectsCache;
  };

  saveToCache = (id: string, dataView: DataView) => {
    this.patterns.saveToCache(id, dataView);
  };

  /**
   * Get default data view
   */
  getDefault = async () => {
    const defaultDataViewId = await this.config.get('defaultIndex');
    if (defaultDataViewId) {
      return await this.get(defaultDataViewId);
    }

    return null;
  };

  /**
   * Optionally set default data view, unless force = true
   * @param id
   * @param force
   */
  setDefault = async (id: string, force = false) => {
    if (force || !this.config.get('defaultIndex')) {
      await this.config.set('defaultIndex', id);
    }
  };

  private isFieldRefreshRequired(specs?: DataViewFieldMap): boolean {
    if (!specs) {
      return true;
    }

    return Object.values(specs).every((spec) => {
      // See https://github.com/elastic/kibana/pull/8421
      const hasFieldCaps = 'aggregatable' in spec && 'searchable' in spec;

      // See https://github.com/elastic/kibana/pull/11969
      const hasDocValuesFlag = 'readFromDocValues' in spec;

      return !hasFieldCaps || !hasDocValuesFlag;
    });
  }

  /**
   * Get field list by providing { pattern }
   * @param options
   */
  getFieldsForWildcard = async (options: DataViewGetFieldsOptions = {}) => {
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
  getFieldsForDataView = async (
    dataView: DataView | DataViewSpec,
    options: DataViewGetFieldsOptions = {}
  ) =>
    this.getFieldsForWildcard({
      pattern: dataView.title as string,
      ...options,
      type: dataView.type,
      params: dataView.typeMeta && dataView.typeMeta.params,
      dataSourceId: dataView.dataSourceRef?.id,
    });

  /**
   * Refresh field list for a given data view
   * @param dataView
   */
  refreshFields = async (dataView: DataView, skipType = false) => {
    try {
      const dataViewCopy = skipType ? ({ ...dataView, type: undefined } as DataView) : dataView;

      const fields = await this.getFieldsForDataView(dataViewCopy);
      const scripted = dataView.getScriptedFields().map((field) => field.spec);
      dataView.fields.replaceAll([...fields, ...scripted]);
    } catch (err) {
      if (err instanceof DataViewMissingIndices) {
        this.onNotification({ title: (err as any).message, color: 'danger', iconType: 'alert' });
      }

      this.onError(err, {
        title: i18n.translate('data.dataViews.fetchFieldErrorTitle', {
          defaultMessage: 'Error fetching fields for data view {title} (ID: {id})',
          values: { id: dataView.id, title: dataView.title },
        }),
      });
    }
  };

  /**
   * Refreshes a field list from a spec before an data view instance is created
   * @param fields
   * @param id
   * @param title
   * @param options
   */
  private refreshFieldSpecMap = async (
    fields: DataViewFieldMap,
    id: string,
    title: string,
    options: DataViewGetFieldsOptions
  ) => {
    const scriptdFields = Object.values(fields).filter((field) => field.scripted);
    try {
      const newFields = await this.getFieldsForWildcard(options);
      return this.fieldArrayToMap([...newFields, ...scriptdFields]);
    } catch (err) {
      if (err instanceof DataViewMissingIndices) {
        this.onNotification({ title: (err as any).message, color: 'danger', iconType: 'alert' });
        return {};
      }

      this.onError(err, {
        title: i18n.translate('data.dataViews.fetchFieldErrorTitle', {
          defaultMessage: 'Error fetching fields for data view {title} (ID: {id})',
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
  private addFormatsToFields = (
    fieldSpecs: DataViewFieldSpec[],
    fieldFormatMap: FieldFormatMap
  ) => {
    Object.entries(fieldFormatMap).forEach(([fieldName, value]) => {
      const field = fieldSpecs.find((fld: DataViewFieldSpec) => fld.name === fieldName);
      if (field) {
        field.format = value;
      }
    });
  };

  /**
   * Converts field array to map
   * @param fields
   */
  fieldArrayToMap = (fields: DataViewFieldSpec[]) =>
    fields.reduce<DataViewFieldMap>((collector, field) => {
      collector[field.name] = field;
      return collector;
    }, {});

  /**
   * Converts data view saved object to data view spec
   * @param savedObject
   */
  savedObjectToSpec = (savedObject: SavedObject<DataViewAttributes>): DataViewSpec => {
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
        signalType,
      },
      references,
    } = savedObject;

    const parsedSourceFilters = sourceFilters ? JSON.parse(sourceFilters) : undefined;
    const parsedTypeMeta = typeMeta ? JSON.parse(typeMeta) : undefined;
    const parsedFieldFormatMap = fieldFormatMap ? JSON.parse(fieldFormatMap) : {};
    const parsedFields: DataViewFieldSpec[] = fields ? JSON.parse(fields) : [];
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
      signalType: signalType as SignalType,
    };
  };

  /**
   * Get an data view by id. Cache optimized
   * @param id
   * @param onlyCheckCache - Only check cache for data view if it doesn't exist it will not error out
   */
  get = async (id: string, onlyCheckCache: boolean = false): Promise<DataView> => {
    const cache = await this.patterns.get(id, true);

    if (cache || onlyCheckCache) {
      return cache as DataView;
    }

    const savedObject = await this.savedObjectsClient.get<DataViewAttributes>(savedObjectType, id);

    if (!savedObject.version) {
      throw new SavedObjectNotFound(
        savedObjectType,
        id,
        'management/opensearch-dashboards/indexPatterns'
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
      if (err instanceof DataViewMissingIndices) {
        this.onNotification({
          title: (err as any).message,
          color: 'danger',
          iconType: 'alert',
        });
      } else {
        this.onError(err, {
          title: i18n.translate('data.dataViews.fetchFieldErrorTitle', {
            defaultMessage: 'Error fetching fields for data view {title} (ID: {id})',
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

    const dataView = await this.create(spec, true);
    this.patterns.saveToCache(id, dataView);
    if (isSaveRequired) {
      try {
        this.updateSavedObject(dataView);
      } catch (err) {
        this.onError(err, {
          title: i18n.translate('data.dataViews.fetchFieldSaveErrorTitle', {
            defaultMessage: 'Error saving after fetching fields for data view {title} (ID: {id})',
            values: {
              id: dataView.id,
              title: dataView.title,
            },
          }),
        });
      }
    }

    if (dataView.isUnsupportedTimePattern()) {
      this.onUnsupportedTimePattern({
        id: dataView.id as string,
        title: dataView.title,
        index: dataView.getIndex(),
      });
    }

    dataView.resetOriginalSavedObjectBody();
    return dataView;
  };

  /**
   * Get an data view by title if cached
   * @param id
   */
  getByTitle = (title: string, ignoreErrors: boolean = false): DataView => {
    const dataView = this.patterns.getByTitle(title);
    if (!dataView && !ignoreErrors) {
      throw new MissingDataViewError(`Missing data view: ${title}`);
    }
    return dataView as DataView;
  };

  migrate(dataView: DataView, newTitle: string) {
    return this.savedObjectsClient
      .update<DataViewAttributes>(
        savedObjectType,
        dataView.id!,
        {
          title: newTitle,
          intervalName: null,
        },
        {
          version: dataView.version,
        }
      )
      .then(({ attributes: { title, intervalName } }) => {
        dataView.title = title;
        dataView.intervalName = intervalName;
      })
      .then(() => this);
  }

  /**
   * Create a new data view instance
   * @param spec
   * @param skipFetchFields
   */
  async create(spec: DataViewSpec, skipFetchFields = false): Promise<DataView> {
    const shortDotsEnable = await this.config.get(UI_SETTINGS.SHORT_DOTS_ENABLE);
    const metaFields = await this.config.get(UI_SETTINGS.META_FIELDS);

    const dataView = new DataView({
      spec,
      savedObjectsClient: this.savedObjectsClient,
      fieldFormats: this.fieldFormats,
      shortDotsEnable,
      metaFields,
    });

    if (!skipFetchFields) {
      await this.refreshFields(dataView);
    }

    return dataView;
  }

  find = async (search: string, size: number = 10): Promise<DataView[]> => {
    const savedObjects = await this.savedObjectsClient.find<DataViewSavedObjectAttrs>({
      type: 'index-pattern',
      fields: ['title'],
      search,
      searchFields: ['title'],
      perPage: size,
    });
    const getDataViewPromises = savedObjects.map(async (savedObject) => {
      return await this.get(savedObject.id);
    });
    return await Promise.all(getDataViewPromises);
  };

  /**
   * Create a new data view and save it right away
   * @param spec
   * @param override Overwrite if existing data view exists
   * @param skipFetchFields
   */
  async createAndSave(spec: DataViewSpec, override = false, skipFetchFields = false) {
    const dataView = await this.create(spec, skipFetchFields);
    await this.createSavedObject(dataView, override);
    await this.setDefault(dataView.id as string);
    return dataView;
  }

  /**
   * Save a new data view
   * @param dataView
   * @param override Overwrite if existing data view exists
   */

  async createSavedObject(dataView: DataView, override = false) {
    const dupe = await findByTitle(
      this.savedObjectsClient,
      dataView.title,
      dataView.dataSourceRef?.id
    );
    if (dupe) {
      if (override) {
        await this.delete(dupe.id);
      } else {
        throw new DuplicateDataViewError(`Duplicate data view: ${dataView.title}`);
      }
    }

    const body = dataView.getAsSavedObjectBody();
    const references = dataView.getSaveObjectReference();

    const response = await this.savedObjectsClient.create(savedObjectType, body, {
      id: dataView.id,
      references,
    });
    dataView.id = response.id;
    this.patterns.saveToCache(dataView.id, dataView);
    return dataView;
  }

  /**
   * Save existing data view. Will attempt to merge differences if there are conflicts
   * @param dataView
   * @param saveAttempts
   */
  async updateSavedObject(
    dataView: DataView,
    saveAttempts: number = 0,
    ignoreErrors: boolean = false
  ): Promise<void | Error> {
    if (!dataView.id) return;

    const body = dataView.getAsSavedObjectBody();
    const originalBody = dataView.getOriginalSavedObjectBody();

    const originalChangedKeys: string[] = [];
    Object.entries(body).forEach(([key, value]) => {
      if (value !== (originalBody as any)[key]) {
        originalChangedKeys.push(key);
      }
    });

    return this.savedObjectsClient
      .update(savedObjectType, dataView.id, body, { version: dataView.version })
      .then((resp) => {
        dataView.id = resp.id;
        dataView.version = resp.version;
      })
      .catch(async (err) => {
        if (err?.res?.status === 409 && saveAttempts++ < MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS) {
          const samePattern = await this.get(dataView.id as string);
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
            const title = i18n.translate('data.dataViews.unableWriteLabel', {
              defaultMessage:
                'Unable to write data view! Refresh the page to get the most up to date changes for this data view.',
            });

            this.onNotification({ title, color: 'danger' });
            throw err;
          }

          serverChangedKeys.forEach((key) => {
            (dataView as any)[key] = (samePattern as any)[key];
          });
          dataView.version = samePattern.version;
          this.patterns.clearCache(dataView.id!);
          return this.updateSavedObject(dataView, saveAttempts, ignoreErrors);
        }
        throw err;
      });
  }

  /**
   * Deletes an data view from .kibana index
   * @param dataViewId: Id of OpenSearch Dashboards Index Pattern to delete
   */
  async delete(dataViewId: string) {
    this.patterns.clearCache(dataViewId);
    return this.savedObjectsClient.delete('index-pattern', dataViewId);
  }

  isLongNumeralsSupported() {
    return this.config.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS);
  }

  /**
   * Convert a DataView to a Dataset object
   * @experimental This method is experimental and may change in future versions
   * @param dataView DataView object to convert to Dataset
   */
  async convertToDataset(dataView: DataView): Promise<Dataset> {
    if (dataView.toDataset) {
      return await dataView.toDataset();
    }

    return {
      id: dataView.id || '',
      title: dataView.title,
      type: dataView.type || DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      timeFieldName: dataView.timeFieldName,
      ...(dataView.dataSourceRef?.id && {
        dataSource: {
          id: dataView.dataSourceRef.id,
          title: dataView.dataSourceRef.name || dataView.dataSourceRef.id,
          type: dataView.dataSourceRef.type || DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
        },
      }),
    };
  }
}

export type DataViewsContract = PublicMethodsOf<DataViewsService>;
