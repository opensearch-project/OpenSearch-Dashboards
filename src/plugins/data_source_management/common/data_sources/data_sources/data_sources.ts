import {
  OnError,
  OnNotification,
  SavedObject,
  SavedObjectsClientCommon,
  UiSettingsCommon,
} from '../types';

export interface DataSourceSavedObjectAttrs {
  title: string;
}

interface DataSourcesServiceDeps {
  uiSettings: UiSettingsCommon;
  savedObjectsClient: SavedObjectsClientCommon;
  onNotification: OnNotification;
  onError: OnError;
}

export class DataSroucesService {
  private config: UiSettingsCommon;
  private savedObjectsClient: SavedObjectsClientCommon;
  private savedObjectsCache?: Array<SavedObject<DataSourceSavedObjectAttrs>> | null;
  // private apiClient
  private onNotification: OnNotification;
  private onError: OnError;

  constructor({ uiSettings, savedObjectsClient, onNotification, onError }: DataSourcesServiceDeps) {
    this.config = uiSettings;
    this.savedObjectsClient = savedObjectsClient;
    this.onNotification = onNotification;
    this.onError = onError;
  }
}
