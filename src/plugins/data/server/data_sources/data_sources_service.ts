import {
  CoreSetup,
  CoreStart,
  Plugin,
  OpenSearchDashboardsRequest,
  Logger,
  SavedObjectsClientContract,
  SavedObject,
} from 'opensearch-dashboards/server';
import { dataSourceSavedObjectType } from '../saved_objects/data_sources';

export interface DataSourcesServiceStart {
  dataSourcesServiceFactory: (
    opensearchDashboardsRequest: OpenSearchDashboardsRequest
  ) => Promise<DataSourcesServerService>;
}


export interface SavedObjectsClientCommonFindArgs {
  type: string | string[];
  fields?: string[];
  perPage?: number;
  search?: string;
  searchFields?: string[];
}

export class SavedObjectsServerClient {
  private savedObjectClient: SavedObjectsClientContract;
  constructor(savedObjectClient: SavedObjectsClientContract) {
    this.savedObjectClient = savedObjectClient;
  }
  async find<T = unknown>(options: SavedObjectsClientCommonFindArgs) {
    const result = await this.savedObjectClient.find<T>(options);
    return result.saved_objects;
  }

  async get<T = unknown>(type: string, id: string) {
    return await this.savedObjectClient.get<T>(type, id);
  }
  async update<T = unknown>(
    type: string,
    id: string,
    attributes: Record<string, any>,
    options: Record<string, any>
  ) {
    return (await this.savedObjectClient.update(type, id, attributes, options)) as SavedObject<T>;
  }
  async create(type: string, attributes: Record<string, any>, options: Record<string, any>) {
    return await this.savedObjectClient.create(type, attributes, options);
  }
  delete(type: string, id: string) {
    return this.savedObjectClient.delete(type, id);
  }
}

export class DataSourcesServerService {
  private savedObjectsClient: SavedObjectsServerClient;

  constructor(savedObjectsClient: SavedObjectsServerClient) {
    this.savedObjectsClient = savedObjectsClient;
  }
}

export const capabilitiesProvider = () => ({
  dataSources: {
    save: true,
  },
});

export interface DataSourcesServiceStartDeps {
  logger: Logger;
}

export class DataSourcesService implements Plugin<void, DataSourcesServiceStart> {
  public setup(core: CoreSetup) {
    core.savedObjects.registerType(dataSourceSavedObjectType);
    core.capabilities.registerProvider(capabilitiesProvider);

    // register route handlers here if any
  }

  public start(core: CoreStart, { logger } : DataSourcesServiceStartDeps) {
    const savedObjects = core.savedObjects;
    return {
      dataSourcesServiceFactory: async (opensearchDashboardsRequest: OpenSearchDashboardsRequest) => {
        const savedObjectsClient = savedObjects.getScopedClient(opensearchDashboardsRequest);
        return new DataSourcesServerService(new SavedObjectsServerClient(savedObjectsClient));
      }
    }
  }
}