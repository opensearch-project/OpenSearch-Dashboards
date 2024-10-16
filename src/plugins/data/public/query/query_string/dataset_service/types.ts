/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiIconProps } from '@elastic/eui';
import { HttpSetup } from '../../../../../../core/public';
import { Dataset, DatasetField, DatasetSearchOptions, DataStructure } from '../../../../common';
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

/**
 * Configuration for handling dataset operations.
 */
export interface DatasetTypeConfig {
  /** Unique identifier for the dataset handler */
  id: string;
  /** Human-readable title for the dataset type */
  title: string;
  /** Metadata for UI representation */
  meta: {
    /** Icon to represent the dataset type */
    icon: EuiIconProps;
    /** Optional tooltip text */
    tooltip?: string;
    /** Optional preference for search on page load else defaulted to true */
    searchOnLoad?: boolean;
    /** Optional supportsTimeFilter determines if a time filter is needed */
    supportsTimeFilter?: boolean;
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
  fetchFields: (dataset: Dataset, http?: HttpSetup) => Promise<DatasetField[]>;
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
}
