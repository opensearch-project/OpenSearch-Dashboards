import { SavedObject } from '../../../plugins/saved_objects/public';

export interface DsParams {
  [key: string]: any;
}

export interface SavedDsState {
  title: string;
  type: string;
  params: DsParams;
}

export interface ISavedDataSource {
  id?: string;
  title: string;
  endpoint: string;
  description?: string;
  credientialsJSON: string;
  dsState: SavedDsState;
  uiStateJSON?: string;
}

export interface DataSourceSavedObject extends SavedObject, ISavedDataSource {}
