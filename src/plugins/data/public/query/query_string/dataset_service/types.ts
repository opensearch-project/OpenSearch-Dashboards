/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiIconProps } from '@elastic/eui';
import {
  Dataset,
  DatasetField,
  DatasetSearchOptions,
  DataStructure,
  Query,
  SavedObject,
} from '../../../../common';
import { IDataPluginServices } from '../../../types';

/**
 * Options for fetching the data structure.
 */
export interface DataStructureFetchOptions {
  /** Search string to filter results */
  search?: string;
  /** Token for paginated results */
  paginationToken?: string;
}

export interface DatasetIndexedView {
  name: string;
}

export interface DatasetIndexedViewsService {
  getIndexedViews: (dataset: Dataset) => Promise<DatasetIndexedView[]>;
  /**
   * Returns the data source saved object connected with the data connection object
   */
  getConnectedDataSource: (dataset: Dataset) => Promise<SavedObject>;
}

/**
 * Configuration for handling dataset operations.
 */
export interface DatasetTypeConfig {
  /** Unique identifier for the dataset handler */
  id: string;
  /** Human-readable title for the dataset type */
  title: string;
  languageOverrides?: {
    [language: string]: {
      /** The override transfers the responsibility of handling the input from
       * the language interceptor to the dataset type search strategy. */
      hideDatePicker?: boolean;
    };
  };
  /** Metadata for UI representation */
  meta: {
    /** Icon to represent the dataset type */
    icon: EuiIconProps;
    /** Optional tooltip text */
    tooltip?: string;
    /** Optional preference for search on page load else defaulted to true */
    searchOnLoad?: boolean;
    /** Optional supportsTimeFilter determines if a time field is supported */
    supportsTimeFilter?: boolean;
    /** Optional isFieldLoadAsync determines if field loads are async */
    isFieldLoadAsync?: boolean;
    /** Optional cacheOptions determines if the data structure is cacheable. Defaults to false */
    cacheOptions?: boolean;
  };
  /**
   * Converts a DataStructure to a Dataset.
   * @param {DataStructure} dataStructure - The data structure to convert.
   * @returns {Dataset} Dataset.
   */
  toDataset: (path: DataStructure[]) => Dataset;
  /**
   * Fetches child data structures and populates corresponding properties for a given DataStructure.
   * @param {IDataPluginServices} services - The data plugin services.
   * @param {DataStructure} dataStructure - The parent DataStructure.
   * @param {DataStructureFetchOptions} options - The fetch options for pagination and search.
   * @returns {Promise<DataStructure>} A promise that resolves to the updated DataStructure.
   */
  fetch: (
    services: IDataPluginServices,
    path: DataStructure[],
    options?: DataStructureFetchOptions
  ) => Promise<DataStructure>;
  /**
   * Fetches fields for the dataset.
   * @returns {Promise<DatasetField[]>} A promise that resolves to an array of DatasetFields.
   */
  fetchFields: (
    dataset: Dataset,
    services?: Partial<IDataPluginServices>
  ) => Promise<DatasetField[]>;
  /**
   * Retrieves the supported query languages for this dataset type.
   * @returns {Promise<string[]>} A promise that resolves to an array of supported language ids.
   */
  supportedLanguages: (dataset: Dataset) => string[];
  /**
   * Retrieves the search options to be used for running the query on the data connection associated
   * with this Dataset
   */
  getSearchOptions?: () => DatasetSearchOptions;
  /**
   * Combines a list of user selected data structures into a single one to use in discover.
   * @see https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8362.
   */
  combineDataStructures?: (dataStructures: DataStructure[]) => DataStructure | undefined;
  /**
   * Returns a list of sample queries for this dataset type
   */
  getSampleQueries?: (dataset?: Dataset, language?: string) => Promise<any> | any;
  /**
   * Service used for indexedViews related operations
   */
  indexedViewsService?: DatasetIndexedViewsService;
  /**
   * Returns the initial query that is added to the query editor when a dataset is selected.
   */
  getInitialQueryString?: (query: Query) => string | void;
}
