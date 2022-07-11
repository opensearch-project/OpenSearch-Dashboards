import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { extractReferences, injectReferences } from './saved_data_source_references';

export function createSavedDataSourceClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedDataSource extends SavedObjectClass {
    public static type: string = 'data-source';
    public static mapping = {
      title: 'text',
      description: 'text',
      endpoint: 'text',
      credientialsJSON: 'text',
      version: 'integer',
      // todo
    };

    public static defaultMapping = {
      title: 'dummy',
      description: 'dummy des',
      endpoint: 'dummp ep',
      credientialsJSON: '[]',
      version: 1,
      // todo
    };

    public id: string;

    constructor(id: string) {
      super({
        type: SavedDataSource.type,
        mapping: SavedDataSource.mapping,
        extractReferences,
        injectReferences,
        id,
        searchSource: true, // todo: witf?
        defaults: SavedDataSource.defaultMapping,
      });

      this.id = id;
      this.getFullPath = () => `/app/dataSource#/edit/${this.id}`; // todo: dataSources?
    }
  }

  return SavedDataSource as new (id: string) => SavedObject;
}
