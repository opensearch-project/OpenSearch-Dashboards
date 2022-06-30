import { i18n } from '@osd/i18n';

// todo: rename
const dataSourceTypeName = i18n.translate(
  'dataSourceManagement.editIndexPattern.createIndex.defaultTypeName',
  { defaultMessage: 'data source' }
);

const dataSourceButtonText = i18n.translate(
  'dataSourceManagement.editIndexPattern.createIndex.defaultButtonText',
  { defaultMessage: 'Standard data source' }
);

const dataSourceButtonDescription = i18n.translate(
  'dataSourceManagement.editIndexPattern.createIndex.defaultButtonDescription',
  { defaultMessage: 'Perform full aggregations against any data' }
);

export type UrlHandler = (url: string) => void;

export interface DataSourceCreationOption {
  text: string;
  description: string;
  onClick: () => void;
  // testSubj: string;
  // isBeta?: boolean;
}

export class DataSourceCreationConfig {
  public readonly key = 'default';

  protected type?: string;
  protected name: string;
  protected httpClient: object | null;
  // protected isBeta: boolean;

  constructor({
    type = undefined,
    name = dataSourceTypeName,
    httpClient = null,
  }: {
    type?: string;
    name?: string;
    httpClient?: object | null;
  }) {
    this.type = type;
    this.name = name;
    this.httpClient = httpClient;
  }

  public getDataSourceCreationOption(urlHandler: UrlHandler): DataSourceCreationOption {
    return {
      text: dataSourceButtonText,
      description: dataSourceButtonDescription,
      onClick: () => {
        urlHandler('/create');
      },
    };
  }

  public getDataSourceType() {
    return this.type;
  }

  public getDataSourceName() {
    return this.name;
  }

  public renderPrompt() {
    return null;
  }

  public getFetchForWildcardOptions() {
    return {};
  }
}
