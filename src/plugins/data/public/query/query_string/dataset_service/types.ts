/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiIconProps } from '@elastic/eui';
import { Dataset, DatasetField, DataStructure } from '../../../../common';
import { IDataPluginServices } from '../../../types';

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
  };
  /**
   * Converts a DataStructure to a Dataset.
   * @param {DataStructure} dataStructure - The data structure to convert.
   * @returns {Dataset} Dataset.
   */
  toDataset: (path: DataStructure[]) => Dataset;
  /**
   * Fetches child options for a given DataStructure.
   * @param {IDataPluginServices} services - The data plugin services.
   * @param {DataStructure} dataStructure - The parent DataStructure.
   * @returns {Promise<DatasetHandlerFetchResponse>} A promise that resolves to a DatasetHandlerFetchResponse.
   */
  fetch: (services: IDataPluginServices, path: DataStructure[]) => Promise<DataStructure>;
  /**
   * Fetches fields for the dataset.
   * @returns {Promise<DatasetField[]>} A promise that resolves to an array of DatasetFields.
   */
  fetchFields: (dataset: Dataset) => Promise<DatasetField[]>;
  /**
   * Retrieves the supported query languages for this dataset type.
   * @returns {Promise<string[]>} A promise that resolves to an array of supported language ids.
   */
  supportedLanguages: (dataset: Dataset) => string[];
}
