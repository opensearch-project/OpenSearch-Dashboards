/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { EuiIconProps } from '@elastic/eui';
import { Dataset, DatasetField, DataStructure } from '../../../../common';

/**
 * Abstract base class for dataset type configurations.
 * Extend this class to create specific dataset type handlers.
 */
export abstract class DatasetTypeConfig {
  /** Unique identifier for the dataset type */
  abstract id: string;

  /** Human-readable title for the dataset type */
  abstract title: string;

  /** Metadata for UI representation */
  abstract meta: {
    /** Icon to represent the dataset type */
    icon: EuiIconProps;
    /** Optional tooltip text */
    tooltip?: string;
  };

  /**
   * Converts a path of DataStructures to a Dataset.
   * @param path - Array of DataStructures representing the path to the dataset
   * @returns A Dataset object
   */
  abstract toDataset(path: DataStructure[]): Dataset;

  /**
   * Fetches child options for a given DataStructure path.
   * @param client - The saved objects client
   * @param path - Array of DataStructures representing the current path
   * @returns A promise resolving to a DataStructure
   */
  abstract fetch(client: SavedObjectsClientContract, path: DataStructure[]): Promise<DataStructure>;

  /**
   * Fetches fields for the dataset.
   * @param dataset - The Dataset to fetch fields for
   * @returns A promise resolving to an array of DatasetFields
   */
  abstract fetchFields(dataset: Dataset): Promise<DatasetField[]>;

  /**
   * Retrieves the supported query languages for this dataset type.
   * @param dataset - The Dataset to get supported languages for
   * @returns An array of supported language names
   */
  abstract supportedLanguages(dataset: Dataset): string[];
}
