/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { MatchedItem } from '../../components/create_dataset_wizard/types';

const indexPatternTypeName = i18n.translate(
  'datasetManagement.editDataset.createIndex.defaultTypeName',
  { defaultMessage: 'index pattern' }
);

const indexPatternButtonText = i18n.translate(
  'datasetManagement.editDataset.createIndex.defaultButtonText',
  { defaultMessage: 'Standard index pattern' }
);

const indexPatternButtonDescription = i18n.translate(
  'datasetManagement.editDataset.createIndex.defaultButtonDescription',
  { defaultMessage: 'Perform full aggregations against any data' }
);

export type UrlHandler = (url: string) => void;

export interface DatasetCreationOption {
  text: string;
  description: string;
  testSubj: string;
  onClick: () => void;
  isBeta?: boolean;
}

export class DatasetCreationConfig {
  public readonly key = 'default';

  protected type?: string;
  protected name: string;
  protected showSystemIndices: boolean;
  protected httpClient: object | null;
  protected isBeta: boolean;

  constructor({
    type = undefined,
    name = indexPatternTypeName,
    showSystemIndices = true,
    httpClient = null,
    isBeta = false,
  }: {
    type?: string;
    name?: string;
    showSystemIndices?: boolean;
    httpClient?: object | null;
    isBeta?: boolean;
  }) {
    this.type = type;
    this.name = name;
    this.showSystemIndices = showSystemIndices;
    this.httpClient = httpClient;
    this.isBeta = isBeta;
  }

  public getDatasetCreationOption(urlHandler: UrlHandler): DatasetCreationOption {
    return {
      text: indexPatternButtonText,
      description: indexPatternButtonDescription,
      testSubj: `createStandardDatasetButton`,
      onClick: () => {
        urlHandler('/create');
      },
    };
  }

  public getDatasetName() {
    return this.name;
  }

  public getIsBeta() {
    return this.isBeta;
  }

  public getShowSystemIndices() {
    return this.showSystemIndices;
  }

  public getIndexTags(indexName: string) {
    return [];
  }

  public checkIndicesForErrors(indices: MatchedItem[]) {
    return undefined;
  }

  public getDatasetMappings() {
    return {};
  }

  public renderPrompt() {
    return null;
  }

  public getFetchForWildcardOptions() {
    return {};
  }
}
